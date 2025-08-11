// lib/services/checkout.service.ts (FIXED)
// ============================================
import { clerkClient } from '@clerk/nextjs/server'
import { checkoutValidationService } from './checkout-validation.service'
import { checkoutSessionService } from './checkout-session.service'
import type { CheckoutRequest, CheckoutResponse } from '@/lib/types/checkout.types'

export class CheckoutService {
  /**
   * Process checkout request
   */
  async processCheckout(
    userId: string,
    request: CheckoutRequest,
    origin: string
  ): Promise<CheckoutResponse> {
    try {
      // Get user info from Clerk
      const userInfo = await this.getUserInfo(userId)
      
      // Validate all items
      const validatedItems = checkoutValidationService.validateItems(request.items)
      
      if ('error' in validatedItems) {
        return { error: validatedItems.error }
      }

      // Create Stripe session
      const session = await checkoutSessionService.createSession(
        validatedItems,
        userInfo,
        origin
      )

      return {
        sessionId: session.id,
        url: session.url,
        enrollmentIds: validatedItems.map(item => item.enrollmentId)
      }

    } catch (error) {
      console.error('Checkout processing error:', error)
      
      // Handle Stripe errors
      if (this.isStripeError(error)) {
        const { message } = checkoutSessionService.formatStripeError(error)
        return { error: message }
      }
      
      return { 
        error: 'An error occurred processing your checkout. Please try again.' 
      }
    }
  }

  /**
   * Get user information from Clerk
   */
  private async getUserInfo(userId: string): Promise<{
    userId: string
    userEmail: string
    userName: string
  }> {
    const client = await clerkClient()
    const user = await client.users.getUser(userId)
    
    if (!user) {
      throw new Error('User not found')
    }

    const userEmail = user.emailAddresses[0]?.emailAddress
    
    if (!userEmail) {
      throw new Error('User email not found')
    }

    return {
      userId,
      userEmail,
      userName: user.firstName || user.username || 'User'
    }
  }

  /**
   * Check if error is from Stripe
   */
  private isStripeError(error: unknown): boolean {
    return error !== null && 
           typeof error === 'object' && 
           'type' in error
  }
}

export const checkoutService = new CheckoutService()
