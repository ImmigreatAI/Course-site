// lib/services/user-courses.service.ts
// ============================================
// ENHANCED: Now provides enrollment URLs for direct course access

import { unifiedCourseService } from '@/lib/services/unified-course.service'
import { databaseService } from '@/lib/services/database.service'
import type { CourseData } from '@/lib/data/courses'
import type { CartItem } from '@/lib/store/cart-store'

export interface CourseWithAccess extends CourseData {
  isPurchased: boolean
  activeEnrollment: boolean
  expiresAt?: string | null
  enrollmentUrl?: string // NEW: Direct URL to access the purchased course
  purchasedPlanLabel?: string // NEW: Which plan the user actually purchased
}

export interface CartValidationResult {
  isValid: boolean
  conflictingItems: CartItem[]
  message?: string
}

export class UserCoursesService {
  /**
   * Get all purchased course IDs for a user
   */
  async getUserPurchasedCourseIds(userId: string): Promise<string[]> {
    try {
      return await databaseService.getUserPurchasedCourseIds(userId)
    } catch (error) {
      console.error('Error fetching user purchased courses:', error)
      return []
    }
  }

  /**
   * ENHANCED: Get enrollment details with course URLs for purchased courses
   */
  async getUserEnrollmentDetails(userId: string): Promise<Map<string, {
    enrollmentUrl: string
    planLabel: string
    expiresAt: string | null
    status: string
  }>> {
    try {
      // First get the database user ID from Clerk user ID
      const user = await databaseService.getUserByClerkId(userId)
      if (!user) {
        console.log('User not found for Clerk ID:', userId)
        return new Map()
      }

      const enrollmentMap = new Map()
      const enrollments = await databaseService.getUserEnrollments(user.id) // Use database user ID
      
      for (const enrollment of enrollments) {
        if (enrollment.status === 'active') {
          enrollmentMap.set(enrollment.course_id, {
            enrollmentUrl: enrollment.course_url,
            planLabel: enrollment.plan_label,
            expiresAt: enrollment.expires_at,
            status: enrollment.status
          })
        }
      }
      
      return enrollmentMap
    } catch (error) {
      console.error('Error fetching user enrollment details:', error)
      return new Map()
    }
  }

  /**
   * ENHANCED: Enrich courses with user access status and enrollment URLs
   */
  async getCoursesWithAccessStatus(
    userId: string | null
  ): Promise<CourseWithAccess[]> {
    try {
      // Always load catalog from unified service (database-backed with caching)
      const catalog = await unifiedCourseService.getAllCourses()

      // If no user, mark everything as not purchased
      if (!userId) {
        return catalog.map(course => ({
          ...course,
          isPurchased: false,
          activeEnrollment: false,
        }))
      }

      // Get user's purchased course IDs
      const purchasedCourseIds = await this.getUserPurchasedCourseIds(userId)

      // NEW: Get detailed enrollment info with URLs
      const enrollmentDetails = await this.getUserEnrollmentDetails(userId)

      // Map catalog with access flags and enrollment URLs
      return catalog.map(course => {
        const courseId = course.course.Unique_id
        const isPurchased = purchasedCourseIds.includes(courseId)
        const enrollmentDetail = enrollmentDetails.get(courseId)

        // Check if enrollment is active and not expired
        const isActive = enrollmentDetail?.status === 'active'
        const isNotExpired =
          !enrollmentDetail?.expiresAt ||
          new Date(enrollmentDetail.expiresAt) > new Date()

        return {
          ...course,
          isPurchased,
          activeEnrollment: isPurchased && isActive && isNotExpired,
          expiresAt: enrollmentDetail?.expiresAt ?? null,
          enrollmentUrl: enrollmentDetail?.enrollmentUrl, // NEW: Direct access URL
          purchasedPlanLabel: enrollmentDetail?.planLabel, // NEW: Purchased plan
        }
      })
    } catch (error) {
      console.error('Error enriching courses with access status:', error)
      
      // Fallback: try to get basic catalog and mark as not purchased
      try {
        const catalog = await unifiedCourseService.getAllCourses()
        return catalog.map(course => ({
          ...course,
          isPurchased: false,
          activeEnrollment: false,
        }))
      } catch (fallbackError) {
        console.error('Critical error: unable to load course catalog:', fallbackError)
        return [] // Return empty array as last resort
      }
    }
  }

  /**
   * NEW: Get direct access URL for a specific purchased course
   */
  async getCourseAccessUrl(userId: string, courseId: string): Promise<string | null> {
    try {
      const enrollmentDetails = await this.getUserEnrollmentDetails(userId)
      const detail = enrollmentDetails.get(courseId)
      return detail?.enrollmentUrl || null
    } catch (error) {
      console.error(`Error getting access URL for course ${courseId}:`, error)
      return null
    }
  }

  /**
   * Validate cart items against user's purchases
   */
  async validateCartAgainstPurchases(
    cartItems: CartItem[],
    userId: string | null
  ): Promise<CartValidationResult> {
    // If no user, cart is valid
    if (!userId) {
      return {
        isValid: true,
        conflictingItems: [],
      }
    }

    try {
      const purchasedCourseIds = await this.getUserPurchasedCourseIds(userId)

      // Use unified service's comprehensive conflict checking
      const conflictResult = await unifiedCourseService.checkCartConflicts(
        cartItems,
        purchasedCourseIds
      )

      if (conflictResult.hasConflicts) {
        return {
          isValid: false,
          conflictingItems: conflictResult.conflictingItems,
          message: conflictResult.message,
        }
      }

      return {
        isValid: true,
        conflictingItems: [],
      }
    } catch (error) {
      console.error('Error validating cart:', error)
      // On error, allow checkout but warn
      return {
        isValid: true,
        conflictingItems: [],
        message: 'Unable to validate cart items. Please verify your purchases before checkout.',
      }
    }
  }

  /**
   * Check if any bundles in cart contain already purchased courses
   */
  private async checkBundleConflicts(
    cartItems: CartItem[],
    purchasedCourseIds: string[]
  ): Promise<CartItem[]> {
    try {
      const catalog = await unifiedCourseService.getAllCourses()
      const byUniqueId = new Map(catalog.map(c => [c.course.Unique_id, c]))

      const conflictingBundles: CartItem[] = []

      for (const item of cartItems) {
        const courseData = byUniqueId.get(item.courseId)
        if (!courseData) continue

        const isBundle = courseData.plans.some(p => p.category === 'bundle')
        const bundleContents = courseData.course.package ?? []

        if (isBundle && bundleContents.length > 0) {
          // Check if any bundle contents are already purchased
          const hasConflict = bundleContents.some(contentId =>
            purchasedCourseIds.includes(contentId)
          )

          if (hasConflict) {
            conflictingBundles.push(item)
          }
        }
      }

      return conflictingBundles
    } catch (error) {
      console.error('Error checking bundle conflicts:', error)
      return []
    }
  }

  /**
   * BACKWARD COMPATIBILITY: Get course access URL (sync version - deprecated)
   */
  getCourseAccessUrlSync(courseId: string, planLabel: string): string {
    console.warn('getCourseAccessUrlSync is deprecated - use async getCourseAccessUrl instead')
    return '#'
  }

  /**
   * BACKWARD COMPATIBILITY: Check if course can be added to cart (sync version - deprecated)
   */
  canAddCourseToCartSync(courseId: string, purchased: string[]): boolean {
    console.warn('canAddCourseToCartSync is deprecated - use async version from unified service')
    return !purchased.includes(courseId)
  }

  /**
   * Health check for service monitoring
   */
  async healthCheck(): Promise<{
    status: string
    message: string
    details?: {
      unifiedService?: {
        status: string
        message: string
        courseCount?: number
        [key: string]: unknown
      }
      timestamp?: string
      error?: unknown
      [key: string]: unknown
    }
  }> {
    try {
      // Test unified service connection
      const unifiedHealth = await unifiedCourseService.healthCheck()
      
      if (unifiedHealth.status === 'error') {
        return {
          status: 'error',
          message: 'Unified course service unavailable',
          details: unifiedHealth
        }
      }

      // Test database service connection
      const testUserId = 'health-check-test'
      await databaseService.getUserPurchasedCourseIds(testUserId).catch(() => {
        // Expected to fail - just testing connection
      })

      return {
        status: unifiedHealth.status,
        message: `User courses service operational (${unifiedHealth.message})`,
        details: {
          unifiedService: unifiedHealth,
          timestamp: new Date().toISOString()
        }
      }
    } catch (error) {
      return {
        status: 'error',
        message: `User courses service error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: { error }
      }
    }
  }
}

export const userCoursesService = new UserCoursesService()

// Legacy exports for backward compatibility
export const {
  canAddCourseToCartSync: canAddCourseToCart, // Deprecated - maps to sync version
  getCourseAccessUrlSync: getCourseAccessUrl, // Deprecated - maps to sync version
} = userCoursesService

// Migration helper to identify usage of deprecated methods
if (process.env.NODE_ENV === 'development') {
  console.log('📦 User Courses Service: Enhanced with enrollment URLs. Use new async methods for best experience.')
}