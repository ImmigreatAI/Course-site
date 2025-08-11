// lib/hooks/use-user-purchases.ts
// ============================================
// Hook to fetch and manage user purchases

'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@clerk/nextjs'
import { useCartStore } from '@/lib/store/cart-store'
import { toast } from 'sonner'

export function useUserPurchases() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { isSignedIn, isLoaded } = useAuth()
  const { setPurchasedCourses, purchasedCourseIds } = useCartStore()

  const fetchPurchases = async () => {
    if (!isSignedIn) {
      setPurchasedCourses([])
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/user/purchases')
      
      if (!response.ok) {
        throw new Error('Failed to fetch purchases')
      }

      const data = await response.json()
      setPurchasedCourses(data.purchasedCourseIds || [])
      
    } catch (err) {
      console.error('Error fetching purchases:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch purchases')
      // Don't show toast for every error, just log it
    } finally {
      setIsLoading(false)
    }
  }

  // Fetch purchases when auth state changes
  useEffect(() => {
    if (isLoaded) {
      fetchPurchases()
    }
  }, [isSignedIn, isLoaded])

  return {
    purchasedCourseIds,
    isLoading,
    error,
    refetch: fetchPurchases
  }
}