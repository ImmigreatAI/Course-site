'use client'

import { ShoppingCart, X } from 'lucide-react'
import { useCartStore } from '@/lib/store/cart-store'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

export function CartDropdown() {
  const { items, removeItem, getItemCount, getSubtotal } = useCartStore()
  const itemCount = getItemCount()
  const subtotal = getSubtotal()
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="relative h-10 w-10 rounded-full hover:bg-purple-100/50"
        >
          <ShoppingCart className="h-5 w-5 text-gray-700" />
          {itemCount > 0 && (
            <Badge
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-purple-600"
            >
              {itemCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent
        align="end"
        className={cn(
          "w-80 max-h-[500px] overflow-y-auto",
          "backdrop-blur-md bg-white/90 border-purple-100"
        )}
      >
        <DropdownMenuLabel className="text-lg font-semibold">
          Shopping Cart
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {items.length === 0 ? (
          <div className="py-8 text-center text-gray-500">
            Your cart is empty
          </div>
        ) : (
          <>
            <div className="space-y-2 py-2">
              {items.map((item) => (
                <DropdownMenuItem
                  key={`${item.courseId}-${item.planLabel}`}
                  className="flex items-start justify-between p-3 cursor-default focus:bg-purple-50/50"
                >
                  <div className="flex-1 mr-2">
                    <p className="font-medium text-sm line-clamp-2">
                      {item.courseName}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">
                        {item.planLabel === '6mo' ? '6 months' : '7 days'}
                      </Badge>
                      <span className="text-sm font-semibold text-purple-700">
                        ${item.price}
                      </span>
                    </div>
                  </div>
                  <Button
                    onClick={(e) => {
                      e.stopPropagation()
                      removeItem(item.courseId, item.planLabel)
                    }}
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 hover:bg-red-100"
                  >
                    <X className="h-4 w-4 text-red-500" />
                  </Button>
                </DropdownMenuItem>
              ))}
            </div>
            
            <DropdownMenuSeparator />
            
            <div className="p-4 space-y-3">
              <div className="flex justify-between items-center">
                <span className="font-semibold">Subtotal:</span>
                <span className="text-xl font-bold text-purple-700">
                  ${subtotal}
                </span>
              </div>
              
              <Button
                className="w-full bg-purple-600 hover:bg-purple-700"
                onClick={() => {
                  // TODO: Navigate to checkout
                  console.log('Navigate to checkout')
                }}
              >
                Checkout
              </Button>
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}