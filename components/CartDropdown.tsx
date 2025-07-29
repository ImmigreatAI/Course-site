'use client'

import { useEffect, useRef } from 'react'
import { ShoppingCart, Trash2, X } from 'lucide-react'
import { useCartStore } from '@/lib/store/cart-store'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'

interface CartDropdownProps {
  isOpen: boolean
  onClose: () => void
}

export function CartDropdown({ isOpen, onClose }: CartDropdownProps) {
  const router = useRouter()
  const dropdownRef = useRef<HTMLDivElement>(null)
  const { items, removeItem, getSubtotal } = useCartStore()
  const subtotal = getSubtotal()
  
  // Handle clicks outside
  useEffect(() => {
    if (!isOpen) return
    
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node
      
      // Check if click is outside dropdown and not on cart button
      if (dropdownRef.current && !dropdownRef.current.contains(target)) {
        const cartButton = document.querySelector('[data-cart-button]')
        if (!cartButton || !cartButton.contains(target)) {
          onClose()
        }
      }
    }
    
    // Add slight delay to prevent immediate close when opening
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside)
    }, 100)
    
    return () => {
      clearTimeout(timer)
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen, onClose])
  
  // Handle escape key
  useEffect(() => {
    if (!isOpen) return
    
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }
    
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])
  
  if (!isOpen) return null
  
  return (
    <>
      {/* Mobile Overlay - starts below navbar on mobile only */}
      <div 
        className={cn(
          "fixed z-40 lg:hidden",
          "top-20 left-0 right-0 bottom-0", // Starts below navbar
          "bg-black/20 animate-in fade-in-0 duration-200"
        )}
        onClick={onClose}
      />
      
      {/* Cart Dropdown */}
      <div 
        ref={dropdownRef}
        className={cn(
          "fixed z-50",
          "bg-white/95 backdrop-blur-xl border border-purple-200/60 rounded-2xl shadow-2xl shadow-purple-100/50",
          "animate-in slide-in-from-top-2 fade-in-0 zoom-in-95 duration-200",
          // Mobile: Centered with margins
          "top-24 left-4 right-4",
          // Desktop: Fixed width, aligned to right edge
          "lg:left-auto lg:right-4 lg:w-96",
          // Max height with scroll
          "max-h-[calc(100vh-8rem)] overflow-hidden"
        )}
      >
        {/* Cart Header */}
        <div className="p-4 border-b border-purple-100/60 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Shopping Cart</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1 hover:bg-gray-100 rounded-lg"
            aria-label="Close cart"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* Cart Items */}
        <div className="max-h-[50vh] lg:max-h-[400px] overflow-y-auto">
          {items.length === 0 ? (
            <div className="py-16 text-center text-gray-500">
              <ShoppingCart className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p className="text-sm font-medium">Your cart is empty</p>
              <p className="text-xs text-gray-400 mt-1">Add courses to get started</p>
            </div>
          ) : (
            <div className="p-2 space-y-2">
              {items.map((item) => (
                <div 
                  key={`${item.courseId}-${item.planLabel}`}
                  className="flex items-start p-3 rounded-xl hover:bg-purple-50/50 transition-all duration-200 group"
                >
                  <div className="flex-1 min-w-0 mr-2">
                    <p className="font-medium text-sm text-gray-900 line-clamp-2">
                      {item.courseName}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs bg-purple-50/50">
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
                    size="icon"
                    className="h-8 w-8 hover:bg-red-50 text-red-400 hover:text-red-600 flex-shrink-0 transition-all duration-200"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Cart Footer */}
        {items.length > 0 && (
          <div className="p-4 border-t border-purple-100/60 space-y-3 bg-purple-50/30">
            <div className="flex justify-between items-center">
              <span className="font-semibold text-gray-900">Subtotal:</span>
              <span className="text-xl font-bold text-purple-700">
                ${subtotal}
              </span>
            </div>
            <Button
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl py-2.5 transition-all duration-200 hover:scale-[1.02] shadow-lg"
              onClick={() => {
                onClose()
                router.push('/checkout')
              }}
            >
              Checkout
            </Button>
          </div>
        )}
      </div>
    </>
  )
}