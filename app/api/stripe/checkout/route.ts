// app/api/stripe/checkout/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { clerkClient } from '@clerk/nextjs/server'
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
  sessionId?: string
  url?: string | null
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
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Get user details from Clerk
    const client = await clerkClient()
    const user = await client.users.getUser(userId)
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Extract user information
    const userEmail = user.emailAddresses[0]?.emailAddress
    const userName = user.firstName || user.username || 'User'
    
    if (!userEmail) {
      return NextResponse.json(
        { error: 'User email not found' },
        { status: 400 }
      )
    }

    // Parse and validate request body
    const body = await req.json()
    const parseResult = CheckoutRequestSchema.safeParse(body)
    
    if (!parseResult.success) {
      return NextResponse.json({
        error: 'Invalid request data',
      }, { status: 400 })
    }

    const { items } = parseResult.data
    const lineItems: Array<{ price: string; quantity: number }> = []
    const enrollmentIds: string[] = []

    console.log('🔍 Processing cart items:', {
      totalItems: items.length,
      items: items.map((item, i) => ({
        index: i,
        courseId: item.courseId,
        courseName: item.courseName,
        planLabel: item.planLabel,
        price: item.price,
        enrollmentId: item.enrollmentId
      }))
    })

    // Validate each item against course data
    for (const item of items) {
      const course = coursesData.find(c => c.course.Unique_id === item.courseId)
      if (!course) {
        console.log('❌ Course not found in data:', { courseId: item.courseId, availableCourses: coursesData.map(c => c.course.Unique_id) })
        return NextResponse.json(
          { 
            error: `Course not found: ${item.courseId}`, 
          }, 
          { status: 400 }
        )
      }

      console.log('✅ Course found:', {
        courseId: item.courseId,
        courseName: course.course.name,
        availablePlans: course.plans.map(p => ({ label: p.label, price: p.price, enrollmentId: p.enrollment_id }))
      })

      const plan = course.plans.find(p => p.label === item.planLabel)
      if (!plan) {
        console.log('❌ Plan not found:', { planLabel: item.planLabel, availablePlans: course.plans.map(p => p.label) })
        return NextResponse.json({
          error: `Plan "${item.planLabel}" not found for course "${item.courseName}"`,
        }, { status: 400 })
      }

      console.log('✅ Plan found:', {
        planLabel: item.planLabel,
        planPrice: plan.price,
        planEnrollmentId: plan.enrollment_id,
        itemPrice: item.price,
        itemEnrollmentId: item.enrollmentId
      })

      // Validate price matches exactly
      if (plan.price !== item.price) {
        console.log('❌ Price mismatch:', { planPrice: plan.price, itemPrice: item.price })
        return NextResponse.json({
          error: `Price mismatch for "${item.courseName}". Expected: ${plan.price}, Received: ${item.price}`,
        }, { status: 400 })
      }

      // Validate enrollment ID matches
      if (plan.enrollment_id !== item.enrollmentId) {
        console.log('❌ Enrollment ID mismatch:', { planEnrollmentId: plan.enrollment_id, itemEnrollmentId: item.enrollmentId })
        return NextResponse.json({
          error: `Enrollment ID mismatch for "${item.courseName}"`,
        }, { status: 400 })
      }

      enrollmentIds.push(plan.enrollment_id)

      // For all courses (including free), create Stripe line items
      // Free courses will use a $0 price
      if (plan.price === 0) {
        // For free courses, we still need a valid Stripe price ID for $0
        // Make sure you have created $0 price IDs in Stripe dashboard
        if (!plan.stripe_price_id.startsWith('price_')) {
          console.log('❌ Invalid Stripe price ID format for free course')
          return NextResponse.json({
            error: `Invalid Stripe price ID format for free course "${item.courseName}". Must start with "price_"`,
          }, { status: 400 })
        }
      } else {
        // Validate stripe_price_id format for paid courses
        if (!plan.stripe_price_id.startsWith('price_')) {
          console.log('❌ Invalid Stripe price ID format for paid course')
          return NextResponse.json({
            error: `Invalid Stripe price ID format for "${item.courseName}". Must start with "price_"`,
          }, { status: 400 })
        }
      }

      lineItems.push({
        price: plan.stripe_price_id,
        quantity: 1,
      })

      console.log('✅ Item processed successfully:', {
        courseId: item.courseId,
        courseName: course.course.name, // Use actual course name from data
        planLabel: item.planLabel,
        price: plan.price, // Use actual price from data
        enrollmentId: plan.enrollment_id
      })
    }

    // Create Stripe checkout session for all items (free and paid)
    const stripe = getServerStripe()
    
    console.log('🔄 Creating Stripe session with metadata:', {
      totalLineItems: lineItems.length,
      enrollmentIds,
      courseNames: items.map(item => {
        const course = coursesData.find(c => c.course.Unique_id === item.courseId)
        return course?.course.name || 'Unknown Course'
      }),
      coursePrices: items.map(item => {
        const course = coursesData.find(c => c.course.Unique_id === item.courseId)
        const plan = course?.plans.find(p => p.label === item.planLabel)
        return plan?.price || 0
      }),
      planLabels: items.map(item => item.planLabel)
    })
    
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: `${req.nextUrl.origin}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.nextUrl.origin}/cancel`,
      
      // Auto-fill customer information from Clerk
      customer_email: userEmail,
      metadata: {
        userId,
        userEmail,
        userName,
        enrollmentIds: JSON.stringify(enrollmentIds),
        itemCount: items.length.toString(),
        courseIds: JSON.stringify(items.map((item: CheckoutItem) => item.courseId)),
        courseCategories: JSON.stringify(items.map(item => {
          const course = coursesData.find(c => c.course.Unique_id === item.courseId)
          const plan = course?.plans.find(p => p.label === item.planLabel)
          return plan?.category || 'course'
        })),
        // Store individual course data for each item - use actual data from coursesData
        coursePrices: JSON.stringify(items.map(item => {
          const course = coursesData.find(c => c.course.Unique_id === item.courseId)
          const plan = course?.plans.find(p => p.label === item.planLabel)
          return plan?.price || 0
        })),
        courseNames: JSON.stringify(items.map(item => {
          const course = coursesData.find(c => c.course.Unique_id === item.courseId)
          return course?.course.name || 'Unknown Course'
        })),
        planLabels: JSON.stringify(items.map((item: CheckoutItem) => item.planLabel)),
        enrollmentUrls: JSON.stringify(items.map(item => {
          const course = coursesData.find(c => c.course.Unique_id === item.courseId)
          const plan = course?.plans.find(p => p.label === item.planLabel)
          return plan?.url || ''
        })),
      },
      
      allow_promotion_codes: true,
      billing_address_collection: 'auto',
      
      payment_intent_data: {
        metadata: {
          userId,
          userEmail,
          type: 'course_purchase',
        },
      },
      
      expires_at: Math.floor(Date.now() / 1000) + (30 * 60), // 30 minutes expiry
    })

    return NextResponse.json({
      sessionId: session.id,
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
          }, { status: 400 })
        case 'rate_limit_error':
          return NextResponse.json({
            error: 'Too many requests. Please try again later.',
          }, { status: 429 })
        case 'invalid_request_error':
          return NextResponse.json({
            error: 'Invalid payment request. Please try again.',
          }, { status: 400 })
        case 'api_error':
          return NextResponse.json({
            error: 'Payment service temporarily unavailable. Please try again.',
          }, { status: 503 })
        case 'authentication_error':
          return NextResponse.json({
            error: 'Authentication failed. Please try again.',
          }, { status: 401 })
        case 'idempotency_error':
          return NextResponse.json({
            error: 'Duplicate request detected. Please try again.',
          }, { status: 400 })
        default:
          break
      }
    }
    
    return NextResponse.json({
      error: 'An unexpected error occurred. Please try again.',
    }, { status: 500 })
  }
}

export async function GET(): Promise<NextResponse> {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  )
}