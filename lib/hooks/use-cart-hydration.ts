// lib/hooks/use-cart-hydration.ts
import { useEffect, useState } from 'react'
import { useCartStore } from '@/lib/store/cart-store'

export function useCartHydration() {
  const [isHydrated, setIsHydrated] = useState(false)

  useEffect(() => {
    // Manually trigger hydration only on client side
    useCartStore.persist.rehydrate()
    setIsHydrated(true)
  }, [])

  return isHydrated
}