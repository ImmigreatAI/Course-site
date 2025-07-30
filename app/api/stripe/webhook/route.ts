// app/api/stripe/webhook/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerStripe } from '@/lib/stripe/config'
import Stripe from 'stripe'

// Use Node.js runtime for proper webhook handling
export const runtime = 'nodejs'

interface WebhookResponse {
  received?: boolean
  eventId?: string
  eventType?: string
  error?: string
}

export async function POST(req: NextRequest): Promise<NextResponse<WebhookResponse>> {
  let body: string
  let signature: string | null

  try {
    // Get the raw body and signature
    body = await req.text()
    signature = req.headers.get('stripe-signature')

    if (!signature) {
      console.error('Missing Stripe signature in webhook request')
      return NextResponse.json(
        { error: 'Missing Stripe signature' },
        { status: 400 }
      )
    }

    if (!process.env.STRIPE_WEBHOOK_SECRET) {
      console.error('STRIPE_WEBHOOK_SECRET not configured')
      return NextResponse.json(
        { error: 'Webhook secret not configured' },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('Error reading webhook request:', error)
    return NextResponse.json(
      { error: 'Invalid request' },
      { status: 400 }
    )
  }

  // Verify webhook signature
  let event: Stripe.Event
  const stripe = getServerStripe()

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    )
  } catch (error) {
    console.error('Webhook signature verification failed:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      signature: signature?.slice(0, 20) + '...',
    })
    
    return NextResponse.json(
      { error: 'Invalid signature' },
      { status: 400 }
    )
  }

  // Process webhook events
  try {
    console.log(`Processing webhook event: ${event.type} (${event.id})`)

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        
        // Validate required data
        if (!session.metadata?.userId || !session.metadata?.enrollmentIds) {
          console.error('Missing required metadata in session:', {
            sessionId: session.id,
            hasUserId: !!session.metadata?.userId,
            hasEnrollmentIds: !!session.metadata?.enrollmentIds,
          })
          break
        }

        const userId = session.metadata.userId
        let enrollmentIds: string[]
        
        try {
          enrollmentIds = JSON.parse(session.metadata.enrollmentIds)
        } catch (parseError) {
          console.error('Failed to parse enrollment IDs:', {
            sessionId: session.id,
            enrollmentIds: session.metadata.enrollmentIds,
            error: parseError,
          })
          break
        }

        console.log('Payment successful - processing enrollment:', {
          sessionId: session.id,
          userId,
          enrollmentIds,
          amountTotal: session.amount_total,
          currency: session.currency,
          customerEmail: session.customer_details?.email,
          paymentStatus: session.payment_status,
        })

        // TODO: Implement enrollment processing
        // await processEnrollment({
        //   userId,
        //   enrollmentIds,
        //   sessionId: session.id,
        //   amountPaid: session.amount_total,
        //   currency: session.currency,
        //   customerEmail: session.customer_details?.email,
        // })

        break
      }

      case 'checkout.session.expired': {
        const session = event.data.object as Stripe.Checkout.Session
        
        console.log('Checkout session expired:', {
          sessionId: session.id,
          userId: session.metadata?.userId,
          createdAt: new Date(session.created * 1000).toISOString(),
        })

        // TODO: Clean up any temporary data or send abandonment email
        break
      }

      case 'checkout.session.async_payment_succeeded': {
        const session = event.data.object as Stripe.Checkout.Session
        
        console.log('Async payment succeeded:', {
          sessionId: session.id,
          userId: session.metadata?.userId,
        })

        // Handle delayed payment success (e.g., bank transfers)
        // Similar processing to checkout.session.completed
        break
      }

      case 'checkout.session.async_payment_failed': {
        const session = event.data.object as Stripe.Checkout.Session
        
        console.log('Async payment failed:', {
          sessionId: session.id,
          userId: session.metadata?.userId,
        })

        // TODO: Notify user and handle failed payment
        break
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        
        console.log('Payment failed:', {
          paymentIntentId: paymentIntent.id,
          userId: paymentIntent.metadata?.userId,
          lastPaymentError: paymentIntent.last_payment_error,
        })

        // TODO: Log failure and potentially notify user
        break
      }

      case 'invoice.payment_succeeded': {
        // Handle successful recurring payments (if you add subscriptions later)
        const invoice = event.data.object as Stripe.Invoice
        console.log('Invoice payment succeeded:', invoice.id)
        break
      }

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ 
      received: true,
      eventId: event.id,
      eventType: event.type 
    })

  } catch (error) {
    console.error('Webhook processing error:', {
      eventId: event.id,
      eventType: event.type,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    })
    
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}

// Only allow POST requests
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