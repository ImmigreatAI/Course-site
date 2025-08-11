// lib/services/checkout.service.ts
// ============================================
// Enhanced with purchase validation

import { clerkClient } from '@clerk/nextjs/server'
import { checkoutValidationService } from './checkout-validation.service'
import { checkoutSessionService } from './checkout-session.service'
import type { CheckoutRequest, CheckoutResponse } from '@/lib/types/checkout.types'

export class CheckoutService {
  /**
   * Process checkout request with purchase validation
   */
  async processCheckout(
    userId: string,
    request: CheckoutRequest,
    origin: string
  ): Promise<CheckoutResponse> {
    try {
      console.log('🔒 Validating checkout for user:', userId)
      
      // Get user info from Clerk
      const userInfo = await this.getUserInfo(userId)
      
      // Validate all items including purchase check
      const validatedItems = await checkoutValidationService.validateItems(
        request.items,
        userId // Pass userId for purchase validation
      )
      
      if ('error' in validatedItems) {
        console.log('❌ Validation failed:', validatedItems.error)
        return { error: validatedItems.error }
      }

      console.log('✅ Validation passed, creating Stripe session...')
      
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