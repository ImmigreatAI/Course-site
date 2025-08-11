// lib/services/webhook.service.ts
// ============================================
import { getServerStripe } from '@/lib/stripe/config'
import { enrollmentService } from './enrollment.service'
import Stripe from 'stripe'

export class WebhookService {
  private stripe = getServerStripe()

  // Verify webhook signature
  verifySignature(body: string, signature: string): Stripe.Event {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
    
    if (!webhookSecret) {
      throw new Error('STRIPE_WEBHOOK_SECRET not configured')
    }

    try {
      const event = this.stripe.webhooks.constructEvent(
        body,
        signature,
        webhookSecret
      )
      
      console.log('✅ Webhook signature verified:', {
        eventId: event.id,
        eventType: event.type,
        livemode: event.livemode
      })
      
      return event
    } catch (error) {
      console.error('❌ Signature verification failed:', error)
      throw new Error('Invalid webhook signature')
    }
  }

  // Handle different event types
  async handleEvent(event: Stripe.Event): Promise<void> {
    console.log(`\n🎯 Processing event: ${event.type}`)
    
    switch (event.type) {
      case 'checkout.session.completed':
        await this.handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session)
        break
        
      case 'checkout.session.async_payment_succeeded':
        await this.handleAsyncPaymentSucceeded(event.data.object as Stripe.Checkout.Session)
        break
        
      case 'checkout.session.expired':
        await this.handleSessionExpired(event.data.object as Stripe.Checkout.Session)
        break
        
      case 'checkout.session.async_payment_failed':
        await this.handleAsyncPaymentFailed(event.data.object as Stripe.Checkout.Session)
        break
        
      case 'payment_intent.payment_failed':
        await this.handlePaymentFailed(event.data.object as Stripe.PaymentIntent)
        break
        
      default:
        console.log(`❓ Unhandled event type: ${event.type}`)
    }
  }

  // Handle successful checkout
  private async handleCheckoutCompleted(session: Stripe.Checkout.Session): Promise<void> {
    console.log('\n💳 Checkout completed:', {
      sessionId: session.id,
      paymentStatus: session.payment_status,
      amount: session.amount_total
    })

    // Validate required metadata
    if (!session.metadata?.userEmail || !session.metadata?.enrollmentIds) {
      console.error('❌ Missing required metadata:', {
        sessionId: session.id,
        hasUserEmail: !!session.metadata?.userEmail,
        hasEnrollmentIds: !!session.metadata?.enrollmentIds
      })
      return
    }

    try {
      await enrollmentService.processEnrollment(session)
      console.log('✅ Enrollment process completed')
    } catch (error) {
      console.error('❌ Enrollment failed:', error)
      // Don't throw - log for manual review
    }
  }

  // Handle async payment success
  private async handleAsyncPaymentSucceeded(session: Stripe.Checkout.Session): Promise<void> {
    console.log('\n💰 Async payment succeeded:', {
      sessionId: session.id,
      userEmail: session.metadata?.userEmail
    })

    try {
      await enrollmentService.processEnrollment(session)
      console.log('✅ Async enrollment completed')
    } catch (error) {
      console.error('❌ Async enrollment failed:', error)
    }
  }

  // Handle session expiry
  private async handleSessionExpired(session: Stripe.Checkout.Session): Promise<void> {
    console.log('\n⏰ Session expired:', {
      sessionId: session.id,
      userEmail: session.metadata?.userEmail,
      createdAt: new Date(session.created * 1000).toISOString()
    })
    
    // TODO: Send abandonment email or clean up temporary data
  }

  // Handle async payment failure
  private async handleAsyncPaymentFailed(session: Stripe.Checkout.Session): Promise<void> {
    console.log('\n❌ Async payment failed:', {
      sessionId: session.id,
      userEmail: session.metadata?.userEmail
    })
    
    // TODO: Notify user of payment failure
  }

  // Handle payment intent failure
  private async handlePaymentFailed(paymentIntent: Stripe.PaymentIntent): Promise<void> {
    console.log('\n💳❌ Payment intent failed:', {
      paymentIntentId: paymentIntent.id,
      userEmail: paymentIntent.metadata?.userEmail,
      error: paymentIntent.last_payment_error?.message
    })
    
    // TODO: Log failure and notify user
  }
}

export const webhookService = new WebhookService()
