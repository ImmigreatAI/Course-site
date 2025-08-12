// app/api/courses/route.ts
// ============================================
// API endpoint for client-side course data fetching
// Uses the server-side unified service with proper caching

import { NextResponse } from 'next/server'
import { unifiedCourseService } from '@/lib/services/unified-course.service'

export async function GET() {
  try {
    // Use the server-side service which has proper caching
    const courses = await unifiedCourseService.getAllCourses()
    
    return NextResponse.json(courses, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600', // 5min cache, 10min stale
      }
    })
  } catch (error) {
    console.error('❌ API error fetching courses:', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch courses',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// Optional: Add other methods if needed
export async function POST() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  )
}