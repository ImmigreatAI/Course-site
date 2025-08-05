// lib/store/cart-store.ts
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
  addItem: (item: CartItem) => { success: boolean; message: string; conflictingItems?: string[] }
  removeItem: (courseId: string) => void
  clearCart: () => void
  getSubtotal: () => number
  getItemCount: () => number
  isHydrated: boolean
  setHydrated: () => void
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
const checkConflicts = (newItem: CartItem, existingItems: CartItem[]): { hasConflict: boolean; conflictingItems: string[]; message: string } => {
  const newCourseData = findCourseData(newItem.courseId)
  if (!newCourseData) {
    return { hasConflict: true, conflictingItems: [], message: 'Course data not found' }
  }

  const conflictingItems: string[] = []
  let conflictMessage = ''

  // Check if new item is a bundle
  const newItemIsBundle = isBundle(newItem.courseId)

  if (newItemIsBundle) {
    // New item is a bundle - check if cart contains any courses from this bundle
    const bundleContents = getBundleContents(newItem.courseId)
    
    for (const existingItem of existingItems) {
      if (bundleContents.includes(existingItem.courseId)) {
        conflictingItems.push(existingItem.courseName)
      }
    }

    if (conflictingItems.length > 0) {
      conflictMessage = `Cannot add "${newItem.courseName}" bundle because your cart already contains individual courses from this bundle: ${conflictingItems.join(', ')}. Please remove these courses first.`
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

    if (conflictingItems.length > 0) {
      conflictMessage = `Cannot add "${newItem.courseName}" because your cart already contains bundles that include this course: ${conflictingItems.join(', ')}. Please remove these bundles first.`
    }
  }

  return {
    hasConflict: conflictingItems.length > 0,
    conflictingItems,
    message: conflictMessage
  }
}

export const useCartStore = create<CartStore>()(
  subscribeWithSelector(
    persist(
      (set, get) => ({
        items: [],
        isHydrated: false,

        setHydrated: () => {
          set({ isHydrated: true })
        },

        addItem: (newItem: CartItem) => {
          const currentItems = get().items

          // Check if exact same item (same course + plan) already exists
          const existingItemIndex = currentItems.findIndex(
            item => item.courseId === newItem.courseId && item.planLabel === newItem.planLabel
          )

          if (existingItemIndex !== -1) {
            return {
              success: false,
              message: `${newItem.courseName} (${newItem.planLabel} plan) is already in your cart`
            }
          }

          // Check if same course with different plan exists
          const sameCourseIndex = currentItems.findIndex(
            item => item.courseId === newItem.courseId
          )

          // Check for bundle/course conflicts
          const conflictCheck = checkConflicts(newItem, currentItems)
          if (conflictCheck.hasConflict) {
            return {
              success: false,
              message: conflictCheck.message,
              conflictingItems: conflictCheck.conflictingItems
            }
          }

          if (sameCourseIndex !== -1) {
            // Replace existing item with new plan
            const updatedItems = [...currentItems]
            updatedItems[sameCourseIndex] = newItem
            
            set({ items: updatedItems })
            return {
              success: true,
              message: `Updated ${newItem.courseName} to ${newItem.planLabel} plan`
            }
          } else {
            // Add new item
            set({ items: [...currentItems, newItem] })
            return {
              success: true,
              message: `${newItem.courseName} (${newItem.planLabel} plan) added to cart`
            }
          }
        },

        removeItem: (courseId: string) => {
          set(state => ({
            items: state.items.filter(item => item.courseId !== courseId)
          }))
        },

        clearCart: () => {
          set({ items: [] })
        },

        getSubtotal: () => {
          return get().items.reduce((total, item) => total + item.price, 0)
        },

        getItemCount: () => {
          return get().items.length
        },

        // Legacy methods for backward compatibility
        isItemInCart: (courseId: string, planLabel?: string) => {
          const items = get().items
          if (planLabel) {
            return items.some(item => 
              item.courseId === courseId && item.planLabel === planLabel
            )
          } else {
            return items.some(item => item.courseId === courseId)
          }
        },

        canAddToCart: (courseId: string, enrollmentId: string) => {
          const items = get().items
          
          // Check if this course is already in cart (any plan)
          if (items.some(item => item.courseId === courseId)) {
            return { canAdd: false, reason: 'This course is already in your cart' }
          }
          
          // Use the new conflict detection system
          const mockItem: CartItem = {
            courseId,
            courseName: 'Test',
            planLabel: '6mo',
            price: 0,
            enrollmentId,
            stripePriceId: 'test'
          }
          
          const conflictCheck = checkConflicts(mockItem, items)
          if (conflictCheck.hasConflict) {
            return { canAdd: false, reason: conflictCheck.message }
          }
          
          return { canAdd: true }
        }
      }),
      {
        name: 'cart-store',
        skipHydration: true,
      }
    )
  )
)