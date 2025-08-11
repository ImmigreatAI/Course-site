// app/api/stripe/checkout/route.ts (SIMPLIFIED)
// ============================================
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { checkoutService } from '@/lib/services/checkout.service'
import { CheckoutRequestSchema } from '@/lib/types/checkout.types'
import { checkoutSessionService } from '@/lib/services/checkout-session.service'

export async function POST(req: NextRequest): Promise<NextResponse> {
  console.log('\n💳 === CHECKOUT REQUEST RECEIVED ===')
  
  try {
    // Step 1: Authenticate user
    const { userId } = await auth()
    
    if (!userId) {
      console.log('❌ Authentication required')
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    console.log('✅ User authenticated:', { userId })

    // Step 2: Parse and validate request
    const body = await req.json()
    const parseResult = CheckoutRequestSchema.safeParse(body)
    
    if (!parseResult.success) {
      console.log('❌ Invalid request data:', parseResult.error.format())
      return NextResponse.json(
        { error: 'Invalid request data' },
        { status: 400 }
      )
    }

    console.log('📦 Processing checkout:', {
      itemCount: parseResult.data.items.length,
      items: parseResult.data.items.map(item => ({
        courseId: item.courseId,
        planLabel: item.planLabel,
        price: item.price
      }))
    })

    // Step 3: Process checkout
    const result = await checkoutService.processCheckout(
      userId,
      parseResult.data,
      req.nextUrl.origin
    )

    // Step 4: Return response
    if (result.error) {
      console.log('❌ Checkout failed:', result.error)
      
      // Determine appropriate status code
      const statusCode = result.error.includes('not found') ? 404 :
                        result.error.includes('mismatch') ? 400 :
                        result.error.includes('Too many') ? 429 :
                        result.error.includes('unavailable') ? 503 :
                        500

      return NextResponse.json(
        { error: result.error },
        { status: statusCode }
      )
    }

    console.log('✅ Checkout successful:', {
      sessionId: result.sessionId,
      enrollmentCount: result.enrollmentIds?.length
    })

    return NextResponse.json(result)

  } catch (error) {
    console.error('❌ Unexpected error:', error)
    
    // Handle Stripe errors with proper formatting
    if (error && typeof error === 'object' && 'type' in error) {
      const { message, status } = checkoutSessionService.formatStripeError(error)
      return NextResponse.json(
        { error: message },
        { status }
      )
    }
    
    return NextResponse.json(
      { error: 'An unexpected error occurred. Please try again.' },
      { status: 500 }
    )
  }
}

// Block other HTTP methods
export async function GET(): Promise<NextResponse> {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  )
}

export async function PUT(): Promise<NextResponse> {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  )
}

export async function DELETE(): Promise<NextResponse> {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  )
}