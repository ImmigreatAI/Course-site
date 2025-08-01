// components/CartIcon.tsx
'use client'

import { useEffect } from 'react'
import { ShoppingCart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useCartStore } from '@/lib/store/cart-store'

interface CartIconProps {
  onClick: () => void
}

export function CartIcon({ onClick }: CartIconProps) {
  const { isHydrated, setHydrated, getItemCount } = useCartStore()
  const itemCount = getItemCount()
  
  // Handle hydration
  useEffect(() => {
    setHydrated()
  }, [setHydrated])
  
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    onClick()
  }
  
  return (
    <Button
      variant="ghost"
      size="icon"
      className="relative text-gray-600 hover:text-gray-900 hover:bg-purple-50/50 rounded-full w-9 h-9 sm:w-10 sm:h-10 transition-all duration-200 hover:scale-110"
      onClick={handleClick}
      data-cart-button
    >
      <ShoppingCart className="h-4 w-4 sm:h-5 sm:w-5" />
      {isHydrated && itemCount > 0 && (
        <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-purple-600 text-white text-xs">
          {itemCount}
        </Badge>
      )}
    </Button>
  )
}