// lib/services/user-courses.service.ts
// ============================================
// Service for managing user course access and purchase validation

import { databaseService } from '@/lib/services/database.service'
import { coursesData, type CourseData } from '@/lib/data/courses'
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
   */
  async getCoursesWithAccessStatus(
    userId: string | null
  ): Promise<CourseWithAccess[]> {
    // If no user, all courses are not purchased
    if (!userId) {
      return coursesData.map(course => ({
        ...course,
        isPurchased: false,
        activeEnrollment: false
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

      // Map courses with access status
      return coursesData.map(course => {
        const courseId = course.course.Unique_id
        const isPurchased = purchasedCourseIds.includes(courseId)
        const enrollment = enrollmentMap.get(courseId)
        
        // Check if enrollment is active and not expired
        const isActive = enrollment?.status === 'active'
        const isNotExpired = !enrollment?.expires_at || 
          new Date(enrollment.expires_at) > new Date()
        
        return {
          ...course,
          isPurchased,
          activeEnrollment: isPurchased && isActive && isNotExpired,
          expiresAt: enrollment?.expires_at
        }
      })
    } catch (error) {
      console.error('Error enriching courses with access status:', error)
      // Fallback to all courses not purchased
      return coursesData.map(course => ({
        ...course,
        isPurchased: false,
        activeEnrollment: false
      }))
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
        conflictingItems: []
      }
    }

    try {
      const purchasedCourseIds = await this.getUserPurchasedCourseIds(userId)
      
      // Check for bundles that include purchased courses
      const bundlesWithPurchasedCourses = this.checkBundleConflicts(
        cartItems,
        purchasedCourseIds
      )

      // Find items that are already purchased
      const directConflicts = cartItems.filter(item => 
        purchasedCourseIds.includes(item.courseId)
      )

      // Combine all conflicts
      const conflictingItems = [
        ...directConflicts,
        ...bundlesWithPurchasedCourses
      ]

      if (conflictingItems.length > 0) {
        const itemNames = conflictingItems.map(item => item.courseName).join(', ')
        return {
          isValid: false,
          conflictingItems,
          message: `You already own these courses: ${itemNames}. Please remove them from your cart to continue.`
        }
      }

      return {
        isValid: true,
        conflictingItems: []
      }
    } catch (error) {
      console.error('Error validating cart:', error)
      // On error, allow checkout but warn
      return {
        isValid: true,
        conflictingItems: [],
        message: 'Unable to validate cart items. Please verify your purchases before checkout.'
      }
    }
  }

  /**
   * Check if any bundles in cart contain already purchased courses
   */
  private checkBundleConflicts(
    cartItems: CartItem[],
    purchasedCourseIds: string[]
  ): CartItem[] {
    const conflictingBundles: CartItem[] = []

    for (const item of cartItems) {
      const courseData = coursesData.find(c => c.course.Unique_id === item.courseId)
      
      // Check if this is a bundle
      const isBundle = courseData?.plans.some(plan => plan.category === 'bundle')
      
      if (isBundle && courseData?.course.package) {
        // Check if any course in the bundle is already purchased
        const bundleContents = courseData.course.package
        const hasConflict = bundleContents.some(courseId => 
          purchasedCourseIds.includes(courseId)
        )
        
        if (hasConflict) {
          conflictingBundles.push(item)
        }
      }
    }

    return conflictingBundles
  }

  /**
   * Check if a specific course can be added to cart
   */
  canAddCourseToCart(
    courseId: string,
    purchasedCourseIds: string[]
  ): { canAdd: boolean; reason?: string } {
    // Check if course is already purchased
    if (purchasedCourseIds.includes(courseId)) {
      return {
        canAdd: false,
        reason: 'You already own this course'
      }
    }

    // Check if course is part of a purchased bundle
    const purchasedBundles = coursesData.filter(course => {
      const isBundle = course.plans.some(plan => plan.category === 'bundle')
      return isBundle && purchasedCourseIds.includes(course.course.Unique_id)
    })

    for (const bundle of purchasedBundles) {
      if (bundle.course.package?.includes(courseId)) {
        return {
          canAdd: false,
          reason: `You already own this course as part of the ${bundle.course.name} bundle`
        }
      }
    }

    return { canAdd: true }
  }

  /**
   * Get course access URL for enrolled courses
   */
  getCourseAccessUrl(courseId: string, planLabel: string): string {
    const courseData = coursesData.find(c => c.course.Unique_id === courseId)
    const plan = courseData?.plans.find(p => p.label === planLabel)
    return plan?.url || '#'
  }
}

export const userCoursesService = new UserCoursesService()