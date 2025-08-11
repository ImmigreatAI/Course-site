// lib/services/enrollment.service.ts (FIXED)
// ============================================
import { databaseService } from '@/lib/services/database.service'
import { learnWorldsService, type EnrollmentData, type EnrollmentResult } from './learnworlds.service'
import Stripe from 'stripe'
import type { Database } from '@/types/supabase'

type PurchaseItem = Database['public']['Tables']['purchase_items']['Row']

interface EnrollmentMetadata {
  userEmail: string
  userName: string
  enrollmentIds: string
  courseCategories: string
  coursePrices: string
  courseNames: string
  planLabels: string
  stripePriceIds: string
  enrollmentUrls: string
  userId: string // Clerk user ID
}

export class EnrollmentService {
  // Parse and validate metadata
  private parseMetadata(metadata: Stripe.Metadata): EnrollmentMetadata {
    const required = ['userEmail', 'userName', 'enrollmentIds', 'userId']
    
    for (const field of required) {
      if (!metadata[field]) {
        throw new Error(`Missing required metadata: ${field}`)
      }
    }

    return {
      userEmail: metadata.userEmail,
      userName: metadata.userName || 'User',
      enrollmentIds: metadata.enrollmentIds,
      courseCategories: metadata.courseCategories || '[]',
      coursePrices: metadata.coursePrices || '[]',
      courseNames: metadata.courseNames || '[]',
      planLabels: metadata.planLabels || '[]',
      stripePriceIds: metadata.stripePriceIds || '[]',
      enrollmentUrls: metadata.enrollmentUrls || '[]',
      userId: metadata.userId
    }
  }

  // Parse JSON arrays from metadata
  private parseArrays(metadata: EnrollmentMetadata) {
    try {
      return {
        enrollmentIds: JSON.parse(metadata.enrollmentIds) as string[],
        categories: JSON.parse(metadata.courseCategories) as string[],
        prices: JSON.parse(metadata.coursePrices) as number[],
        names: JSON.parse(metadata.courseNames) as string[],
        planLabels: JSON.parse(metadata.planLabels) as string[],
        stripePriceIds: JSON.parse(metadata.stripePriceIds) as string[],
        enrollmentUrls: JSON.parse(metadata.enrollmentUrls) as string[]
      }
    } catch (error) {
      console.error('Failed to parse enrollment data:', error)
      throw new Error('Invalid enrollment data format')
    }
  }

  // Process complete enrollment
  async processEnrollment(session: Stripe.Checkout.Session): Promise<void> {
    console.log('\n🚀 === STARTING ENROLLMENT PROCESS ===')
    console.log('Session ID:', session.id)
    console.log('Amount:', session.amount_total)

    // Step 1: Parse and validate metadata
    const metadata = this.parseMetadata(session.metadata || {})
    const arrays = this.parseArrays(metadata)

    console.log('📋 Enrollment details:', {
      userEmail: metadata.userEmail,
      totalCourses: arrays.enrollmentIds.length,
      courses: arrays.names
    })

    // Step 2: Database operations
    const { dbUser, purchaseItems } = await this.processDatabaseOperations(
      metadata,
      arrays,
      session
    )

    // Step 3: LearnWorlds enrollment
    const enrollmentResults = await this.processLearnWorldsEnrollments(
      metadata,
      arrays,
      dbUser.id,
      purchaseItems
    )

    // Step 4: Complete purchase
    await databaseService.completePurchase(session.id)
    
    // Step 5: Log results
    this.logEnrollmentSummary(enrollmentResults, session.id)
  }

  // Process database operations
  private async processDatabaseOperations(
    metadata: EnrollmentMetadata,
    arrays: ReturnType<typeof this.parseArrays>,
    session: Stripe.Checkout.Session
  ) {
    console.log('\n💾 === DATABASE OPERATIONS ===')
    
    // Get or create user
    let dbUser = await databaseService.getUserByClerkId(metadata.userId)
    
    if (!dbUser) {
      console.log('📝 Creating user in database...')
      dbUser = await databaseService.createOrUpdateUser({
        clerk_user_id: metadata.userId,
        email: metadata.userEmail,
        full_name: metadata.userName,
        username: metadata.userName
      })
    }

    // Create purchase record
    console.log('💳 Creating purchase record...')
    const purchase = await databaseService.createPurchase({
      user_id: dbUser.id,
      stripe_session_id: session.id,
      stripe_payment_intent_id: session.payment_intent as string | null,
      amount: session.amount_total || 0,
      currency: session.currency || 'usd'
    })

    // Create purchase items
    console.log('📦 Creating purchase items...')
    const purchaseItemsData = arrays.enrollmentIds.map((enrollmentId, i) => ({
      course_id: enrollmentId,
      course_name: arrays.names[i] || 'Unknown Course',
      plan_label: (arrays.planLabels[i] || '6mo') as '6mo' | '7day',
      price: arrays.prices[i] || 0,
      enrollment_id: enrollmentId,
      stripe_price_id: arrays.stripePriceIds[i] || ''
    }))

    const purchaseItems = await databaseService.createPurchaseItems(
      purchase.id,
      purchaseItemsData
    )

    console.log('✅ Database operations completed')
    
    return { dbUser, purchase, purchaseItems }
  }

  // Process LearnWorlds enrollments
  private async processLearnWorldsEnrollments(
    metadata: EnrollmentMetadata,
    arrays: ReturnType<typeof this.parseArrays>,
    userId: string,
    purchaseItems: PurchaseItem[]
  ): Promise<EnrollmentResult[]> {
    console.log('\n👤 === LEARNWORLDS ENROLLMENT ===')
    
    // Ensure user exists in LearnWorlds
    const lwUser = await learnWorldsService.ensureUserExists(
      metadata.userEmail,
      metadata.userName
    )

    // Update database with LearnWorlds user ID if new
    if (lwUser.id) {
      await databaseService.createOrUpdateUser({
        clerk_user_id: metadata.userId,
        email: metadata.userEmail,
        full_name: metadata.userName,
        username: metadata.userName,
        learnworlds_user_id: lwUser.id
      })
    }

    // Enroll in each course
    const enrollmentResults: EnrollmentResult[] = []
    
    for (let i = 0; i < arrays.enrollmentIds.length; i++) {
      const result = await this.enrollSingleCourse(
        metadata.userEmail,
        arrays,
        i,
        userId,
        purchaseItems[i]
      )
      enrollmentResults.push(result)
    }

    return enrollmentResults
  }

  // Enroll in a single course
  private async enrollSingleCourse(
    userEmail: string,
    arrays: ReturnType<typeof this.parseArrays>,
    index: number,
    userId: string,
    purchaseItem: PurchaseItem
  ): Promise<EnrollmentResult> {
    const enrollmentId = arrays.enrollmentIds[index]
    const category = arrays.categories[index] || 'course'
    const originalPrice = arrays.prices[index] || 0
    const courseName = arrays.names[index] || 'Unknown Course'
    const productType = category === 'bundle' ? 'bundle' : 'course'
    
    console.log(`\n📖 Course ${index + 1}/${arrays.enrollmentIds.length}: ${courseName}`)
    
    const enrollmentData: EnrollmentData = {
      productId: enrollmentId,
      productType: productType as 'course' | 'bundle',
      justification: 'Added by admin - Stripe payment completed',
      price: originalPrice,
      send_enrollment_email: true
    }

    try {
      const success = await learnWorldsService.enrollUser(userEmail, enrollmentData)
      
      if (success) {
        // Create enrollment record in database
        await databaseService.createEnrollment({
          user_id: userId,
          purchase_item_id: purchaseItem.id,
          course_id: enrollmentId,
          course_name: courseName,
          course_url: arrays.enrollmentUrls[index] || '',
          plan_label: arrays.planLabels[index] || '6mo',
          learnworlds_enrollment_id: enrollmentId
        })
        
        console.log(`✅ Enrolled successfully`)
      }
      
      return {
        enrollmentId,
        category,
        success,
        index,
        originalPrice,
        courseName
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      console.error(`❌ Enrollment failed: ${errorMessage}`)
      
      return {
        enrollmentId,
        category,
        success: false,
        error: errorMessage,
        index,
        originalPrice,
        courseName
      }
    }
  }

  // Log enrollment summary
  private logEnrollmentSummary(results: EnrollmentResult[], sessionId: string): void {
    console.log('\n📊 === ENROLLMENT SUMMARY ===')
    
    const successful = results.filter(r => r.success)
    const failed = results.filter(r => !r.success)
    
    console.log(`Session: ${sessionId}`)
    console.log(`Total: ${results.length} courses`)
    console.log(`Successful: ${successful.length}`)
    console.log(`Failed: ${failed.length}`)
    
    if (successful.length > 0) {
      console.log('\n✅ Successful enrollments:')
      successful.forEach((r, i) => {
        console.log(`  ${i + 1}. ${r.courseName} - $${r.originalPrice}`)
      })
    }
    
    if (failed.length > 0) {
      console.log('\n❌ Failed enrollments:')
      failed.forEach((r, i) => {
        console.log(`  ${i + 1}. ${r.courseName} - Error: ${r.error}`)
      })
    }
  }
}

export const enrollmentService = new EnrollmentService()