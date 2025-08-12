// lib/services/client-course.service.ts
// ============================================
// CLIENT-SAFE course service for browser usage
// Uses API endpoints instead of direct database calls

import type { CourseData } from '@/lib/data/courses'

export class ClientCourseService {
  private retryCount = 0
  private maxRetries = 3
  private lastSuccessfulFetch: CourseData[] | null = null

  /**
   * Fetch courses via API endpoint (client-safe)
   */
  async getAllCourses(): Promise<CourseData[]> {
    try {
      console.log('🔄 Fetching courses from API...')
      
      const response = await fetch('/api/courses', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        // Add cache busting to ensure fresh data when needed
        cache: 'no-store'
      })

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      
      if (!Array.isArray(data)) {
        throw new Error('Invalid API response format')
      }

      // Success - reset retry count and cache the result
      this.retryCount = 0
      this.lastSuccessfulFetch = data
      
      console.log(`✅ Successfully loaded ${data.length} courses from API`)
      return data

    } catch (error) {
      this.retryCount++
      console.error(`❌ API error (attempt ${this.retryCount}/${this.maxRetries}):`, error)

      // Use last successful fetch if available
      if (this.lastSuccessfulFetch) {
        console.log('🔄 Using cached course data from last successful fetch')
        return this.lastSuccessfulFetch
      }

      // If we haven't hit max retries, throw to trigger retry logic upstream
      if (this.retryCount < this.maxRetries) {
        throw error
      }

      // Max retries reached - return minimal fallback
      console.error('💥 Max retries reached, using minimal fallback')
      return this.getMinimalFallback()
    }
  }

  /**
   * Get single course by unique_id
   */
  async getCourseByUniqueId(uniqueId: string): Promise<CourseData | null> {
    try {
      const allCourses = await this.getAllCourses()
      return allCourses.find(c => c.course.Unique_id === uniqueId) || null
    } catch (error) {
      console.error(`Error finding course ${uniqueId}:`, error)
      return null
    }
  }

  /**
   * Check if course is a bundle
   */
  async isBundle(courseId: string): Promise<boolean> {
    try {
      const course = await this.getCourseByUniqueId(courseId)
      return course?.plans.some(plan => plan.category === 'bundle') || false
    } catch (error) {
      console.error(`Error checking if ${courseId} is bundle:`, error)
      return false
    }
  }

  /**
   * Get bundle contents
   */
  async getBundleContents(bundleId: string): Promise<string[]> {
    try {
      const course = await this.getCourseByUniqueId(bundleId)
      return course?.course.package || []
    } catch (error) {
      console.error(`Error getting bundle contents for ${bundleId}:`, error)
      return []
    }
  }

  /**
   * Minimal fallback when everything fails
   */
  private getMinimalFallback(): CourseData[] {
    return [
      {
        course: {
          Unique_id: "client-service-unavailable",
          name: "Service Temporarily Unavailable",
          description: "Course catalog is temporarily unavailable. Please refresh the page.",
          package: []
        },
        plans: [{
          url: "#",
          category: "course",
          type: "paid",
          label: "6mo",
          price: 0,
          enrollment_id: "fallback",
          stripe_price_id: "price_fallback"
        }]
      }
    ]
  }

  /**
   * Health check for debugging
   */
  async healthCheck(): Promise<{ status: string; message: string; courseCount?: number }> {
    try {
      const courses = await this.getAllCourses()
      return {
        status: 'healthy',
        message: 'Client course service operational',
        courseCount: courses.length
      }
    } catch (error) {
      return {
        status: 'error',
        message: `Client course service error: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    }
  }
}

export const clientCourseService = new ClientCourseService()