// lib/store/cart-store.ts
// ============================================
// FIXED: Now uses client-safe course service instead of server-only unified service

import { create } from 'zustand'
import { persist, subscribeWithSelector } from 'zustand/middleware'
import { clientCourseService } from '@/lib/services/client-course.service' // CHANGED: Use client service
import type { CourseData } from '@/lib/data/courses'

export interface CartItem {
  courseId: string // Unique_id from course data
  courseName: string
  planLabel: string // "6mo" or "7day"
  price: number
  enrollmentId: string
  stripePriceId: string
}

interface CartStore {
  items: CartItem[]
  purchasedCourseIds: string[]
  conflictingItems: CartItem[]
  courseCache: CourseData[] // Cached course data from API
  isCacheLoaded: boolean // Track cache status
  
  // Core cart operations
  addItem: (item: CartItem) => Promise<{ success: boolean; message: string; conflictingItems?: string[] }>
  removeItem: (courseId: string) => void
  clearCart: () => void
  getSubtotal: () => number
  getItemCount: () => number
  
  // Hydration and state management
  isHydrated: boolean
  setHydrated: () => void
  
  // Purchase validation
  setPurchasedCourses: (courseIds: string[]) => void
  validateCartAgainstPurchases: () => Promise<void>
  removeConflictingItems: () => void
  hasConflicts: () => boolean
  
  // Cache management
  loadCourseCache: () => Promise<void>
  refreshCache: () => Promise<void>
  
  // Legacy methods for backward compatibility
  isItemInCart: (courseId: string, planLabel?: string) => boolean
  canAddToCart: (courseId: string, enrollmentId: string) => Promise<{ canAdd: boolean; reason?: string }>
}

// ============================================
// HELPER FUNCTIONS - Now use cached course data
// ============================================

const findCourseDataInCache = (uniqueId: string, cache: CourseData[]): CourseData | undefined => {
  return cache.find(course => course.course.Unique_id === uniqueId)
}

const isBundleFromCache = (courseId: string, cache: CourseData[]): boolean => {
  const courseData = findCourseDataInCache(courseId, cache)
  return courseData?.plans.some(plan => plan.category === 'bundle') || false
}

const getBundleContentsFromCache = (bundleId: string, cache: CourseData[]): string[] => {
  const courseData = findCourseDataInCache(bundleId, cache)
  return courseData?.course.package || []
}

// Enhanced conflict checker with better error handling
const checkConflictsWithCache = (
  newItem: CartItem, 
  existingItems: CartItem[],
  purchasedCourseIds: string[],
  courseCache: CourseData[]
): { hasConflict: boolean; conflictingItems: string[]; message: string } => {
  // Ensure cache is available
  if (courseCache.length === 0) {
    console.warn('⚠️ Course cache not loaded, conflict checking may be incomplete')
    return { hasConflict: false, conflictingItems: [], message: '' }
  }

  const newCourseData = findCourseDataInCache(newItem.courseId, courseCache)
  if (!newCourseData) {
    return { 
      hasConflict: true, 
      conflictingItems: [], 
      message: `Course "${newItem.courseName}" not found in catalog` 
    }
  }

  const conflictingItems: string[] = []
  let conflictMessage = ''

  // Check if course is already purchased
  if (purchasedCourseIds.includes(newItem.courseId)) {
    return {
      hasConflict: true,
      conflictingItems: [newItem.courseName],
      message: `You already own "${newItem.courseName}". Access it from My Courses.`
    }
  }

  const newItemIsBundle = isBundleFromCache(newItem.courseId, courseCache)

  if (newItemIsBundle) {
    // New item is a bundle - check for conflicts with existing courses
    const bundleContents = getBundleContentsFromCache(newItem.courseId, courseCache)
    
    // Check against cart items
    for (const existingItem of existingItems) {
      if (bundleContents.includes(existingItem.courseId)) {
        conflictingItems.push(existingItem.courseName)
      }
    }

    // Check against purchased courses
    const purchasedCoursesInBundle = bundleContents.filter(courseId => 
      purchasedCourseIds.includes(courseId)
    )
    
    if (purchasedCoursesInBundle.length > 0) {
      const purchasedNames = purchasedCoursesInBundle
        .map(id => findCourseDataInCache(id, courseCache)?.course.name || 'Unknown Course')
      conflictingItems.push(...purchasedNames)
    }

    if (conflictingItems.length > 0) {
      conflictMessage = `Cannot add "${newItem.courseName}" bundle. You already have these courses: ${conflictingItems.join(', ')}.`
    }
  } else {
    // New item is a course - check if it conflicts with bundles
    for (const existingItem of existingItems) {
      if (isBundleFromCache(existingItem.courseId, courseCache)) {
        const existingBundleContents = getBundleContentsFromCache(existingItem.courseId, courseCache)
        if (existingBundleContents.includes(newItem.courseId)) {
          conflictingItems.push(existingItem.courseName)
        }
      }
    }

    // Check if course is part of a purchased bundle
    const purchasedBundles = purchasedCourseIds.filter(id => isBundleFromCache(id, courseCache))
    for (const bundleId of purchasedBundles) {
      const bundleContents = getBundleContentsFromCache(bundleId, courseCache)
      if (bundleContents.includes(newItem.courseId)) {
        const bundleName = findCourseDataInCache(bundleId, courseCache)?.course.name || 'a bundle'
        conflictingItems.push(bundleName)
      }
    }

    if (conflictingItems.length > 0) {
      conflictMessage = `Cannot add "${newItem.courseName}". You already have bundles containing this course: ${conflictingItems.join(', ')}.`
    }
  }

  return {
    hasConflict: conflictingItems.length > 0,
    conflictingItems,
    message: conflictMessage
  }
}

// ============================================
// ZUSTAND STORE IMPLEMENTATION
// ============================================

export const useCartStore = create<CartStore>()(
  persist(
    subscribeWithSelector((set, get) => ({
      items: [],
      purchasedCourseIds: [],
      conflictingItems: [],
      courseCache: [],
      isCacheLoaded: false,
      isHydrated: false,

      setHydrated: () => {
        set({ isHydrated: true })
        // Auto-load cache when store hydrates
        get().loadCourseCache()
      },

      // ============================================
      // CACHE MANAGEMENT - FIXED: Uses client service
      // ============================================
      
      loadCourseCache: async () => {
        try {
          console.log('🔄 Loading course cache from API...')
          const courses = await clientCourseService.getAllCourses() // CHANGED: Use client service
          set({ 
            courseCache: courses, 
            isCacheLoaded: true 
          })
          console.log(`✅ Course cache loaded: ${courses.length} courses`)
          
          // Re-validate cart after cache loads
          await get().validateCartAgainstPurchases()
        } catch (error) {
          console.error('❌ Failed to load course cache:', error)
          // Fallback: try to load cache again after a delay
          setTimeout(() => get().loadCourseCache(), 2000)
        }
      },

      refreshCache: async () => {
        set({ isCacheLoaded: false })
        await get().loadCourseCache()
      },

      // ============================================
      // PURCHASE VALIDATION
      // ============================================

      setPurchasedCourses: (courseIds: string[]) => {
        set({ purchasedCourseIds: courseIds })
        get().validateCartAgainstPurchases()
      },

      validateCartAgainstPurchases: async () => {
        const { items, purchasedCourseIds, courseCache, isCacheLoaded } = get()
        
        // Ensure cache is loaded
        if (!isCacheLoaded) {
          await get().loadCourseCache()
          return
        }

        const conflicts: CartItem[] = []

        for (const item of items) {
          // Direct ownership check
          if (purchasedCourseIds.includes(item.courseId)) {
            conflicts.push(item)
            continue
          }

          // Bundle conflict checks
          if (isBundleFromCache(item.courseId, courseCache)) {
            const bundleContents = getBundleContentsFromCache(item.courseId, courseCache)
            if (bundleContents.some(id => purchasedCourseIds.includes(id))) {
              conflicts.push(item)
            }
          }

          // Check if item is part of purchased bundles
          const purchasedBundles = purchasedCourseIds.filter(id => isBundleFromCache(id, courseCache))
          for (const bundleId of purchasedBundles) {
            const bundleContents = getBundleContentsFromCache(bundleId, courseCache)
            if (bundleContents.includes(item.courseId)) {
              conflicts.push(item)
              break
            }
          }
        }

        set({ conflictingItems: conflicts })
      },

      removeConflictingItems: () => {
        const { conflictingItems } = get()
        set(state => ({
          items: state.items.filter(item => 
            !conflictingItems.some(conflict => 
              conflict.courseId === item.courseId && 
              conflict.planLabel === item.planLabel
            )
          ),
          conflictingItems: []
        }))
      },

      hasConflicts: () => {
        return get().conflictingItems.length > 0
      },

      // ============================================
      // CART OPERATIONS
      // ============================================

      addItem: async (item: CartItem) => {
        const { items, purchasedCourseIds, courseCache, isCacheLoaded } = get()

        // Ensure cache is loaded
        if (!isCacheLoaded) {
          await get().loadCourseCache()
        }

        // Check for conflicts
        const conflictCheck = checkConflictsWithCache(item, items, purchasedCourseIds, courseCache)
        if (conflictCheck.hasConflict) {
          return {
            success: false,
            message: conflictCheck.message,
            conflictingItems: conflictCheck.conflictingItems
          }
        }

        // Check if exact item already exists
        const existingItem = items.find(i => 
          i.courseId === item.courseId && i.planLabel === item.planLabel
        )
        
        if (existingItem) {
          return {
            success: false,
            message: `"${item.courseName}" (${item.planLabel}) is already in your cart.`
          }
        }

        // Add item
        set(state => ({
          items: [...state.items, item]
        }))

        return {
          success: true,
          message: `"${item.courseName}" added to cart`
        }
      },

      removeItem: (courseId: string) => {
        set(state => ({
          items: state.items.filter(item => item.courseId !== courseId)
        }))
      },

      clearCart: () => {
        set({ items: [], conflictingItems: [] })
      },

      getSubtotal: () => {
        return get().items.reduce((total, item) => total + item.price, 0)
      },

      getItemCount: () => {
        return get().items.length
      },

      // ============================================
      // LEGACY METHODS
      // ============================================

      isItemInCart: (courseId: string, planLabel?: string) => {
        const items = get().items
        return planLabel
          ? items.some(i => i.courseId === courseId && i.planLabel === planLabel)
          : items.some(i => i.courseId === courseId)
      },

      canAddToCart: async (courseId: string, enrollmentId: string) => {
        const { items, purchasedCourseIds, courseCache, isCacheLoaded } = get()

        // Ensure cache is loaded
        if (!isCacheLoaded) {
          await get().loadCourseCache()
        }

        // Basic checks
        if (purchasedCourseIds.includes(courseId)) {
          return { canAdd: false, reason: 'You already own this course' }
        }
        if (items.some(i => i.courseId === courseId)) {
          return { canAdd: false, reason: 'This course is already in your cart' }
        }

        // Create mock item for conflict testing
        const mockItem: CartItem = {
          courseId,
          courseName: 'Test Course',
          planLabel: '6mo',
          price: 0,
          enrollmentId,
          stripePriceId: 'test'
        }

        // Run conflict detection
        const conflictCheck = checkConflictsWithCache(mockItem, items, purchasedCourseIds, courseCache)
        if (conflictCheck.hasConflict) {
          return { canAdd: false, reason: conflictCheck.message }
        }

        return { canAdd: true }
      }
    })),
    {
      name: 'cart-store',
      skipHydration: true,
      // Only persist essential data, not the cache
      partialize: (state) => ({
        items: state.items,
        purchasedCourseIds: state.purchasedCourseIds,
        conflictingItems: state.conflictingItems,
        isHydrated: state.isHydrated
      })
    }
  )
)