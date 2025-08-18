// app/courses/eb1a-roadmap/course-sections/PricingCard.tsx
// ============================================
// Pricing Card Component

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ShoppingCart, Check, CheckCircle } from 'lucide-react'
import { useCartStore } from '@/lib/store/cart-store'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { CoursePlan, Course } from '../types'

interface PricingCardProps {
  course: Course
  plans: CoursePlan[]
}

export function PricingCard({ course, plans }: PricingCardProps) {
  const { addItem, items, isHydrated, purchasedCourseIds } = useCartStore()
  const [selectedPlan, setSelectedPlan] = useState(plans[0])
  const [isLoading, setIsLoading] = useState(false)

  // Check if course is already purchased or in cart
  const isCoursePurchased = purchasedCourseIds.includes(course.Unique_id)
  const isInCart = items.some(item => item.courseId === course.Unique_id)
  const cartItem = items.find(item => item.courseId === course.Unique_id)

  const handleAddToCart = async () => {
    if (!selectedPlan) return
    
    if (isCoursePurchased) {
      toast.info('You already own this course. Access it from My Courses.')
      return
    }
    
    setIsLoading(true)
    
    try {
      const cartItem = {
        courseId: course.Unique_id,
        courseName: course.name,
        planLabel: selectedPlan.label,
        price: selectedPlan.price,
        enrollmentId: selectedPlan.enrollment_id,
        stripePriceId: selectedPlan.stripe_price_id,
      }

      const result = await addItem(cartItem)
      
      if (result.success) {
        toast.success(result.message)
      } else {
        toast.error(result.message, {
          duration: 6000,
        })
      }
    } catch (error) {
      console.error('Error adding to cart:', error)
      toast.error('Failed to add item to cart')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="backdrop-blur-xl bg-white/80 border border-purple-200/30 shadow-lg">
      <CardContent className="p-4 sm:p-6">
        
        {/* Plan Selection */}
        <div className="mb-4 sm:mb-6">
          <h3 className="font-semibold text-gray-900 mb-3">Choose Your Plan</h3>
          <div className="space-y-2">
            {plans.map((plan) => (
              <button
                key={plan.label}
                onClick={() => setSelectedPlan(plan)}
                className={cn(
                  "w-full p-3 rounded-lg border text-left transition-all duration-200",
                  selectedPlan.label === plan.label
                    ? "border-purple-600 bg-purple-50 text-purple-700"
                    : "border-gray-200 hover:border-purple-300 text-gray-600"
                )}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">
                      {plan.label === '6mo' ? '6 Months Access' : '7 Days Trial'}
                    </div>
                    {plan.label === '7day' && (
                      <div className="text-xs text-gray-500">Perfect for evaluation</div>
                    )}
                  </div>
                  <div className="text-lg font-bold">
                    ${plan.price}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Price Display */}
        <div className="text-center mb-4 sm:mb-6">
          <div className="text-2xl sm:text-3xl font-bold text-gray-900">
            ${selectedPlan.price}
          </div>
          {selectedPlan.label === '7day' && (
            <div className="text-sm text-gray-500">7-day access</div>
          )}
        </div>

        {/* Add to Cart Button */}
        {isCoursePurchased ? (
          <Button
            className={cn(
              "w-full rounded-xl py-3 font-medium shadow-lg",
              "bg-gradient-to-r from-green-600 to-green-700",
              "hover:from-green-700 hover:to-green-800",
              "text-white transition-all duration-200"
            )}
          >
            <CheckCircle className="w-5 h-5 mr-2" />
            Access Course
          </Button>
        ) : isInCart && cartItem?.planLabel === selectedPlan.label ? (
          <Button
            disabled
            className="w-full rounded-xl py-3 font-medium bg-gray-100 text-gray-500 cursor-not-allowed"
          >
            <Check className="w-5 h-5 mr-2" />
            In Cart
          </Button>
        ) : (
          <Button
            onClick={handleAddToCart}
            disabled={isLoading || !isHydrated}
            className={cn(
              "w-full rounded-xl py-3 font-medium shadow-lg",
              "bg-gradient-to-r from-purple-600 to-pink-600",
              "hover:from-purple-700 hover:to-pink-700",
              "text-white transition-all duration-200",
              "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
          >
            {isLoading ? (
              <>
                <div className="w-5 h-5 mr-2 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Adding...
              </>
            ) : (
              <>
                <ShoppingCart className="w-5 h-5 mr-2" />
                Add to Cart
              </>
            )}
          </Button>
        )}
      </CardContent>
    </Card>
  )
}