// lib/services/checkout-validation.service.ts
// ============================================
// Enhanced with database integration via unified course service
// Maintains all validation logic with improved error handling

import { unifiedCourseService } from '@/lib/services/unified-course.service'
import { databaseService } from '@/lib/services/database.service'
import type { CheckoutItem, ProcessedItem } from '@/lib/types/checkout.types'

export class CheckoutValidationService {
  /**
   * Validate items against user's purchases using database
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

      console.log('🔍 Validating against purchases:', {
        userId,
        itemCount: items.length,
        purchasedCount: purchasedCourseIds.length
      })

      // Use unified service for conflict checking
      const conflictResult = await unifiedCourseService.checkCartConflicts(
        items.map(item => ({
          courseId: item.courseId,
          courseName: item.courseName,
          planLabel: item.planLabel as '6mo' | '7day',
          price: item.price,
          enrollmentId: item.enrollmentId,
          stripePriceId: item.stripePriceId
        })),
        purchasedCourseIds
      )

      if (conflictResult.hasConflicts) {
        const conflictNames = conflictResult.conflictingItems.map(item => item.courseName)
        return {
          isValid: false,
          error: `You already own these items: ${conflictNames.join(', ')}. Please remove them from your cart.`,
          conflictingItems: conflictNames
        }
      }
      
      return { isValid: true }
    } catch (error) {
      console.error('❌ Error validating against purchases:', error)
      // Allow checkout to proceed but log the error for monitoring
      return { isValid: true }
    }
  }

  /**
   * Validate and process a single checkout item using database
   */
  async validateItem(item: CheckoutItem): Promise<ProcessedItem | { error: string }> {
    try {
      console.log('🔍 Validating checkout item:', {
        courseId: item.courseId,
        planLabel: item.planLabel,
        price: item.price
      })

      // Use unified service for validation
      const validationResult = await unifiedCourseService.validateCheckoutItem({
        courseId: item.courseId,
        courseName: item.courseName,
        planLabel: item.planLabel,
        price: item.price,
        enrollmentId: item.enrollmentId,
        stripePriceId: item.stripePriceId
      })

      if (!validationResult.isValid) {
        console.log('❌ Validation failed:', validationResult.error)
        return { error: validationResult.error || 'Validation failed' }
      }

      if (!validationResult.processedItem) {
        console.log('❌ No processed item returned')
        return { error: 'Invalid validation result' }
      }

      console.log('✅ Item validated successfully:', {
        courseId: validationResult.processedItem.courseId,
        courseName: validationResult.processedItem.courseName,
        planLabel: validationResult.processedItem.planLabel,
        price: validationResult.processedItem.price
      })

      return validationResult.processedItem as ProcessedItem
    } catch (error) {
      console.error('❌ Error validating checkout item:', error)
      return { 
        error: `Validation error for "${item.courseName}": ${error instanceof Error ? error.message : 'Unknown error'}` 
      }
    }
  }

  /**
   * Validate all checkout items with comprehensive error handling
   */
  async validateItems(
    items: CheckoutItem[],
    userId?: string
  ): Promise<ProcessedItem[] | { error: string }> {
    console.log('🔄 Starting checkout validation:', {
      itemCount: items.length,
      hasUserId: !!userId,
      items: items.map(i => ({ courseId: i.courseId, planLabel: i.planLabel, price: i.price }))
    })

    const processedItems: ProcessedItem[] = []
    
    try {
      // First validate each item's data using database
      for (let i = 0; i < items.length; i++) {
        const item = items[i]
        console.log(`🔍 Validating item ${i + 1}/${items.length}:`, item.courseId)
        
        const result = await this.validateItem(item)
        
        if ('error' in result) {
          console.log('❌ Item validation failed:', {
            index: i,
            courseId: item.courseId,
            error: result.error
          })
          return result
        }
        
        processedItems.push(result)
        console.log(`✅ Item ${i + 1}/${items.length} validated successfully`)
      }
      
      console.log('✅ All items validated, checking purchase conflicts...')
      
      // Then validate against user's purchases if userId provided
      if (userId) {
        const purchaseValidation = await this.validateAgainstPurchases(items, userId)
        
        if (!purchaseValidation.isValid) {
          console.log('❌ Purchase validation failed:', purchaseValidation.error)
          return { error: purchaseValidation.error || 'Items already purchased' }
        }
        
        console.log('✅ Purchase validation passed')
      } else {
        console.log('ℹ️ Skipping purchase validation (no user ID)')
      }
      
      console.log('🎉 All validations passed, returning processed items:', {
        count: processedItems.length,
        totalValue: processedItems.reduce((sum, item) => sum + item.price, 0)
      })
      
      return processedItems
    } catch (error) {
      console.error('❌ Unexpected error during validation:', error)
      return { 
        error: `Checkout validation failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
      }
    }
  }

  /**
   * Lightweight validation for single item (used by cart operations)
   */
  async quickValidateItem(courseId: string, planLabel: string): Promise<{ isValid: boolean; error?: string }> {
    try {
      const course = await unifiedCourseService.findCourseData(courseId)
      
      if (!course) {
        return { isValid: false, error: `Course not found: ${courseId}` }
      }

      const plan = course.plans.find(p => p.label === planLabel)
      
      if (!plan) {
        return { 
          isValid: false, 
          error: `Plan "${planLabel}" not found for course "${course.course.name}"` 
        }
      }

      if (!this.isValidStripePriceId(plan.stripe_price_id)) {
        return { 
          isValid: false, 
          error: `Invalid Stripe price ID for course "${course.course.name}"` 
        }
      }

      return { isValid: true }
    } catch (error) {
      console.error('❌ Quick validation error:', error)
      return { 
        isValid: false, 
        error: 'Validation service temporarily unavailable' 
      }
    }
  }

  /**
   * Batch validate course existence (used for cart warming)
   */
  async validateCourseExists(courseIds: string[]): Promise<{ 
    valid: string[]; 
    invalid: string[]; 
    errors: Record<string, string> 
  }> {
    const valid: string[] = []
    const invalid: string[] = []
    const errors: Record<string, string> = {}

    try {
      const allCourses = await unifiedCourseService.getAllCourses()
      const courseMap = new Map(allCourses.map(c => [c.course.Unique_id, c]))

      for (const courseId of courseIds) {
        if (courseMap.has(courseId)) {
          valid.push(courseId)
        } else {
          invalid.push(courseId)
          errors[courseId] = 'Course not found in catalog'
        }
      }

      console.log('📊 Batch validation results:', {
        total: courseIds.length,
        valid: valid.length,
        invalid: invalid.length
      })

      return { valid, invalid, errors }
    } catch (error) {
      console.error('❌ Batch validation error:', error)
      
      // Return all as invalid on error
      courseIds.forEach(id => {
        invalid.push(id)
        errors[id] = 'Validation service error'
      })
      
      return { valid, invalid, errors }
    }
  }

  /**
   * Health check for validation service
   */
  async healthCheck(): Promise<{ 
    status: 'healthy' | 'degraded' | 'unhealthy'; 
    details: Record<string, any> 
  }> {
    try {
      // Test database connection
      const startTime = Date.now()
      const testCourses = await unifiedCourseService.getAllCourses()
      const dbResponseTime = Date.now() - startTime

      // Test course service health
      const serviceHealth = await unifiedCourseService.healthCheck()

      const details = {
        courseCount: testCourses.length,
        dbResponseTime: `${dbResponseTime}ms`,
        serviceStatus: serviceHealth.status,
        timestamp: new Date().toISOString()
      }

      if (serviceHealth.status === 'ok' && testCourses.length > 0 && dbResponseTime < 1000) {
        return { status: 'healthy', details }
      } else if (serviceHealth.status === 'ok' && testCourses.length > 0) {
        return { status: 'degraded', details: { ...details, issue: 'Slow response time' } }
      } else {
        return { status: 'unhealthy', details: { ...details, issue: 'Service or data issues' } }
      }
    } catch (error) {
      return {
        status: 'unhealthy',
        details: {
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString()
        }
      }
    }
  }

  /**
   * Check if Stripe price ID is valid
   */
  private isValidStripePriceId(priceId: string): boolean {
    return priceId.startsWith('price_')
  }
}

export const checkoutValidationService = new CheckoutValidationService()