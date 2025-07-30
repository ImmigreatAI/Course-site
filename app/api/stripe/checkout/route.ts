import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getServerStripe } from '@/lib/stripe/config'
import { coursesData } from '@/lib/data/courses'
import { z } from 'zod'
import Stripe from 'stripe'

// Input validation schema
const CheckoutItemSchema = z.object({
  courseId: z.string().min(1, 'Course ID is required'),
  courseName: z.string().min(1, 'Course name is required'),
  planLabel: z.enum(['6mo', '7day'], { message: 'Plan label must be "6mo" or "7day"' }),
  price: z.number().min(0, 'Price must be non-negative'),
  enrollmentId: z.string().min(1, 'Enrollment ID is required'),
  stripePriceId: z.string().min(1, 'Stripe price ID is required'),
})

const CheckoutRequestSchema = z.object({
  items: z.array(CheckoutItemSchema).min(1, 'At least one item is required'),
})

type CheckoutItem = z.infer<typeof CheckoutItemSchema>

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const body = await req.json()
    const parseResult = CheckoutRequestSchema.safeParse(body)
    if (!parseResult.success) {
      return NextResponse.json({
        error: 'Invalid request data',
        details: parseResult.error.issues.map(issue => ({
          field: issue.path.join('.'),
          message: issue.message
        }))
      }, { status: 400 })
    }

    const { items } = parseResult.data
    const lineItems: Array<{ price: string; quantity: number }> = []
    const enrollmentIds: string[] = []

    for (const item of items) {
      const course = coursesData.find(c => c.course.Unique_id === item.courseId)
      if (!course) {
        return NextResponse.json({ error: `Course not found: ${item.courseId}` }, { status: 400 })
      }

      const plan = course.plans.find(p => p.label === item.planLabel)
      if (!plan) {
        return NextResponse.json({ error: `Plan "${item.planLabel}" not found for course "${item.courseName}"` }, { status: 400 })
      }

      if (plan.price !== item.price) {
        return NextResponse.json({
          error: `Price mismatch for "${item.courseName}". Expected: ${plan.price}, Received: ${item.price}`
        }, { status: 400 })
      }

      if (plan.enrollment_id !== item.enrollmentId) {
        return NextResponse.json({ error: `Enrollment ID mismatch for "${item.courseName}"` }, { status: 400 })
      }

      enrollmentIds.push(plan.enrollment_id)
      if (plan.price > 0) {
        if (!plan.stripe_price_id.startsWith('price_')) {
          return NextResponse.json({ error: `Invalid Stripe price ID format for "${item.courseName}". Must start with "price_"` }, { status: 400 })
        }
        lineItems.push({ price: plan.stripe_price_id, quantity: 1 })
      }
    }

    if (lineItems.length === 0) {
      console.log('Free course enrollment:', { userId, enrollmentIds })
      return NextResponse.json({ sessionId: null, isFree: true, enrollmentIds, message: 'Free courses enrolled successfully' })
    }

    const stripe = getServerStripe()
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: `${req.nextUrl.origin}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.nextUrl.origin}/cancel`,
      metadata: {
        userId,
        enrollmentIds: JSON.stringify(enrollmentIds),
        itemCount: items.length.toString(),
        courseIds: JSON.stringify(items.map(i => i.courseId)),
      },
      allow_promotion_codes: true,
      billing_address_collection: 'auto',
      payment_intent_data: { metadata: { userId, type: 'course_purchase' } },
      expires_at: Math.floor(Date.now() / 1000) + 30 * 60,
    })

    return NextResponse.json({ sessionId: session.id, isFree: false, url: session.url })
  } catch (error: unknown) {
    console.error('Checkout API error:', error)

    // Use Stripe.errors.StripeError per stripe-node typings workaround
    if (error instanceof Stripe.errors.StripeError) {
      switch (error.type) {
        case 'StripeCardError':
          return NextResponse.json({ error: 'Payment failed. Please check your card details.' }, { status: 400 })
        case 'StripeRateLimitError':
          return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 })
        case 'StripeInvalidRequestError':
          return NextResponse.json({ error: 'Invalid payment request. Please try again.' }, { status: 400 })
        case 'StripeAPIError':
        case 'StripeConnectionError':
          return NextResponse.json({ error: 'Payment service temporarily unavailable. Please try again.' }, { status: 503 })
      }
    }

    // Fallback for any other error
    return NextResponse.json({ error: 'An unexpected error occurred. Please try again.' }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 })
}
