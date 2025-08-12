// lib/services/unified-course.service.ts
// ============================================
// Unified service that replaces static coursesData with database + computed properties
// Extends existing course-catalog.service.ts pattern to handle ALL business logic

import { unstable_cache as cache } from 'next/cache'
import { createAnonServerClient } from '@/lib/supabase/anon'
import { coursesData, type CourseData } from '@/lib/data/courses' // Fallback only
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

export class UnifiedCourseService {
  private useDatabase = true // Feature flag for gradual migration

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

      if (ce) throw ce
      if (pe) throw pe
      if (be) throw be

      return {
        courses: (courses ?? []) as RawCourse[],
        plans: (plans ?? []) as RawPlan[],
        bundles: (bundles ?? []) as RawBundleItem[],
      }
    },
    ['unified-catalog:all'],
    { tags: ['courses'] }
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
   * Convert raw DB rows to CourseData[] with proper URLs and all required properties
   */
  async getAllCourses(): Promise<CourseData[]> {
    // Feature flag: use static data during migration if needed
    if (!this.useDatabase) {
      console.log('🔄 Using static course data (migration mode)')
      return coursesData
    }

    try {
      const { courses, plans, bundles } = await this.fetchAllRaw()

      // id(uuid) → unique_id map
      const idToUnique: Record<string, string> = {}
      for (const c of courses) idToUnique[c.id] = c.unique_id

      // group plans by course uuid
      const plansByCourseId: Record<string, RawPlan[]> = {}
      for (const p of plans) (plansByCourseId[p.course_id] ??= []).push(p)

      // bundle uuid → child unique_ids[]
      const childrenByBundleId: Record<string, string[]> = {}
      for (const bi of bundles) {
        const childUnique = idToUnique[bi.child_course_id]
        if (!childUnique) continue
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
          url: this.generateCourseUrl(pl.category, pl.enrollment_id), // ✨ Generated URLs
          category: pl.category,
          type: pl.type,
          label: pl.label,
          price: Number(pl.price),
          enrollment_id: pl.enrollment_id,
          stripe_price_id: pl.stripe_price_id,
        })),
      }))
    } catch (error) {
      console.error('❌ Database error, falling back to static data:', error)
      return coursesData // Fallback to static data on error
    }
  }

  /**
   * Get single course by unique_id - optimized for cart/validation operations
   */
  async getCourseByUniqueId(uniqueId: string): Promise<CourseData | null> {
    const allCourses = await this.getAllCourses()
    return allCourses.find(c => c.course.Unique_id === uniqueId) || null
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
    const courseData = await this.findCourseData(courseId)
    return courseData?.plans.some(plan => plan.category === 'bundle') || false
  }

  /**
   * Get bundle contents (replaces static getBundleContents helper)
   */
  async getBundleContents(bundleId: string): Promise<string[]> {
    const courseData = await this.findCourseData(bundleId)
    return courseData?.course.package || []
  }

  /**
   * Get course access URL for enrolled courses
   */
  async getCourseAccessUrl(courseId: string, planLabel: string): Promise<string> {
    const courseData = await this.findCourseData(courseId)
    const plan = courseData?.plans.find(p => p.label === planLabel)
    return plan?.url || '#'
  }

  /**
   * Check if a specific course can be added to cart
   */
  async canAddCourseToCart(
    courseId: string,
    purchasedCourseIds: string[]
  ): Promise<{ canAdd: boolean; reason?: string }> {
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
        url: plan.url || ''
        }

        return {
        isValid: true,
        processedItem
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
  }

  /**
   * Feature flag control - can be used during migration
   */
  setDatabaseMode(enabled: boolean): void {
    this.useDatabase = enabled
    console.log(`🔄 Course service mode: ${enabled ? 'Database' : 'Static'}`)
  }

  /**
   * Health check - validates database connection and data integrity
   */
  async healthCheck(): Promise<{ status: 'ok' | 'error'; message: string; courseCount?: number }> {
    try {
      const courses = await this.getAllCourses()
      
      if (courses.length === 0) {
        return { status: 'error', message: 'No courses found in database' }
      }

      // Basic validation checks
      const hasValidPlans = courses.every(c => c.plans.length > 0)
      const hasValidPrices = courses.every(c => 
        c.plans.every(p => p.stripe_price_id.startsWith('price_'))
      )

      if (!hasValidPlans) {
        return { status: 'error', message: 'Some courses missing plans' }
      }

      if (!hasValidPrices) {
        return { status: 'error', message: 'Some plans have invalid Stripe price IDs' }
      }

      return { 
        status: 'ok', 
        message: 'All systems operational', 
        courseCount: courses.length 
      }
    } catch (error) {
      return { 
        status: 'error', 
        message: `Database error: ${error instanceof Error ? error.message : 'Unknown error'}` 
      }
    }
  }
}

export const unifiedCourseService = new UnifiedCourseService()