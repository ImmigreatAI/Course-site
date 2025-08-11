// app/api/cart/validate/route.ts
// ============================================
// API endpoint to validate cart against user purchases

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { userCoursesService } from '@/lib/services/user-courses.service'
import { z } from 'zod'

// Validation schema
const CartValidationSchema = z.object({
  items: z.array(z.object({
    courseId: z.string(),
    courseName: z.string(),
    planLabel: z.string(),
    price: z.number(),
    enrollmentId: z.string(),
    stripePriceId: z.string()
  }))
})

export async function POST(req: NextRequest) {
  try {
    // Authenticate user
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Parse and validate request body
    const body = await req.json()
    const parseResult = CartValidationSchema.safeParse(body)
    
    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Invalid request data' },
        { status: 400 }
      )
    }

    // Validate cart against purchases
    const validationResult = await userCoursesService.validateCartAgainstPurchases(
      parseResult.data.items,
      userId
    )
    
    return NextResponse.json(validationResult)
    
  } catch (error) {
    console.error('Error validating cart:', error)
    
    return NextResponse.json(
      { error: 'Failed to validate cart' },
      { status: 500 }
    )
  }
}