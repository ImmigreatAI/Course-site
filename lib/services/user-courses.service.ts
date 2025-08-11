// lib/services/user-courses.service.ts
// ============================================
// Service for managing user course access and purchase validation

import { courseCatalogService } from '@/lib/services/course-catalog.service'
import { databaseService } from '@/lib/services/database.service'
import { coursesData, type CourseData } from '@/lib/data/courses' // kept for sync helpers to avoid breaking callers
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
   * Uses DB-backed catalog (courseCatalogService)
   */
  async getCoursesWithAccessStatus(
    userId: string | null
  ): Promise<CourseWithAccess[]> {
    // Always load catalog from DB (cached with tags)
    const catalog = await courseCatalogService.getAllCourses()

    // If no user, mark everything as not purchased
    if (!userId) {
      return catalog.map(course => ({
        ...course,
        isPurchased: false,
        activeEnrollment: false,
      }))
    }

    try {
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
      // Fallback: still return catalog, but mark as not purchased
      return catalog.map(course => ({
        ...course,
        isPurchased: false,
        activeEnrollment: false,
      }))
    }
  }

  /**
   * Validate cart items against user's purchases
   * Uses DB-backed catalog for bundle membership checks
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

      // Check for bundles in cart that include already-purchased courses
      const bundlesWithPurchasedCourses = await this.checkBundleConflicts(
        cartItems,
        purchasedCourseIds
      )

      // Find direct duplicates (exact course already owned)
      const directConflicts = cartItems.filter(item =>
        purchasedCourseIds.includes(item.courseId)
      )

      const conflictingItems = [
        ...directConflicts,
        ...bundlesWithPurchasedCourses,
      ]

      if (conflictingItems.length > 0) {
        const itemNames = conflictingItems
          .map(item => item.courseName)
          .join(', ')
        return {
          isValid: false,
          conflictingItems,
          message: `You already own these courses: ${itemNames}. Please remove them from your cart to continue.`,
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
        message:
          'Unable to validate cart items. Please verify your purchases before checkout.',
      }
    }
  }

  /**
   * Check if any bundles in cart contain already purchased courses
   * Uses DB-backed catalog (courseCatalogService)
   */
  private async checkBundleConflicts(
    cartItems: CartItem[],
    purchasedCourseIds: string[]
  ): Promise<CartItem[]> {
    const catalog = await courseCatalogService.getAllCourses()
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
  }

  /**
   * Check if a specific course can be added to cart
   * NOTE: kept synchronous to avoid breaking existing callers.
   *       Uses the static snapshot for now; you can migrate later if needed.
   */
  canAddCourseToCart(
    courseId: string,
    purchasedCourseIds: string[]
  ): { canAdd: boolean; reason?: string } {
    // Already purchased?
    if (purchasedCourseIds.includes(courseId)) {
      return {
        canAdd: false,
        reason: 'You already own this course',
      }
    }

    // Is it part of any purchased bundle?
    const purchasedBundles = coursesData.filter(course => {
      const isBundle = course.plans.some(plan => plan.category === 'bundle')
      return isBundle && purchasedCourseIds.includes(course.course.Unique_id)
    })

    for (const bundle of purchasedBundles) {
      if (bundle.course.package?.includes(courseId)) {
        return {
          canAdd: false,
          reason: `You already own this course as part of the ${bundle.course.name} bundle`,
        }
      }
    }

    return { canAdd: true }
  }

  /**
   * Get course access URL for enrolled courses
   * NOTE: kept synchronous using static snapshot to avoid breaking any callers.
   *       (Your DB catalog currently returns '#', so this is harmless.)
   */
  getCourseAccessUrl(courseId: string, planLabel: string): string {
    const courseData = coursesData.find(c => c.course.Unique_id === courseId)
    const plan = courseData?.plans.find(p => p.label === planLabel)
    return plan?.url || '#'
  }
}

export const userCoursesService = new UserCoursesService()
