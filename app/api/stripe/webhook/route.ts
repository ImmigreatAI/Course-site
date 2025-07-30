import { NextRequest, NextResponse } from 'next/server'
import { getServerStripe } from '@/lib/stripe/config'
import Stripe from 'stripe'

// Use Edge runtime for Bun compatibility
export const runtime = 'edge'

export async function POST(req: NextRequest) {
  let body: string
  let signature: string | null

  // 1) Read raw body and signature header
  try {
    body = await req.text()
    signature = req.headers.get('stripe-signature')
    if (!signature) {
      console.error('Missing Stripe signature in webhook request')
      return NextResponse.json({ error: 'Missing Stripe signature' }, { status: 400 })
    }
    if (!process.env.STRIPE_WEBHOOK_SECRET) {
      console.error('STRIPE_WEBHOOK_SECRET not configured')
      return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 })
    }
  } catch (err) {
    console.error('Error reading webhook request:', err)
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  // 2) Verify webhook signature asynchronously
  const stripe = getServerStripe()
  let event: Stripe.Event
  try {
    event = await stripe.webhooks.constructEventAsync(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    )
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  // 3) Process webhook events
  try {
    console.log(`Processing webhook event: ${event.type} (${event.id})`)
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const userId = session.metadata?.userId
        const rawIds = session.metadata?.enrollmentIds
        if (!userId || !rawIds) {
          console.error('Missing metadata in session:', session.id)
          break
        }
        let enrollmentIds: string[]
        try { enrollmentIds = JSON.parse(rawIds) } catch (parseErr) {
          console.error('Failed to parse enrollment IDs:', parseErr)
          break
        }
        console.log('Payment successful - enrollment data:', { sessionId: session.id, userId, enrollmentIds })
        // TODO: Enrollment logic
        break
      }
      case 'checkout.session.expired':
        console.log('Checkout session expired:', (event.data.object as Stripe.Checkout.Session).id)
        break
      case 'payment_intent.payment_failed':
        console.log('Payment intent failed:', (event.data.object as Stripe.PaymentIntent).id)
        break
      default:
        console.log(`Unhandled event type: ${event.type}`)
    }
    return NextResponse.json({ received: true })
  } catch (err) {
    console.error('Webhook processing error:', err)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}

// Disallow other methods
export async function GET() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 })
}
export async function PUT() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 })
}
export async function DELETE() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 })
}
