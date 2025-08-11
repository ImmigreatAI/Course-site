// app/api/user/purchases/route.ts
// ============================================
// API endpoint to fetch user's purchased courses

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { userCoursesService } from '@/lib/services/user-courses.service'

export async function GET(req: NextRequest) {
  try {
    // Authenticate user
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Get user's purchased course IDs
    const purchasedCourseIds = await userCoursesService.getUserPurchasedCourseIds(userId)
    
    return NextResponse.json({
      purchasedCourseIds,
      count: purchasedCourseIds.length
    })
    
  } catch (error) {
    console.error('Error fetching user purchases:', error)
    
    return NextResponse.json(
      { error: 'Failed to fetch purchases' },
      { status: 500 }
    )
  }
}