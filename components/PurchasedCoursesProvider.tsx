// components/PurchasedCoursesProvider.tsx
// ============================================
// Client component to provide purchased courses context and sync with cart

'use client'

import { useEffect } from 'react'
import { useCartStore } from '@/lib/store/cart-store'
import { useAuth } from '@clerk/nextjs'

interface PurchasedCoursesProviderProps {
  children: React.ReactNode
  initialPurchasedIds: string[]
  isAuthenticated: boolean
}

export function PurchasedCoursesProvider({ 
  children, 
  initialPurchasedIds,
  isAuthenticated 
}: PurchasedCoursesProviderProps) {
  const { setPurchasedCourses, validateCartAgainstPurchases } = useCartStore()
  const { isLoaded } = useAuth()

  // Always sync purchased courses on auth change — even if empty
  useEffect(() => {
    if (isAuthenticated) {
      // set to the server-provided list (can be empty)
      setPurchasedCourses(initialPurchasedIds)
    } else {
      // clear when signed out
      setPurchasedCourses([])
    }
  }, [isAuthenticated, initialPurchasedIds, setPurchasedCourses])

  // Revalidate cart when auth state or purchased list is ready/changes
  useEffect(() => {
    if (isLoaded) {
      validateCartAgainstPurchases()
    }
  }, [isLoaded, initialPurchasedIds, isAuthenticated, validateCartAgainstPurchases])

  return <>{children}</>
}
