// lib/store/cart-store.ts
// ============================================
// Enhanced with purchase validation and conflict detection

import { create } from 'zustand'
import { persist, subscribeWithSelector } from 'zustand/middleware'
import { coursesData, type CourseData } from '@/lib/data/courses'

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
  purchasedCourseIds: string[] // NEW: Track user's purchased courses
  conflictingItems: CartItem[] // NEW: Items that conflict with purchases
  addItem: (item: CartItem) => { success: boolean; message: string; conflictingItems?: string[] }
  removeItem: (courseId: string) => void
  clearCart: () => void
  getSubtotal: () => number
  getItemCount: () => number
  isHydrated: boolean
  setHydrated: () => void
  setPurchasedCourses: (courseIds: string[]) => void // NEW
  validateCartAgainstPurchases: () => void // NEW
  removeConflictingItems: () => void // NEW
  hasConflicts: () => boolean // NEW
  // Legacy methods for backward compatibility
  isItemInCart: (courseId: string, planLabel?: string) => boolean
  canAddToCart: (courseId: string, enrollmentId: string, packageIds?: string[]) => { canAdd: boolean; reason?: string }
}

// Helper function to find course data by Unique_id
const findCourseData = (uniqueId: string): CourseData | undefined => {
  return coursesData.find(course => course.course.Unique_id === uniqueId)
}

// Helper function to check if item is a bundle
const isBundle = (courseId: string): boolean => {
  const courseData = findCourseData(courseId)
  return courseData?.plans.some(plan => plan.category === 'bundle') || false
}

// Helper function to get bundle contents (course IDs in the package)
const getBundleContents = (bundleId: string): string[] => {
  const courseData = findCourseData(bundleId)
  return courseData?.course.package || []
}

// Helper function to check for conflicts
const checkConflicts = (
  newItem: CartItem, 
  existingItems: CartItem[],
  purchasedCourseIds: string[] = []
): { hasConflict: boolean; conflictingItems: string[]; message: string } => {
  const newCourseData = findCourseData(newItem.courseId)
  if (!newCourseData) {
    return { hasConflict: true, conflictingItems: [], message: 'Course data not found' }
  }

  const conflictingItems: string[] = []
  let conflictMessage = ''

  // NEW: Check if course is already purchased
  if (purchasedCourseIds.includes(newItem.courseId)) {
    return {
      hasConflict: true,
      conflictingItems: [newItem.courseName],
      message: `You already own "${newItem.courseName}". Access it from My Courses.`
    }
  }

  // Check if new item is a bundle
  const newItemIsBundle = isBundle(newItem.courseId)

  if (newItemIsBundle) {
    // New item is a bundle - check if cart contains any courses from this bundle
    const bundleContents = getBundleContents(newItem.courseId)
    
    // Check against cart items
    for (const existingItem of existingItems) {
      if (bundleContents.includes(existingItem.courseId)) {
        conflictingItems.push(existingItem.courseName)
      }
    }

    // NEW: Check against purchased courses
    const purchasedCoursesInBundle = bundleContents.filter(courseId => 
      purchasedCourseIds.includes(courseId)
    )
    
    if (purchasedCoursesInBundle.length > 0) {
      const purchasedNames = purchasedCoursesInBundle
        .map(id => findCourseData(id)?.course.name || 'Unknown Course')
      conflictingItems.push(...purchasedNames)
    }

    if (conflictingItems.length > 0) {
      conflictMessage = `Cannot add "${newItem.courseName}" bundle. You already have these courses: ${conflictingItems.join(', ')}.`
    }
  } else {
    // New item is a course - check if cart contains bundles that include this course
    for (const existingItem of existingItems) {
      if (isBundle(existingItem.courseId)) {
        const existingBundleContents = getBundleContents(existingItem.courseId)
        if (existingBundleContents.includes(newItem.courseId)) {
          conflictingItems.push(existingItem.courseName)
        }
      }
    }

    // NEW: Check if course is part of a purchased bundle
    const purchasedBundles = purchasedCourseIds.filter(id => isBundle(id))
    for (const bundleId of purchasedBundles) {
      const bundleContents = getBundleContents(bundleId)
      if (bundleContents.includes(newItem.courseId)) {
        const bundleName = findCourseData(bundleId)?.course.name || 'a bundle'
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

export const useCartStore = create<CartStore>()(
  persist(
    subscribeWithSelector((set, get) => ({
      items: [],
      purchasedCourseIds: [],
      conflictingItems: [],
      isHydrated: false,

      setHydrated: () => set({ isHydrated: true }),

      setPurchasedCourses: (courseIds: string[]) => {
        set({ purchasedCourseIds: courseIds })
        get().validateCartAgainstPurchases()
      },

      validateCartAgainstPurchases: () => {
        const { items, purchasedCourseIds } = get()
        const conflicts: CartItem[] = []

        for (const item of items) {
          if (purchasedCourseIds.includes(item.courseId)) {
            conflicts.push(item)
            continue
          }
          if (isBundle(item.courseId)) {
            const bundleContents = getBundleContents(item.courseId)
            if (bundleContents.some(id => purchasedCourseIds.includes(id))) {
              conflicts.push(item)
            }
          }
          const purchasedBundles = purchasedCourseIds.filter(id => isBundle(id))
          for (const bundleId of purchasedBundles) {
            const bundleContents = getBundleContents(bundleId)
            if (bundleContents.includes(item.courseId)) {
              conflicts.push(item)
              break
            }
          }
        }

        set({ conflictingItems: conflicts })
      },

      removeConflictingItems: () => {
        const { items, conflictingItems } = get()
        const conflictIds = conflictingItems.map(i => i.courseId)
        set({
          items: items.filter(i => !conflictIds.includes(i.courseId)),
          conflictingItems: []
        })
      },

      hasConflicts: () => get().conflictingItems.length > 0,

      addItem: (item: CartItem) => {
        const { items, purchasedCourseIds } = get()

        const existingItemIndex = items.findIndex(
          i => i.courseId === item.courseId && i.planLabel === item.planLabel
        )
        if (existingItemIndex !== -1) {
          return { success: false, message: 'This item is already in your cart' }
        }

        const differentPlanIndex = items.findIndex(
          i => i.courseId === item.courseId && i.planLabel !== item.planLabel
        )
        if (differentPlanIndex !== -1) {
          const updated = [...items]
          updated[differentPlanIndex] = item
          set({ items: updated })
          return {
            success: true,
            message: `Updated to ${item.planLabel === '6mo' ? '6 Month' : '7 Day'} plan`
          }
        }

        const conflictCheck = checkConflicts(item, items, purchasedCourseIds)
        if (conflictCheck.hasConflict) {
          return {
            success: false,
            message: conflictCheck.message,
            conflictingItems: conflictCheck.conflictingItems
          }
        }

        set({ items: [...items, item] })
        return { success: true, message: 'Added to cart successfully' }
      },

      removeItem: (courseId: string) => {
        set(s => ({ items: s.items.filter(i => i.courseId !== courseId) }))
      },

      clearCart: () => set({ items: [], conflictingItems: [] }),

      getSubtotal: () => get().items.reduce((t, i) => t + i.price, 0),

      getItemCount: () => get().items.length,

      isItemInCart: (courseId: string, planLabel?: string) => {
        const items = get().items
        return planLabel
          ? items.some(i => i.courseId === courseId && i.planLabel === planLabel)
          : items.some(i => i.courseId === courseId)
      },

      canAddToCart: (courseId: string, enrollmentId: string) => {
        const { items, purchasedCourseIds } = get()

        if (purchasedCourseIds.includes(courseId)) {
          return { canAdd: false, reason: 'You already own this course' }
        }
        if (items.some(i => i.courseId === courseId)) {
          return { canAdd: false, reason: 'This course is already in your cart' }
        }

        const mockItem: CartItem = {
          courseId,
          courseName: 'Test',
          planLabel: '6mo',
          price: 0,
          enrollmentId,
          stripePriceId: 'test'
        }

        const conflictCheck = checkConflicts(mockItem, items, purchasedCourseIds)
        if (conflictCheck.hasConflict) {
          return { canAdd: false, reason: conflictCheck.message }
        }
        return { canAdd: true }
      }
    })),
    {
      name: 'cart-store',
      skipHydration: true
    }
  )
)
