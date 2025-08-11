// lib/types/checkout.types.ts
// ============================================
import { z } from 'zod'

// Validation schemas
export const CheckoutItemSchema = z.object({
  courseId: z.string().min(1, 'Course ID is required'),
  courseName: z.string().min(1, 'Course name is required'),
  planLabel: z.enum(['6mo', '7day'], { 
    message: 'Plan label must be "6mo" or "7day"' 
  }),
  price: z.number().min(0, 'Price must be non-negative'),
  enrollmentId: z.string().min(1, 'Enrollment ID is required'),
  stripePriceId: z.string().min(1, 'Stripe price ID is required'),
})

export const CheckoutRequestSchema = z.object({
  items: z.array(CheckoutItemSchema).min(1, 'At least one item is required'),
})

// Type definitions
export type CheckoutItem = z.infer<typeof CheckoutItemSchema>
export type CheckoutRequest = z.infer<typeof CheckoutRequestSchema>

export interface CheckoutResponse {
  sessionId?: string
  url?: string | null
  enrollmentIds?: string[]
  message?: string
  error?: string
}

export interface ProcessedItem {
  courseId: string
  courseName: string
  planLabel: '6mo' | '7day'
  price: number
  enrollmentId: string
  stripePriceId: string
  category: string
  url: string
}

export interface SessionMetadata {
  userId: string
  userEmail: string
  userName: string
  enrollmentIds: string
  itemCount: string
  courseIds: string
  courseCategories: string
  coursePrices: string
  courseNames: string
  planLabels: string
  stripePriceIds: string
  enrollmentUrls: string
}
