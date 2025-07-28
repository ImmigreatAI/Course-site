'use client'

import { ShoppingCart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useCartStore } from '@/lib/store/cart-store'
import { useCartHydration } from '@/lib/hooks/use-cart-hydration'

interface CartIconProps {
  onClick: () => void
}

export function CartIcon({ onClick }: CartIconProps) {
  const isHydrated = useCartHydration()
  const itemCount = useCartStore((state) => state.items.length)
  
  return (
    <Button
      variant="ghost"
      size="icon"
      className="relative text-gray-600 hover:text-gray-900 hover:bg-purple-50/50 rounded-full w-9 h-9 sm:w-10 sm:h-10 transition-all duration-200 hover:scale-110"
      onClick={onClick}
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