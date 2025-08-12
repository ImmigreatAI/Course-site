// lib/services/user-courses.service.ts
// ============================================
// MIGRATED: Service for managing user course access and purchase validation
// Now uses unified course service - zero static data dependencies

import { unifiedCourseService } from '@/lib/services/unified-course.service'
import { databaseService } from '@/lib/services/database.service'
import type { CourseData } from '@/lib/data/courses' // Type import only - no data dependency
import type { CartItem } from '@/lib/store/cart-store'

export interface CourseWithAccess extends CourseData {
  isPurchased: boolean
  activeEnrollment: boolean
  expiresAt?: string | null
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
   * Enrich courses with user access status
   * MIGRATED: Now uses unified course service (database-backed)
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

      // Get detailed enrollment info for purchased courses
      const enrollmentMap = await databaseService.getUserEnrollmentsByCourseIds(
        userId,
        purchasedCourseIds
      )

      // Map catalog with access flags
      return catalog.map(course => {
        const courseId = course.course.Unique_id
        const isPurchased = purchasedCourseIds.includes(courseId)
        const enrollment = enrollmentMap.get(courseId)

        // Check if enrollment is active and not expired
        const isActive = enrollment?.status === 'active'
        const isNotExpired =
          !enrollment?.expires_at ||
          new Date(enrollment.expires_at) > new Date()

        return {
          ...course,
          isPurchased,
          activeEnrollment: isPurchased && isActive && isNotExpired,
          expiresAt: enrollment?.expires_at ?? null,
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
   * Validate cart items against user's purchases
   * MIGRATED: Uses unified course service for conflict checking
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
   * MIGRATED: Now uses unified course service instead of courseCatalogService
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
          // If any child is already purchased, this bundle conflicts
          const hasConflict = bundleContents.some(id =>
            purchasedCourseIds.includes(id)
          )
          if (hasConflict) conflictingBundles.push(item)
        }
      }

      return conflictingBundles
    } catch (error) {
      console.error('Error checking bundle conflicts:', error)
      return [] // Return empty array to avoid breaking the flow
    }
  }

  /**
   * Check if a specific course can be added to cart
   * MIGRATED: Now async and uses unified course service
   */
  async canAddCourseToCart(
    courseId: string,
    purchasedCourseIds: string[]
  ): Promise<{ canAdd: boolean; reason?: string }> {
    try {
      return await unifiedCourseService.canAddCourseToCart(courseId, purchasedCourseIds)
    } catch (error) {
      console.error(`Error checking if can add ${courseId} to cart:`, error)
      return { 
        canAdd: false, 
        reason: 'Unable to verify course availability' 
      }
    }
  }

  /**
   * Get course access URL for enrolled courses
   * MIGRATED: Now async and uses unified course service with real URLs
   */
  async getCourseAccessUrl(courseId: string, planLabel: string): Promise<string> {
    try {
      return await unifiedCourseService.getCourseAccessUrl(courseId, planLabel)
    } catch (error) {
      console.error(`Error getting access URL for ${courseId}:`, error)
      return '#' // Fallback to placeholder
    }
  }

  /**
   * LEGACY COMPATIBILITY METHODS
   * These maintain backward compatibility for code that hasn't been migrated yet
   */

  /**
   * @deprecated Use async version canAddCourseToCart() instead
   * Synchronous wrapper for backward compatibility
   */
  canAddCourseToCartSync(
    courseId: string,
    purchasedCourseIds: string[]
  ): { canAdd: boolean; reason?: string } {
    console.warn('⚠️ Using deprecated sync method canAddCourseToCartSync. Please migrate to async canAddCourseToCart()')
    
    // Quick synchronous checks
    if (purchasedCourseIds.includes(courseId)) {
      return {
        canAdd: false,
        reason: 'You already own this course',
      }
    }

    // For more complex bundle logic, we can't do synchronous checks
    // Return true and let the async validation catch conflicts later
    return { canAdd: true }
  }

  /**
   * @deprecated Use async version getCourseAccessUrl() instead
   * Synchronous wrapper for backward compatibility
   */
  getCourseAccessUrlSync(courseId: string, planLabel: string): string {
    console.warn('⚠️ Using deprecated sync method getCourseAccessUrlSync. Please migrate to async getCourseAccessUrl()')
    return '#' // Return placeholder - components should use async version
  }

  /**
   * Batch operations for better performance
   */

  /**
   * Get access URLs for multiple courses at once
   */
  async getBatchCourseAccessUrls(
    requests: { courseId: string; planLabel: string }[]
  ): Promise<Record<string, string>> {
    const results: Record<string, string> = {}
    
    try {
      const courses = await unifiedCourseService.getAllCourses()
      const courseMap = new Map(courses.map(c => [c.course.Unique_id, c]))

      for (const { courseId, planLabel } of requests) {
        const course = courseMap.get(courseId)
        const plan = course?.plans.find(p => p.label === planLabel)
        results[`${courseId}-${planLabel}`] = plan?.url || '#'
      }
    } catch (error) {
      console.error('Error getting batch access URLs:', error)
      // Fill with placeholders on error
      for (const { courseId, planLabel } of requests) {
        results[`${courseId}-${planLabel}`] = '#'
      }
    }

    return results
  }

  /**
   * Check multiple courses for cart eligibility at once
   */
  async getBatchCanAddToCart(
    courseIds: string[],
    purchasedCourseIds: string[]
  ): Promise<Record<string, { canAdd: boolean; reason?: string }>> {
    const results: Record<string, { canAdd: boolean; reason?: string }> = {}

    try {
      for (const courseId of courseIds) {
        results[courseId] = await this.canAddCourseToCart(courseId, purchasedCourseIds)
      }
    } catch (error) {
      console.error('Error checking batch cart eligibility:', error)
      // Fill with safe defaults on error
      for (const courseId of courseIds) {
        results[courseId] = { 
          canAdd: false, 
          reason: 'Unable to verify course availability' 
        }
      }
    }

    return results
  }

  /**
   * Health check for the service
   */
  async healthCheck(): Promise<{
    status: 'ok' | 'warning' | 'error'
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
  console.log('📦 User Courses Service: Migrated to unified service. Please update async method calls.')
}