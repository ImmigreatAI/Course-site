// lib/store/cart-store.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface CartItem {
  courseId: string
  courseName: string
  planLabel: string
  price: number
  enrollmentId: string
  stripePriceId: string // Made non-nullable
}

interface CartStore {
  items: CartItem[]
  addItem: (item: CartItem) => void
  removeItem: (courseId: string) => void
  clearCart: () => void
  getSubtotal: () => number
  isItemInCart: (courseId: string, planLabel?: string) => boolean
  canAddToCart: (courseId: string, enrollmentId: string, packageIds?: string[]) => { canAdd: boolean; reason?: string }
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      
      addItem: (item) => {
        set((state) => {
          // Remove any existing item with same courseId (different plan)
          const filteredItems = state.items.filter(
            existingItem => existingItem.courseId !== item.courseId
          )
          
          return {
            items: [...filteredItems, item]
          }
        })
      },
      
      removeItem: (courseId) => {
        set((state) => ({
          items: state.items.filter(item => item.courseId !== courseId)
        }))
      },
      
      clearCart: () => {
        set({ items: [] })
      },
      
      getSubtotal: () => {
        return get().items.reduce((total, item) => total + item.price, 0)
      },
      
      isItemInCart: (courseId, planLabel) => {
        const items = get().items
        if (planLabel) {
          // Check for specific plan
          return items.some(item => 
            item.courseId === courseId && item.planLabel === planLabel
          )
        } else {
          // Check for any plan of this course
          return items.some(item => item.courseId === courseId)
        }
      },
      
      canAddToCart: (courseId, enrollmentId, packageIds = []) => {
        const items = get().items
        
        // Check if this course is already in cart (any plan)
        if (items.some(item => item.courseId === courseId)) {
          return { canAdd: false, reason: 'This course is already in your cart' }
        }
        
        // Check for bundle conflicts
        if (packageIds && packageIds.length > 0) {
          // This is a bundle - check if any individual courses are in cart
          const hasConflictingCourse = items.some(item => 
            packageIds.includes(item.enrollmentId)
          )
          if (hasConflictingCourse) {
            return { canAdd: false, reason: 'Remove individual courses to add this bundle' }
          }
        } else {
          // This is an individual course - check if any bundle contains it
          const hasConflictingBundle = items.some(item => {
            // This would need to be determined from your course data
            // For now, we'll skip this check as it requires more complex logic
            return false
          })
          if (hasConflictingBundle) {
            return { canAdd: false, reason: 'This course is included in a bundle already in your cart' }
          }
        }
        
        return { canAdd: true }
      }
    }),
    {
      name: 'cart-storage',
      skipHydration: true,
    }
  )
)