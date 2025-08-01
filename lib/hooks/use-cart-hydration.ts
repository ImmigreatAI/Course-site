// lib/hooks/use-cart-hydration.ts
import { useEffect, useState } from 'react'
import { useCartStore } from '@/lib/store/cart-store'

export function useCartHydration() {
  const [isHydrated, setIsHydrated] = useState(false)
  const storeHydrated = useCartStore((state) => state.isHydrated)
  const setStoreHydrated = useCartStore((state) => state.setHydrated)

  useEffect(() => {
    // Trigger hydration on mount
    setStoreHydrated()
    setIsHydrated(true)
  }, [setStoreHydrated])

  return storeHydrated && isHydrated
}