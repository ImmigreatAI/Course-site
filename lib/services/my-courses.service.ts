// lib/services/my-courses.service.ts
// ============================================
import { databaseService } from '@/lib/services/database.service'
import type { Enrollment, EnrollmentGroup, PurchaseWithItems, CoursePageData } from '@/lib/types/enrollment.types'

export class MyCoursesService {
  /**
   * Get all user course data
   */
  async getUserCourseData(userId: string): Promise<CoursePageData | null> {
    try {
      const user = await databaseService.getUserByClerkId(userId)
      
      if (!user) {
        return null
      }

      const [enrollments, purchases] = await Promise.all([
        databaseService.getUserEnrollments(user.id),
        databaseService.getUserPurchaseHistory(user.id) as Promise<PurchaseWithItems[]>
      ])

      return { enrollments, purchases }
    } catch (error) {
      console.error('Error fetching user course data:', error)
      throw error
    }
  }

  /**
   * Group enrollments by status
   */
  groupEnrollmentsByStatus(enrollments: Enrollment[]): EnrollmentGroup {
    return {
      active: enrollments.filter(e => e.status === 'active'),
      pending: enrollments.filter(e => e.status === 'pending'),
      expired: enrollments.filter(e => e.status === 'expired')
    }
  }

  /**
   * Calculate days until enrollment expiry
   */
  getDaysUntilExpiry(expiryDate: string | null): number | null {
    if (!expiryDate) return null
    
    const days = Math.ceil(
      (new Date(expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    )
    
    return days > 0 ? days : 0
  }

  /**
   * Format expiry message
   */
  formatExpiryMessage(days: number | null): string {
    if (days === null) return ''
    if (days === 0) return 'Expires today!'
    if (days === 1) return 'Expires tomorrow'
    return `Expires in ${days} days`
  }

  /**
   * Format plan label
   */
  formatPlanLabel(planLabel: string): string {
    return planLabel === '6mo' ? '6 Month Access' : '7 Day Trial'
  }
}

export const myCoursesService = new MyCoursesService()
