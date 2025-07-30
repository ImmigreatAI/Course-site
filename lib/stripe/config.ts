// lib/stripe/config.ts
import Stripe from 'stripe'
import { loadStripe, Stripe as StripeJS } from '@stripe/stripe-js'

// Server-side Stripe instance - only use in API routes or server components
export const getServerStripe = (): Stripe => {
  const secretKey = process.env.STRIPE_SECRET_KEY

  if (!secretKey) {
    throw new Error(
      'STRIPE_SECRET_KEY is not set. Please add it to your environment variables.'
    )
  }

  if (!secretKey.startsWith('sk_')) {
    throw new Error(
      'Invalid STRIPE_SECRET_KEY format. It should start with "sk_".'
    )
  }

  return new Stripe(secretKey, {
    apiVersion: '2025-06-30.basil',
    typescript: true,
    telemetry: false, // Disable telemetry for better privacy
    maxNetworkRetries: 3, // Retry failed network requests
    timeout: 10000, // 10 second timeout
  })
}

// Client-side Stripe instance - safe to use in client components
let stripePromise: Promise<StripeJS | null> | undefined

export const getStripe = (): Promise<StripeJS | null> => {
  if (!stripePromise) {
    const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY

    if (!publishableKey) {
      console.error('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is not set')
      return Promise.resolve(null)
    }

    if (!publishableKey.startsWith('pk_')) {
      console.error('Invalid NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY format')
      return Promise.resolve(null)
    }

    stripePromise = loadStripe(publishableKey)
  }

  return stripePromise
}

// Reset Stripe promise (useful for testing)
export const resetStripePromise = (): void => {
  stripePromise = undefined
}