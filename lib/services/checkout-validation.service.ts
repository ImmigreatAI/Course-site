// lib/services/checkout-validation.service.ts
// ============================================
// Enhanced with purchase validation

import { coursesData } from '@/lib/data/courses'
import { databaseService } from '@/lib/services/database.service'
import type { CheckoutItem, ProcessedItem } from '@/lib/types/checkout.types'

export class CheckoutValidationService {
  /**
   * Validate items against user's purchases
   */
  async validateAgainstPurchases(
    items: CheckoutItem[],
    userId: string
  ): Promise<{ isValid: boolean; error?: string; conflictingItems?: string[] }> {
    try {
      // Get user's purchased course IDs
      const purchasedCourseIds = await databaseService.getUserPurchasedCourseIds(userId)
      
      if (purchasedCourseIds.length === 0) {
        return { isValid: true }
      }

      // Check for conflicts
      const conflicts: string[] = []
      
      for (const item of items) {
        if (purchasedCourseIds.includes(item.courseId)) {
          conflicts.push(item.courseName)
        }
        
        // Check if item is a bundle containing purchased courses
        const course = coursesData.find(c => c.course.Unique_id === item.courseId)
        const isBundle = course?.plans.some(p => p.category === 'bundle')
        
        if (isBundle && course?.course.package) {
          const bundleContents = course.course.package
          const purchasedInBundle = bundleContents.filter(id => 
            purchasedCourseIds.includes(id)
          )
          
          if (purchasedInBundle.length > 0) {
            conflicts.push(`${item.courseName} (contains owned courses)`)
          }
        }
      }
      
      if (conflicts.length > 0) {
        return {
          isValid: false,
          error: `You already own these items: ${conflicts.join(', ')}. Please remove them from your cart.`,
          conflictingItems: conflicts
        }
      }
      
      return { isValid: true }
    } catch (error) {
      console.error('Error validating against purchases:', error)
      // Allow checkout to proceed but log the error
      return { isValid: true }
    }
  }

  /**
   * Validate and process a single checkout item
   */
  validateItem(item: CheckoutItem): ProcessedItem | { error: string } {
    // Find course in data
    const course = coursesData.find(c => c.course.Unique_id === item.courseId)
    
    if (!course) {
      console.log('❌ Course not found:', { 
        courseId: item.courseId, 
        availableIds: coursesData.map(c => c.course.Unique_id) 
      })
      return { error: `Course not found: ${item.courseId}` }
    }

    // Find plan in course
    const plan = course.plans.find(p => p.label === item.planLabel)
    
    if (!plan) {
      console.log('❌ Plan not found:', { 
        planLabel: item.planLabel, 
        availablePlans: course.plans.map(p => p.label) 
      })
      return { 
        error: `Plan "${item.planLabel}" not found for course "${item.courseName}"` 
      }
    }

    // Validate price matches
    if (plan.price !== item.price) {
      console.log('❌ Price mismatch:', { 
        expected: plan.price, 
        received: item.price 
      })
      return { 
        error: `Price mismatch for "${item.courseName}". Expected: ${plan.price}, Received: ${item.price}` 
      }
    }

    // Validate enrollment ID matches
    if (plan.enrollment_id !== item.enrollmentId) {
      console.log('❌ Enrollment ID mismatch:', { 
        expected: plan.enrollment_id, 
        received: item.enrollmentId 
      })
      return { 
        error: `Enrollment ID mismatch for "${item.courseName}"` 
      }
    }

    // Validate Stripe price ID format
    if (!this.isValidStripePriceId(plan.stripe_price_id)) {
      const courseType = plan.price === 0 ? 'free' : 'paid'
      return { 
        error: `Invalid Stripe price ID format for ${courseType} course "${item.courseName}". Must start with "price_"` 
      }
    }

    console.log('✅ Item validated:', {
      courseId: item.courseId,
      courseName: course.course.name,
      planLabel: item.planLabel,
      price: plan.price,
      enrollmentId: plan.enrollment_id
    })

    return {
      courseId: item.courseId,
      courseName: course.course.name,
      planLabel: item.planLabel,
      price: plan.price,
      enrollmentId: plan.enrollment_id,
      stripePriceId: plan.stripe_price_id,
      category: plan.category || 'course',
      url: plan.url || ''
    }
  }

  /**
   * Validate all checkout items
   */
  async validateItems(
    items: CheckoutItem[],
    userId?: string
  ): Promise<ProcessedItem[] | { error: string }> {
    const processedItems: ProcessedItem[] = []
    
    // First validate each item's data
    for (const item of items) {
      const result = this.validateItem(item)
      
      if ('error' in result) {
        return result
      }
      
      processedItems.push(result)
    }
    
    // Then validate against user's purchases if userId provided
    if (userId) {
      const purchaseValidation = await this.validateAgainstPurchases(items, userId)
      
      if (!purchaseValidation.isValid) {
        return { error: purchaseValidation.error || 'Items already purchased' }
      }
    }
    
    return processedItems
  }

  /**
   * Check if Stripe price ID is valid
   */
  private isValidStripePriceId(priceId: string): boolean {
    return priceId.startsWith('price_')
  }
}

export const checkoutValidationService = new CheckoutValidationService()