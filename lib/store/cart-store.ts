// lib/store/cart-store.ts
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { CourseData } from '../data/courses'

export interface CartItem {
  courseId: string
  courseName: string
  planLabel: string
  price: number
  schoolId: string
  stripePriceId: string | null
}

interface CartStore {
  items: CartItem[]
  addItem: (item: CartItem) => void
  removeItem: (courseId: string, planLabel: string) => void
  clearCart: () => void
  getItemCount: () => number
  getSubtotal: () => number
  isItemInCart: (courseId: string, planLabel: string) => boolean
  canAddToCart: (courseId: string, schoolId: string, bundlePackages?: string[]) => { canAdd: boolean; reason?: string }
  hydrated: boolean
  setHydrated: (state: boolean) => void
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      hydrated: false,
      setHydrated: (state) => set({ hydrated: state }),
      
      addItem: (item) => {
        set((state) => ({
          items: [...state.items, item]
        }))
      },
      
      removeItem: (courseId, planLabel) => {
        set((state) => ({
          items: state.items.filter(
            (item) => !(item.courseId === courseId && item.planLabel === planLabel)
          )
        }))
      },
      
      clearCart: () => set({ items: [] }),
      
      getItemCount: () => get().items.length,
      
      getSubtotal: () => {
        return get().items.reduce((total, item) => total + item.price, 0)
      },
      
      isItemInCart: (courseId, planLabel) => {
        return get().items.some(
          (item) => item.courseId === courseId && item.planLabel === planLabel
        )
      },
      
      canAddToCart: (courseId, schoolId, bundlePackages) => {
        const items = get().items
        
        // Check if this exact item is already in cart
        if (items.some(item => item.schoolId === schoolId)) {
          return { canAdd: false, reason: "This item is already in your cart" }
        }
        
        // Import course data to check bundle packages
        const coursesData = require('@/lib/data/courses').coursesData
        
        // If this is a bundle being added
        if (bundlePackages && bundlePackages.length > 0) {
          // Check if any courses from this bundle are already in cart
          const conflictingCourse = items.find(item => 
            bundlePackages.includes(item.schoolId)
          )
          if (conflictingCourse) {
            return { 
              canAdd: false, 
              reason: `Cannot add bundle: "${conflictingCourse.courseName}" from this bundle is already in your cart` 
            }
          }
        }
        
        // If this is a course being added
        else {
          // Check if this course is part of any bundle already in cart
          const bundlesInCart = items.filter(item => item.courseId.includes('bundle'))
          
          for (const bundleItem of bundlesInCart) {
            // Find the bundle's package info from coursesData
            const bundleData = coursesData.find(
              (data:CourseData)=> data.course.id === bundleItem.courseId && 
                     data.course.category === 'bundle'
            )
            
            if (bundleData?.course.package?.includes(schoolId)) {
              return { 
                canAdd: false, 
                reason: `Cannot add course: It's included in the "${bundleItem.courseName}" already in your cart` 
              }
            }
          }
        }
        
        return { canAdd: true }
      }
    }),
    {
      name: 'cart-storage',
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true)
      },
    }
  )
)