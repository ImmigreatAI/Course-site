// lib/services/unified-course.service.ts
// ============================================
// FULLY MIGRATED: Unified service with zero static data dependencies
// Database-first with intelligent fallback and comprehensive error handling

import { unstable_cache as cache } from 'next/cache'
import { createAnonServerClient } from '@/lib/supabase/anon'
import type { CourseData } from '@/lib/data/courses' // Type import only - no data dependency
import type { CartItem } from '@/lib/store/cart-store'

interface ProcessedCheckoutItem {
  courseId: string
  courseName: string
  planLabel: string
  price: number
  enrollmentId: string
  stripePriceId: string
  category: 'course' | 'bundle'
  url: string
}

type RawCourse = {
  id: string
  unique_id: string
  name: string
  description: string | null
  is_bundle: boolean
}

type RawPlan = {
  id: string
  course_id: string
  label: '6mo' | '7day'
  category: 'course' | 'bundle'
  type: 'paid' | 'free'
  price: number
  enrollment_id: string
  stripe_price_id: string
}

type RawBundleItem = {
  bundle_course_id: string
  child_course_id: string
}

// Emergency fallback data - minimal structure to prevent complete failure
const EMERGENCY_FALLBACK: CourseData[] = [
  {
    course: {
      Unique_id: "emergency-fallback",
      name: "Service Unavailable",
      description: "Database connection failed. Please try again later.",
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

export class UnifiedCourseService {
  private useDatabase = true // Feature flag for migration control
  private lastSuccessfulFetch: CourseData[] | null = null // Cache last known good data
  private retryCount = 0
  private maxRetries = 3

  /**
   * Cached fetch of the entire catalog (courses, plans, bundle items)
   */
  private fetchAllRaw = cache(
    async () => {
      const sb = createAnonServerClient()

      const [
        { data: courses, error: ce },
        { data: plans, error: pe },
        { data: bundles, error: be },
      ] = await Promise.all([
        sb.from('courses').select('*'),
        sb.from('course_plans').select('*'),
        sb.from('bundle_items').select('*'),
      ])

      if (ce) throw new Error(`Courses fetch failed: ${ce.message}`)
      if (pe) throw new Error(`Plans fetch failed: ${pe.message}`)
      if (be) throw new Error(`Bundles fetch failed: ${be.message}`)

      return {
        courses: (courses ?? []) as RawCourse[],
        plans: (plans ?? []) as RawPlan[],
        bundles: (bundles ?? []) as RawBundleItem[],
      }
    },
    ['unified-catalog:all'],
    { tags: ['courses'], revalidate: 300 } // 5 min cache
  )

  /**
   * Generate course URL based on category and enrollment_id
   */
  private generateCourseUrl(category: 'course' | 'bundle', enrollmentId: string): string {
    const baseUrl = 'https://courses.getgreencardonyourown.com'
    
    if (category === 'bundle') {
      return `${baseUrl}/program/${enrollmentId}`
    } else {
      return `${baseUrl}/path-player?courseid=${enrollmentId}`
    }
  }

  /**
   * Validate database response and convert to CourseData format
   */
  private validateAndTransformData(rawData: {
    courses: RawCourse[]
    plans: RawPlan[]
    bundles: RawBundleItem[]
  }): CourseData[] {
    const { courses, plans, bundles } = rawData

    // Validation checks
    if (!Array.isArray(courses) || courses.length === 0) {
      throw new Error('No courses found in database')
    }

    if (!Array.isArray(plans) || plans.length === 0) {
      throw new Error('No course plans found in database')
    }

    // Validate required fields
    for (const course of courses) {
      if (!course.unique_id || !course.name) {
        throw new Error(`Invalid course data: missing required fields for course ${course.id}`)
      }
    }

    for (const plan of plans) {
      if (!plan.course_id || !plan.label || !plan.enrollment_id || !plan.stripe_price_id) {
        throw new Error(`Invalid plan data: missing required fields for plan ${plan.id}`)
      }
      if (!plan.stripe_price_id.startsWith('price_')) {
        console.warn(`⚠️ Invalid Stripe price ID format: ${plan.stripe_price_id}`)
      }
    }

    // Build course data structure
    const idToUnique: Record<string, string> = {}
    for (const c of courses) idToUnique[c.id] = c.unique_id

    const plansByCourseId: Record<string, RawPlan[]> = {}
    for (const p of plans) (plansByCourseId[p.course_id] ??= []).push(p)

    const childrenByBundleId: Record<string, string[]> = {}
    for (const bi of bundles) {
      const childUnique = idToUnique[bi.child_course_id]
      if (!childUnique) {
        console.warn(`⚠️ Bundle relationship points to non-existent course: ${bi.child_course_id}`)
        continue
      }
      ;(childrenByBundleId[bi.bundle_course_id] ??= []).push(childUnique)
    }

    return courses.map((c) => ({
      course: {
        Unique_id: c.unique_id,
        name: c.name,
        description: c.description ?? '',
        package: c.is_bundle ? (childrenByBundleId[c.id] ?? []) : [],
      },
      plans: (plansByCourseId[c.id] ?? []).map((pl) => ({
        url: this.generateCourseUrl(pl.category, pl.enrollment_id),
        category: pl.category,
        type: pl.type,
        label: pl.label,
        price: Number(pl.price),
        enrollment_id: pl.enrollment_id,
        stripe_price_id: pl.stripe_price_id,
      })),
    }))
  }

  /**
   * Get all courses with intelligent fallback handling
   */
  async getAllCourses(): Promise<CourseData[]> {
    // Feature flag: disable database during migration if needed
    if (!this.useDatabase) {
      console.log('🔄 Database mode disabled - using emergency fallback')
      return this.lastSuccessfulFetch || EMERGENCY_FALLBACK
    }

    try {
      console.log('🔄 Fetching courses from database...')
      
      const rawData = await this.fetchAllRaw()
      const transformedData = this.validateAndTransformData(rawData)
      
      // Success - reset retry count and cache the result
      this.retryCount = 0
      this.lastSuccessfulFetch = transformedData
      
      console.log(`✅ Successfully loaded ${transformedData.length} courses from database`)
      return transformedData

    } catch (error) {
      this.retryCount++
      console.error(`❌ Database error (attempt ${this.retryCount}/${this.maxRetries}):`, error)

      // Use last successful fetch if available
      if (this.lastSuccessfulFetch) {
        console.log('🔄 Using cached course data from last successful fetch')
        return this.lastSuccessfulFetch
      }

      // If we haven't hit max retries, throw to trigger retry logic upstream
      if (this.retryCount < this.maxRetries) {
        throw error
      }

      // Max retries reached - use emergency fallback
      console.error('💥 Max retries reached, using emergency fallback')
      return EMERGENCY_FALLBACK
    }
  }

  /**
   * Get single course by unique_id with error handling
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
   * Find course data by Unique_id (replaces static findCourseData helper)
   */
  async findCourseData(uniqueId: string): Promise<CourseData | null> {
    return this.getCourseByUniqueId(uniqueId)
  }

  /**
   * Check if course is a bundle (replaces static isBundle helper)
   */
  async isBundle(courseId: string): Promise<boolean> {
    try {
      const courseData = await this.findCourseData(courseId)
      return courseData?.plans.some(plan => plan.category === 'bundle') || false
    } catch (error) {
      console.error(`Error checking if ${courseId} is bundle:`, error)
      return false
    }
  }

  /**
   * Get bundle contents (replaces static getBundleContents helper)
   */
  async getBundleContents(bundleId: string): Promise<string[]> {
    try {
      const courseData = await this.findCourseData(bundleId)
      return courseData?.course.package || []
    } catch (error) {
      console.error(`Error getting bundle contents for ${bundleId}:`, error)
      return []
    }
  }

  /**
   * Get course access URL for enrolled courses
   */
  async getCourseAccessUrl(courseId: string, planLabel: string): Promise<string> {
    try {
      const courseData = await this.findCourseData(courseId)
      const plan = courseData?.plans.find(p => p.label === planLabel)
      return plan?.url || '#'
    } catch (error) {
      console.error(`Error getting access URL for ${courseId}:`, error)
      return '#'
    }
  }

  /**
   * Check if a specific course can be added to cart
   */
  async canAddCourseToCart(
    courseId: string,
    purchasedCourseIds: string[]
  ): Promise<{ canAdd: boolean; reason?: string }> {
    try {
      // Already purchased?
      if (purchasedCourseIds.includes(courseId)) {
        return {
          canAdd: false,
          reason: 'You already own this course',
        }
      }

      // Get all courses to check bundles
      const allCourses = await this.getAllCourses()
      
      // Is it part of any purchased bundle?
      const purchasedBundles = allCourses.filter(course => {
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
    } catch (error) {
      console.error(`Error checking if can add ${courseId} to cart:`, error)
      return { canAdd: false, reason: 'Unable to verify course availability' }
    }
  }

  /**
   * Validate checkout item against database course data
   */
  async validateCheckoutItem(item: {
    courseId: string
    courseName: string
    planLabel: string
    price: number
    enrollmentId: string
    stripePriceId: string
  }): Promise<{ isValid: boolean; error?: string; processedItem?: ProcessedCheckoutItem }> {
    try {
      const course = await this.findCourseData(item.courseId)
      
      if (!course) {
        return { 
          isValid: false, 
          error: `Course not found: ${item.courseId}` 
        }
      }

      // Find plan in course
      const plan = course.plans.find(p => p.label === item.planLabel)
      
      if (!plan) {
        return { 
          isValid: false,
          error: `Plan "${item.planLabel}" not found for course "${item.courseName}"` 
        }
      }

      // Validate price matches
      if (plan.price !== item.price) {
        return { 
          isValid: false,
          error: `Price mismatch for "${item.courseName}". Expected: ${plan.price}, Received: ${item.price}` 
        }
      }

      // Validate enrollment ID matches
      if (plan.enrollment_id !== item.enrollmentId) {
        return { 
          isValid: false,
          error: `Enrollment ID mismatch for "${item.courseName}"` 
        }
      }

      // Validate Stripe price ID format
      if (!plan.stripe_price_id.startsWith('price_')) {
        return { 
          isValid: false,
          error: `Invalid Stripe price ID format for course "${item.courseName}"` 
        }
      }

      const processedItem: ProcessedCheckoutItem = {
        courseId: item.courseId,
        courseName: course.course.name,
        planLabel: item.planLabel,
        price: plan.price,
        enrollmentId: plan.enrollment_id,
        stripePriceId: plan.stripe_price_id,
        category: plan.category || 'course',
        url: plan.url || '#'
      }

      return {
        isValid: true,
        processedItem
      }
    } catch (error) {
      return {
        isValid: false,
        error: `Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    }
  }

  /**
   * Check for cart conflicts with purchased courses
   */
  async checkCartConflicts(
    cartItems: CartItem[],
    purchasedCourseIds: string[]
  ): Promise<{
    hasConflicts: boolean
    conflictingItems: CartItem[]
    message?: string
  }> {
    try {
      const conflictingItems: CartItem[] = []
      
      for (const item of cartItems) {
        // Direct ownership check
        if (purchasedCourseIds.includes(item.courseId)) {
          conflictingItems.push(item)
          continue
        }

        // Bundle conflict check
        const isItemBundle = await this.isBundle(item.courseId)
        
        if (isItemBundle) {
          // Item is a bundle - check if user owns any child courses
          const bundleContents = await this.getBundleContents(item.courseId)
          const hasOwnedChildren = bundleContents.some(childId => 
            purchasedCourseIds.includes(childId)
          )
          
          if (hasOwnedChildren) {
            conflictingItems.push(item)
          }
        } else {
          // Item is a course - check if user owns bundles containing this course
          const allCourses = await this.getAllCourses()
          const ownedBundles = allCourses.filter(course => {
            const courseIsBundle = course.plans.some(p => p.category === 'bundle')
            return courseIsBundle && purchasedCourseIds.includes(course.course.Unique_id)
          })
          
          for (const bundle of ownedBundles) {
            if (bundle.course.package?.includes(item.courseId)) {
              conflictingItems.push(item)
              break
            }
          }
        }
      }

      if (conflictingItems.length > 0) {
        const itemNames = conflictingItems.map(item => item.courseName).join(', ')
        return {
          hasConflicts: true,
          conflictingItems,
          message: `You already own these courses: ${itemNames}. Please remove them from your cart to continue.`
        }
      }

      return {
        hasConflicts: false,
        conflictingItems: []
      }
    } catch (error) {
      console.error('Error checking cart conflicts:', error)
      return {
        hasConflicts: false,
        conflictingItems: [],
        message: 'Unable to verify cart conflicts - proceeding with caution'
      }
    }
  }

  /**
   * Force refresh the cache
   */
  async refreshCache(): Promise<void> {
    this.retryCount = 0
    this.lastSuccessfulFetch = null
    // Clear Next.js cache
    await fetch('/api/revalidate', { 
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tags: ['courses'] })
    }).catch(console.error)
  }

  /**
   * Feature flag control - can be used during migration
   */
  setDatabaseMode(enabled: boolean): void {
    this.useDatabase = enabled
    console.log(`🔄 Course service mode: ${enabled ? 'Database' : 'Emergency Fallback'}`)
  }

  /**
   * Health check - validates database connection and data integrity
   */
  async healthCheck(): Promise<{ 
    status: 'ok' | 'warning' | 'error'
    message: string
    courseCount?: number
    retryCount?: number
    lastSuccessfulFetch?: string
    details?: {
      responseTime?: string
      retryCount?: number
      cacheStatus?: string
      [key: string]: unknown
    }
  }> {
    try {
      const startTime = Date.now()
      const courses = await this.getAllCourses()
      const responseTime = Date.now() - startTime
      
      // Check if using fallback data
      if (courses === EMERGENCY_FALLBACK) {
        return { 
          status: 'error', 
          message: 'Using emergency fallback data - database unavailable',
          courseCount: courses.length,
          retryCount: this.retryCount
        }
      }

      if (courses === this.lastSuccessfulFetch && this.retryCount > 0) {
        return {
          status: 'warning',
          message: 'Using cached data - database may be experiencing issues',
          courseCount: courses.length,
          retryCount: this.retryCount,
          lastSuccessfulFetch: 'cached'
        }
      }

      // Validate data quality
      const hasValidPlans = courses.every(c => c.plans.length > 0)
      const hasValidPrices = courses.every(c => 
        c.plans.every(p => p.stripe_price_id.startsWith('price_'))
      )
      const hasValidUrls = courses.every(c =>
        c.plans.every(p => p.url && p.url !== '#')
      )

      if (!hasValidPlans) {
        return { status: 'error', message: 'Some courses missing plans', courseCount: courses.length }
      }

      if (!hasValidPrices) {
        return { 
          status: 'warning', 
          message: 'Some plans have invalid Stripe price IDs', 
          courseCount: courses.length 
        }
      }

      if (!hasValidUrls) {
        return {
          status: 'warning',
          message: 'Some plans have placeholder URLs',
          courseCount: courses.length
        }
      }

      return { 
        status: 'ok', 
        message: 'All systems operational', 
        courseCount: courses.length,
        details: {
          responseTime: `${responseTime}ms`,
          retryCount: this.retryCount
        }
      }
    } catch (error) {
      return { 
        status: 'error', 
        message: `Health check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        retryCount: this.retryCount
      }
    }
  }
}

export const unifiedCourseService = new UnifiedCourseService()