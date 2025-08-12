// lib/services/client-course.service.ts
// ============================================
// ENHANCED: Better cache busting and error handling

import type { CourseData } from '@/lib/data/courses'

export class ClientCourseService {
  private retryCount = 0
  private maxRetries = 3
  private lastSuccessfulFetch: CourseData[] | null = null
  private lastFetchTime = 0

  /**
   * Fetch courses via API endpoint with cache busting options
   */
  async getAllCourses(forceFresh = false): Promise<CourseData[]> {
    try {
      console.log('🔄 Fetching courses from API...')
      
      // Build URL with cache busting if needed
      const url = forceFresh 
        ? `/api/courses?_t=${Date.now()}` // Cache bust with timestamp
        : '/api/courses'
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        // Always use no-store to ensure we get fresh data when requested
        cache: 'no-store'
      })

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      
      if (!Array.isArray(data)) {
        throw new Error('Invalid API response format')
      }

      // Validate the response has basic course structure
      if (data.length > 0) {
        const firstCourse = data[0]
        if (!firstCourse.course?.Unique_id || !firstCourse.course?.name) {
          throw new Error('Invalid course data structure in API response')
        }
      }

      // Success - reset retry count and cache the result
      this.retryCount = 0
      this.lastSuccessfulFetch = data
      this.lastFetchTime = Date.now()
      
      console.log(`✅ Successfully loaded ${data.length} courses from API`)
      return data

    } catch (error) {
      this.retryCount++
      console.error(`❌ API error (attempt ${this.retryCount}/${this.maxRetries}):`, error)

      // Use last successful fetch if available and not too old (15 minutes)
      const cacheAge = Date.now() - this.lastFetchTime
      const maxCacheAge = 15 * 60 * 1000 // 15 minutes
      
      if (this.lastSuccessfulFetch && cacheAge < maxCacheAge) {
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
   * Force refresh - clear cache and fetch fresh data
   */
  async forceRefresh(): Promise<CourseData[]> {
    console.log('🔄 Force refreshing course data...')
    this.lastSuccessfulFetch = null
    this.lastFetchTime = 0
    this.retryCount = 0
    return this.getAllCourses(true)
  }

  /**
   * Get single course by unique_id
   */
  async getCourseByUniqueId(uniqueId: string, forceFresh = false): Promise<CourseData | null> {
    try {
      const allCourses = await this.getAllCourses(forceFresh)
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
   * Check if course exists (useful for validation)
   */
  async courseExists(uniqueId: string): Promise<boolean> {
    try {
      const course = await this.getCourseByUniqueId(uniqueId)
      return course !== null
    } catch (error) {
      console.error(`Error checking if course ${uniqueId} exists:`, error)
      return false
    }
  }

  /**
   * Get cache age in milliseconds
   */
  getCacheAge(): number {
    return Date.now() - this.lastFetchTime
  }

  /**
   * Check if cache is stale (older than 5 minutes)
   */
  isCacheStale(): boolean {
    const maxAge = 5 * 60 * 1000 // 5 minutes
    return this.getCacheAge() > maxAge
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
  async healthCheck(): Promise<{ 
    status: string; 
    message: string; 
    courseCount?: number;
    cacheAge?: number;
    lastFetch?: string;
  }> {
    try {
      const courses = await this.getAllCourses()
      const cacheAge = this.getCacheAge()
      
      return {
        status: 'healthy',
        message: 'Client course service operational',
        courseCount: courses.length,
        cacheAge,
        lastFetch: this.lastFetchTime ? new Date(this.lastFetchTime).toISOString() : 'never'
      }
    } catch (error) {
      return {
        status: 'error',
        message: `Client course service error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        cacheAge: this.getCacheAge(),
        lastFetch: this.lastFetchTime ? new Date(this.lastFetchTime).toISOString() : 'never'
      }
    }
  }
}

export const clientCourseService = new ClientCourseService()