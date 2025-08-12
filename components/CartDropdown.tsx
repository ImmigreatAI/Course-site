// components/CartDropdown.tsx
'use client'

import { useEffect, useRef, useState } from 'react'
import { ShoppingCart, Trash2, X, Loader2, AlertCircle, Package, BookOpen, CheckCircle } from 'lucide-react'
import { useCartStore } from '@/lib/store/cart-store'
import { unifiedCourseService } from '@/lib/services/unified-course.service'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useUser } from '@clerk/nextjs'
import { getStripe } from '@/lib/stripe/config'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface CartDropdownProps {
  isOpen: boolean
  onClose: () => void
}

interface CheckoutResponse {
  sessionId?: string
  url?: string | null
  enrollmentIds?: string[]
  message?: string
  error?: string
}

export function CartDropdown({ isOpen, onClose }: CartDropdownProps) {
  const { isSignedIn, isLoaded } = useUser()
  const dropdownRef = useRef<HTMLDivElement>(null)

  const { 
    items, 
    removeItem, 
    getSubtotal,
    // Conflict-aware bits from the cart store
    purchasedCourseIds,
    conflictingItems,
    hasConflicts,
  } = useCartStore()

  const subtotal = getSubtotal()
  const [isLoading, setIsLoading] = useState(false)
  const [bundleCache, setBundleCache] = useState<Map<string, boolean>>(new Map())
  const [courseCache, setCourseCache] = useState<Map<string, any>>(new Map())

  // Load course data on mount and when items change
  useEffect(() => {
    const loadCourseData = async () => {
      try {
        const allCourses = await unifiedCourseService.getAllCourses()
        const newCourseCache = new Map()
        const newBundleCache = new Map()
        
        allCourses.forEach(course => {
          newCourseCache.set(course.course.Unique_id, course)
          const isBundle = course.plans.some((plan: any) => plan.category === 'bundle')
          newBundleCache.set(course.course.Unique_id, isBundle)
        })
        
        setCourseCache(newCourseCache)
        setBundleCache(newBundleCache)
      } catch (error) {
        console.error('❌ Failed to load course data:', error)
      }
    }

    loadCourseData()
  }, [])

  // Helper: is this item a bundle (with caching for performance)
  const isItemBundle = (courseId: string): boolean => {
    // Check cache first
    if (bundleCache.has(courseId)) {
      return bundleCache.get(courseId) || false
    }

    // Check course cache
    const courseData = courseCache.get(courseId)
    
    if (courseData) {
      const isBundle = courseData.plans.some((plan: any) => plan.category === 'bundle')
      setBundleCache(prev => new Map(prev).set(courseId, isBundle))
      return isBundle
    }

    // Fallback: assume it's a course if we don't have data
    console.log('⚠️ Course data not found in cache for:', courseId)
    return false
  }

  // Helper: is this item already owned
  const isItemConflicting = (courseId: string) => purchasedCourseIds.includes(courseId)

  // Clicks outside → close
  useEffect(() => {
    if (!isOpen) return

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node
      if (dropdownRef.current && !dropdownRef.current.contains(target)) {
        const cartButton = document.querySelector('[data-cart-button]')
        if (!cartButton || !cartButton.contains(target)) {
          onClose()
        }
      }
    }

    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside)
    }, 100)

    return () => {
      clearTimeout(timer)
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen, onClose])

  // Escape key → close
  useEffect(() => {
    if (!isOpen) return
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  const handleCheckout = async () => {
    // Guard: wait for auth to load
    if (!isLoaded) {
      toast.error('Please wait while we load your account information')
      return
    }

    // Guard: must sign in
    if (!isSignedIn) {
      toast.error('Please sign in to continue with checkout')
      onClose()
      return
    }

    // Guard: non-empty cart
    if (items.length === 0) {
      toast.error('Your cart is empty')
      return
    }

    // Guard: conflicts (already owned items)
    if (hasConflicts()) {
      toast.error('Remove owned items from your cart before checkout')
      return
    }

    setIsLoading(true)

    try {
      console.log('🛒 Starting checkout process:', {
        itemCount: items.length,
        total: subtotal,
        items: items.map(i => ({ courseId: i.courseId, plan: i.planLabel, price: i.price }))
      })

      // Send checkout request to API
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error('❌ Checkout API error:', {
          status: response.status,
          statusText: response.statusText,
          error: errorData
        })
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`)
      }

      const data: CheckoutResponse = await response.json()
      
      if (!data.sessionId) {
        console.error('❌ No session ID returned from checkout API')
        throw new Error('No checkout session created')
      }

      console.log('✅ Checkout session created:', {
        sessionId: data.sessionId,
        enrollmentIds: data.enrollmentIds?.length || 0
      })

      // Initialize Stripe
      const stripe = await getStripe()
      if (!stripe) {
        console.error('❌ Stripe not available')
        throw new Error('Payment system unavailable. Please try again.')
      }

      // Close cart before redirect
      onClose()

      // Show loading state
      const loadingMessage = subtotal === 0 ? 'Processing free enrollment...' : 'Redirecting to payment...'
      toast.loading(loadingMessage, { duration: 3000 })

      console.log('🔄 Redirecting to Stripe checkout...')

      // Redirect to Stripe
      const { error } = await stripe.redirectToCheckout({ sessionId: data.sessionId })
      
      if (error) {
        console.error('❌ Stripe redirect error:', error)
        toast.error(error.message || 'Payment redirect failed')
      }
    } catch (error) {
      console.error('❌ Checkout error:', error)
      
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred during checkout'
      toast.error(errorMessage)
      
      // Additional network error handling
      if (errorMessage.toLowerCase().includes('network') || errorMessage.toLowerCase().includes('fetch')) {
        toast.error('Network error. Please check your connection and try again.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleRemoveItem = (courseId: string) => {
    try {
      console.log('🗑️ Removing item from cart:', courseId)
      removeItem(courseId)
      toast.success('Item removed from cart')
      
      // Clear bundle cache for this item
      setBundleCache(prev => {
        const newCache = new Map(prev)
        newCache.delete(courseId)
        return newCache
      })
      
      // Clear course cache for this item
      setCourseCache(prev => {
        const newCache = new Map(prev)
        newCache.delete(courseId)
        return newCache
      })
    } catch (error) {
      console.error('❌ Error removing item:', error)
      toast.error('Failed to remove item')
    }
  }

  if (!isOpen) return null

  const hasConflictsInCart = hasConflicts()
  const isCheckoutDisabled = isLoading || !isLoaded || !isSignedIn || items.length === 0 || hasConflictsInCart

  return (
    <>
      {/* Mobile overlay (below fixed navbar) */}
      <div 
        className={cn(
          "fixed z-40 lg:hidden",
          "top-20 left-0 right-0 bottom-0",
          "bg-black/20 animate-in fade-in-0 duration-200"
        )}
        onClick={onClose}
      />

      {/* Cart dropdown panel */}
      <div
        ref={dropdownRef}
        className={cn(
          "fixed z-50",
          "bg-white/95 backdrop-blur-xl border border-purple-200/60 rounded-2xl shadow-2xl shadow-purple-100/50",
          "animate-in slide-in-from-top-2 fade-in-0 zoom-in-95 duration-200",
          "top-24 left-4 right-4",                 // mobile
          "lg:left-auto lg:right-4 lg:w-96",       // desktop
          "max-h-[calc(100vh-8rem)] overflow-hidden"
        )}
      >
        {/* Header */}
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

        {/* Items */}
        <div className="max-h-[50vh] lg:max-h-[400px] overflow-y-auto">
          {items.length === 0 ? (
            <div className="py-16 text-center text-gray-500">
              <ShoppingCart className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p className="text-sm font-medium">Your cart is empty</p>
              <p className="text-xs text-gray-400 mt-1">Add courses to get started</p>
            </div>
          ) : (
            <div className="p-2 space-y-2">
              {items.map((item) => {
                const isBundleItem = isItemBundle(item.courseId)
                const owned = isItemConflicting(item.courseId)

                return (
                  <div
                    key={`${item.courseId}-${item.planLabel}`}
                    className={cn(
                      "flex items-start p-3 rounded-xl hover:bg-purple-50/50 transition-all duration-200 group",
                      owned && "bg-amber-50/60"
                    )}
                  >
                    <div className="flex-1 min-w-0 mr-2">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium text-sm text-gray-900 line-clamp-2">
                          {item.courseName}
                        </p>
                        {/* Bundle/Course indicator */}
                        {isBundleItem ? (
                          <Badge className="bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs">
                            <Package className="w-3 h-3 mr-1" />
                            Bundle
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-white/80 backdrop-blur-sm border-blue-300 text-blue-700 text-xs">
                            <BookOpen className="w-3 h-3 mr-1" />
                            Course
                          </Badge>
                        )}
                        {/* Owned indicator */}
                        {owned && (
                          <Badge className="bg-amber-600 text-white text-xs">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Already Owned
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs bg-purple-50/50">
                          {item.planLabel === '6mo' ? '6 months' : '7 days'}
                        </Badge>
                        <span className="text-sm font-semibold text-purple-700">
                          {item.price === 0 ? 'Free' : `$${item.price}`}
                        </span>
                      </div>
                    </div>
                    <Button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleRemoveItem(item.courseId)
                      }}
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 hover:bg-red-50 text-red-400 hover:text-red-600 flex-shrink-0 transition-all duration-200"
                      disabled={isLoading}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="p-4 border-t border-purple-100/60 space-y-3 bg-purple-50/30">
            {/* Conflict warning */}
            {hasConflictsInCart && (
              <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl">
                <AlertCircle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-xs font-medium text-amber-800">
                    Remove owned items to checkout
                  </p>
                  <p className="text-xs text-amber-700 mt-1">
                    You already own {conflictingItems.length} item{conflictingItems.length > 1 ? 's' : ''} in your cart.
                  </p>
                </div>
              </div>
            )}

            {/* Auth warning (only if no conflicts) */}
            {!isSignedIn && isLoaded && !hasConflictsInCart && (
              <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl">
                <AlertCircle className="h-4 w-4 text-amber-600 flex-shrink-0" />
                <p className="text-xs text-amber-800">
                  Please sign in to complete your purchase
                </p>
              </div>
            )}

            {/* Free course notice (only if no conflicts) */}
            {subtotal === 0 && !hasConflictsInCart && (
              <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-xl">
                <AlertCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                <p className="text-xs text-green-800">
                  Free courses still require checkout for enrollment
                </p>
              </div>
            )}

            <div className="flex justify-between items-center">
              <span className="font-semibold text-gray-900">Total:</span>
              <span className="text-xl font-bold text-purple-700">
                {subtotal === 0 ? 'Free' : `$${subtotal}`}
              </span>
            </div>

            <Button
              className={cn(
                "w-full rounded-xl py-2.5 font-medium shadow-lg transition-all duration-200",
                hasConflictsInCart
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white",
                "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100",
                !isCheckoutDisabled && "hover:scale-[1.02]"
              )}
              onClick={handleCheckout}
              disabled={isCheckoutDisabled}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : hasConflictsInCart ? (
                <>
                  <AlertCircle className="w-4 h-4 mr-2" />
                  Remove Owned Items First
                </>
              ) : (
                <>
                  {subtotal === 0 ? 'Enroll for Free' : 'Proceed to Checkout'}
                  {!isLoaded && ' (Loading...)'}
                </>
              )}
            </Button>
          </div>
        )}
      </div>
    </>
  )
}