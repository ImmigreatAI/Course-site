// components/CourseCard.tsx
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ShoppingCart, Check, Package, BookOpen, Clock, Sparkles } from 'lucide-react'
import { useCartStore } from '@/lib/store/cart-store'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import type { CourseData } from '@/lib/data/courses'

interface CourseCardProps {
  course: CourseData
}

export function CourseCard({ course }: CourseCardProps) {
  const { addItem, items, isHydrated } = useCartStore()
  const [selectedPlan, setSelectedPlan] = useState(course.plans[0])
  const [isLoading, setIsLoading] = useState(false)

  // Check if this course is in cart (any plan)
  const isInCart = items.some(item => item.courseId === course.course.Unique_id)
  
  // Get the specific plan in cart if any
  const cartItem = items.find(item => item.courseId === course.course.Unique_id)
  
  // Check if current course is a bundle
  const isBundle = course.plans.some(plan => plan.category === 'bundle')
  const bundleContents = course.course.package || []

  if (!selectedPlan) {
    return null
  }

  const handleAddToCart = async () => {
    if (!selectedPlan) return
    
    setIsLoading(true)
    
    try {
      const cartItem = {
        courseId: course.course.Unique_id,
        courseName: course.course.name,
        planLabel: selectedPlan.label,
        price: selectedPlan.price,
        enrollmentId: selectedPlan.enrollment_id,
        stripePriceId: selectedPlan.stripe_price_id,
      }

      const result = addItem(cartItem)
      
      if (result.success) {
        toast.success(result.message)
      } else {
        // Show detailed error message for conflicts
        if (result.conflictingItems && result.conflictingItems.length > 0) {
          toast.error(result.message, {
            duration: 6000, // Longer duration for complex messages
          })
        } else {
          toast.error(result.message)
        }
      }
    } catch (error) {
      console.error('Error adding to cart:', error)
      toast.error('Failed to add item to cart')
    } finally {
      setIsLoading(false)
    }
  }

  // Calculate bundle savings (simplified calculation)
  const bundleSavings = isBundle && bundleContents.length > 0 ? bundleContents.length * 50 : 0

  return (
    <div className="group relative h-full">
      {/* Premium gradient background effect */}
      <div className="absolute -inset-0.5 bg-gradient-to-r from-pink-300/30 to-purple-300/30 rounded-3xl blur opacity-0 group-hover:opacity-100 transition duration-500" />
      
      <div className="relative h-full flex flex-col backdrop-blur-xl bg-white/80 border border-purple-200/30 rounded-3xl shadow-xl shadow-purple-100/20 hover:shadow-2xl hover:shadow-purple-200/30 transition-all duration-500 overflow-hidden">
        
        {/* Header Section - Fixed Height */}
        <div className="p-6 pb-4">
          <div className="flex items-start justify-between gap-3 mb-3">
            <h3 className="text-xl font-bold text-gray-900 leading-tight line-clamp-2 min-h-[3.5rem]">
              {course.course.name}
            </h3>
            <div className="flex flex-col gap-2 items-end flex-shrink-0">
              {/* Bundle/Course Badge */}
              {isBundle ? (
                <Badge className="bg-gradient-to-r from-orange-500 to-red-500 text-white border-0 shadow-md">
                  <Package className="w-3 h-3 mr-1" />
                  Bundle
                </Badge>
              ) : (
                <Badge variant="outline" className="bg-white/80 backdrop-blur-sm border-blue-300 text-blue-700">
                  <BookOpen className="w-3 h-3 mr-1" />
                  Course
                </Badge>
              )}
              
              {/* Premium/Free Badge */}
              {selectedPlan.type === 'paid' && (
                <Badge className="bg-black text-white border-0 shadow-md">
                  <Sparkles className="w-3 h-3 mr-1" />
                  Premium
                </Badge>
              )}
              {selectedPlan.type === 'free' && (
                <Badge variant="outline" className="border-green-500 text-green-700 bg-green-50/50">
                  Free
                </Badge>
              )}
            </div>
          </div>
          
          <p className="text-sm text-gray-600 line-clamp-3 min-h-[3.75rem]">
            {course.course.description}
          </p>

          {/* Bundle Info */}
          {isBundle && bundleContents.length > 0 && (
            <div className="mt-3 p-3 bg-orange-50/80 border border-orange-200/50 rounded-xl">
              <p className="text-xs text-orange-800">
                <strong>This bundle includes {bundleContents.length} courses</strong>
                {bundleSavings > 0 && (
                  <span className="block mt-1 font-medium text-green-700">
                    💰 Save ${bundleSavings} vs individual purchase
                  </span>
                )}
              </p>
            </div>
          )}
        </div>
        
        {/* Pricing Options Section - Flexible but contained */}
        <div className="flex-1 px-6 flex flex-col">
          {/* Plan Selection Buttons */}
          {!isBundle && course.plans.length > 1 && (
            <div className="flex gap-2 mb-4">
              {course.plans.map((plan) => (
                <button
                  key={plan.label}
                  onClick={() => setSelectedPlan(plan)}
                  className={cn(
                    "flex-1 py-2.5 px-4 rounded-xl font-medium text-sm transition-all duration-300",
                    selectedPlan?.label === plan.label
                      ? "bg-gradient-to-r from-purple-100 to-pink-100 text-purple-900 shadow-md border border-purple-200/50"
                      : "bg-gray-50/50 text-gray-600 hover:bg-gray-100/70 border border-gray-200/30"
                  )}
                >
                  {plan.label === '6mo' ? '6 Months' : '7 Days'}
                </button>
              ))}
            </div>
          )}
          
          {/* Price Display - Fixed Height */}
          <div className="bg-gradient-to-br from-purple-50/50 to-pink-50/50 rounded-2xl p-4 border border-purple-100/30">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 text-gray-600 mb-1">
                  <Clock className="w-4 h-4" />
                  <span className="text-sm">
                    {selectedPlan.label === '6mo' ? '6 months access' : '7 days access'}
                  </span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold text-gray-900">
                    {selectedPlan.price === 0 ? 'Free' : `$${selectedPlan.price}`}
                  </span>
                  {selectedPlan.label === '7day' && selectedPlan.price > 0 && (
                    <span className="text-sm text-purple-600 font-medium">trial</span>
                  )}
                </div>
              </div>
              {isBundle && bundleSavings > 0 && (
                <div className="text-right">
                  <p className="text-xs text-gray-500">You save</p>
                  <p className="text-lg font-bold text-green-600">
                    ${bundleSavings}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Action Buttons - Fixed at bottom */}
        <div className="p-6 pt-4">
          <div className="flex gap-3">
            <Button
              onClick={handleAddToCart}
              disabled={isLoading || !isHydrated}
              className={cn(
                "flex-1 h-11 rounded-xl font-medium transition-all duration-300",
                isInCart && cartItem?.planLabel === selectedPlan.label
                  ? "bg-green-600 hover:bg-green-700 text-white"
                  : "bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white hover:scale-105"
              )}
            >
              {isLoading ? (
                <div className="flex items-center">
                  <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Adding...
                </div>
              ) : isInCart && cartItem?.planLabel === selectedPlan.label ? (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Added
                </>
              ) : (
                <>
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  Add to Cart
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}