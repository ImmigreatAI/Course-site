// app/api/stripe/checkout/route.ts
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

// Define proper types
type CheckoutItem = z.infer<typeof CheckoutItemSchema>

interface CheckoutResponse {
  sessionId?: string | null  // Allow null for free courses
  isFree: boolean
  url?: string | null        // Allow null as Stripe can return null
  enrollmentIds?: string[]
  message?: string
  error?: string
}

export async function POST(req: NextRequest): Promise<NextResponse<CheckoutResponse>> {
  try {
    // Authenticate user
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required', isFree: false },
        { status: 401 }
      )
    }

    // Parse and validate request body
    const body = await req.json()
    const parseResult = CheckoutRequestSchema.safeParse(body)
    
    if (!parseResult.success) {
      return NextResponse.json({
        error: 'Invalid request data',
        isFree: false,
        // details: parseResult.error.issues.map(issue => ({
        //   field: issue.path.join('.'),
        //   message: issue.message
        // }))
      }, { status: 400 })
    }

    const { items } = parseResult.data
    const lineItems: Array<{ price: string; quantity: number }> = []
    const enrollmentIds: string[] = []

    // Validate each item against course data
    for (const item of items) {
      const course = coursesData.find(c => c.course.Unique_id === item.courseId)
      if (!course) {
        return NextResponse.json(
          { 
            error: `Course not found: ${item.courseId}`, 
            isFree: false 
          }, 
          { status: 400 }
        )
      }

      const plan = course.plans.find(p => p.label === item.planLabel)
      if (!plan) {
        return NextResponse.json({
          error: `Plan "${item.planLabel}" not found for course "${item.courseName}"`,
          isFree: false
        }, { status: 400 })
      }

      // Validate price matches exactly
      if (plan.price !== item.price) {
        return NextResponse.json({
          error: `Price mismatch for "${item.courseName}". Expected: ${plan.price}, Received: ${item.price}`,
          isFree: false
        }, { status: 400 })
      }

      // Validate enrollment ID matches
      if (plan.enrollment_id !== item.enrollmentId) {
        return NextResponse.json({
          error: `Enrollment ID mismatch for "${item.courseName}"`,
          isFree: false
        }, { status: 400 })
      }

      enrollmentIds.push(plan.enrollment_id)

      // For paid courses, prepare Stripe line items
      if (plan.price > 0) {
        // Validate stripe_price_id format
        if (!plan.stripe_price_id.startsWith('price_')) {
          return NextResponse.json({
            error: `Invalid Stripe price ID format for "${item.courseName}". Must start with "price_"`,
            isFree: false
          }, { status: 400 })
        }

        lineItems.push({
          price: plan.stripe_price_id,
          quantity: 1,
        })
      }
    }

    // If all items are free, handle enrollment directly
    if (lineItems.length === 0) {
      console.log('Free course enrollment:', { userId, enrollmentIds })
      return NextResponse.json({
        sessionId: null,
        isFree: true,
        enrollmentIds,
        message: 'Free courses enrolled successfully'
      })
    }

    // Create Stripe checkout session for paid items
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
        courseIds: JSON.stringify(items.map((item: CheckoutItem) => item.courseId)),
      },
      allow_promotion_codes: true,
      billing_address_collection: 'auto',
      payment_intent_data: {
        metadata: {
          userId,
          type: 'course_purchase',
        },
      },
      expires_at: Math.floor(Date.now() / 1000) + (30 * 60), // 30 minutes expiry
    })

    return NextResponse.json({
      sessionId: session.id,
      isFree: false,
      url: session.url,
    })

  } catch (error) {
    console.error('Checkout API error:', error)
    
    // Handle specific Stripe errors with proper typing
    if (error && typeof error === 'object' && 'type' in error) {
      const stripeError = error as Stripe.StripeRawError
      
      switch (stripeError.type) {
        case 'card_error':
          return NextResponse.json({
            error: 'Payment failed. Please check your card details.',
            isFree: false
          }, { status: 400 })
        case 'rate_limit_error':
          return NextResponse.json({
            error: 'Too many requests. Please try again later.',
            isFree: false
          }, { status: 429 })
        case 'invalid_request_error':
          return NextResponse.json({
            error: 'Invalid payment request. Please try again.',
            isFree: false
          }, { status: 400 })
        case 'api_error':
          return NextResponse.json({
            error: 'Payment service temporarily unavailable. Please try again.',
            isFree: false
          }, { status: 503 })
        case 'authentication_error':
          return NextResponse.json({
            error: 'Authentication failed. Please try again.',
            isFree: false
          }, { status: 401 })
        case 'idempotency_error':
          return NextResponse.json({
            error: 'Duplicate request detected. Please try again.',
            isFree: false
          }, { status: 400 })
        default:
          break
      }
    }
    
    return NextResponse.json({
      error: 'An unexpected error occurred. Please try again.',
      isFree: false
    }, { status: 500 })
  }
}

export async function GET(): Promise<NextResponse> {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  )
}