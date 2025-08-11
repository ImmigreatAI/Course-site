// lib/services/checkout-session.service.ts (FIXED)
// ============================================
import { getServerStripe } from '@/lib/stripe/config'
import type { ProcessedItem } from '@/lib/types/checkout.types'
import Stripe from 'stripe'

export class CheckoutSessionService {
  private stripe = getServerStripe()

  /**
   * Create Stripe checkout session
   */
  async createSession(
    items: ProcessedItem[],
    userInfo: {
      userId: string
      userEmail: string
      userName: string
    },
    origin: string
  ): Promise<Stripe.Checkout.Session> {
    console.log('🔄 Creating Stripe session:', {
      itemCount: items.length,
      userEmail: userInfo.userEmail,
      totalAmount: items.reduce((sum, item) => sum + item.price, 0)
    })

    const lineItems = this.createLineItems(items)
    const metadata = this.createMetadata(items, userInfo)
    
    const session = await this.stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: `${origin}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/cancel`,
      customer_email: userInfo.userEmail,
      metadata,
      allow_promotion_codes: true,
      billing_address_collection: 'auto',
      payment_intent_data: {
        metadata: {
          userId: userInfo.userId,
          userEmail: userInfo.userEmail,
          type: 'course_purchase',
        },
      },
      expires_at: Math.floor(Date.now() / 1000) + (30 * 60), // 30 minutes
    })

    console.log('✅ Stripe session created:', {
      sessionId: session.id,
      url: session.url
    })

    return session
  }

  /**
   * Create line items for Stripe
   */
  private createLineItems(items: ProcessedItem[]): Stripe.Checkout.SessionCreateParams.LineItem[] {
    return items.map(item => ({
      price: item.stripePriceId,
      quantity: 1,
    }))
  }

  /**
   * Create session metadata
   */
  private createMetadata(
    items: ProcessedItem[],
    userInfo: { userId: string; userEmail: string; userName: string }
  ): Stripe.Metadata {
    return {
      userId: userInfo.userId,
      userEmail: userInfo.userEmail,
      userName: userInfo.userName,
      enrollmentIds: JSON.stringify(items.map(i => i.enrollmentId)),
      itemCount: items.length.toString(),
      courseIds: JSON.stringify(items.map(i => i.courseId)),
      courseCategories: JSON.stringify(items.map(i => i.category)),
      coursePrices: JSON.stringify(items.map(i => i.price)),
      courseNames: JSON.stringify(items.map(i => i.courseName)),
      planLabels: JSON.stringify(items.map(i => i.planLabel)),
      stripePriceIds: JSON.stringify(items.map(i => i.stripePriceId)),
      enrollmentUrls: JSON.stringify(items.map(i => i.url)),
    }
  }

  /**
   * Handle Stripe-specific errors
   */
  formatStripeError(error: unknown): { message: string; status: number } {
    if (!error || typeof error !== 'object' || !('type' in error)) {
      return { 
        message: 'An unexpected error occurred. Please try again.', 
        status: 500 
      }
    }

    const stripeError = error as Stripe.StripeRawError
    
    const errorMap: Record<string, { message: string; status: number }> = {
      'card_error': {
        message: 'Payment failed. Please check your card details.',
        status: 400
      },
      'rate_limit_error': {
        message: 'Too many requests. Please try again later.',
        status: 429
      },
      'invalid_request_error': {
        message: 'Invalid payment request. Please try again.',
        status: 400
      },
      'api_error': {
        message: 'Payment service temporarily unavailable. Please try again.',
        status: 503
      },
      'authentication_error': {
        message: 'Authentication failed. Please try again.',
        status: 401
      },
      'idempotency_error': {
        message: 'Duplicate request detected. Please try again.',
        status: 400
      }
    }

    return errorMap[stripeError.type] || { 
      message: 'Payment processing error. Please try again.', 
      status: 500 
    }
  }
}

export const checkoutSessionService = new CheckoutSessionService()
