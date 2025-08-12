// components/CourseCard.tsx
// ============================================
// FINAL: Uses actual enrollment URL from user's purchase

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ShoppingCart, Check, Package, BookOpen, Clock, Sparkles, CheckCircle } from 'lucide-react'
import { useCartStore } from '@/lib/store/cart-store'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import type { CourseData } from '@/lib/data/courses'

// Enhanced interface to include enrollment data
interface CourseCardProps {
  course: CourseData & {
    isPurchased?: boolean
    activeEnrollment?: boolean
    enrollmentUrl?: string // NEW: Direct access URL from enrollment
    purchasedPlanLabel?: string // NEW: Which plan user actually purchased
  }
  isPurchased?: boolean
  isAuthenticated?: boolean
}

// Helper function to generate course URL (fallback only)
function generateCourseUrl(category: 'course' | 'bundle', enrollmentId: string): string {
  const baseUrl = 'https://courses.getgreencardonyourown.com'
  
  if (category === 'bundle') {
    return `${baseUrl}/program/${enrollmentId}`
  } else {
    return `${baseUrl}/path-player?courseid=${enrollmentId}`
  }
}

export function CourseCard({ course , isPurchased, isAuthenticated = false  }: CourseCardProps) {
  const router = useRouter()
  const { addItem, items, isHydrated, purchasedCourseIds } = useCartStore()
  const [selectedPlan, setSelectedPlan] = useState(course.plans[0])
  const [isLoading, setIsLoading] = useState(false)

  // Check if course is purchased (from props or store)
  const isCoursePurchased =
  Boolean(isPurchased ?? course.isPurchased) ||
  (isAuthenticated && purchasedCourseIds.includes(course.course.Unique_id))
  
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
    
    // Check if already purchased
    if (isCoursePurchased) {
      toast.info('You already own this course. Access it from My Courses.')
      return
    }
    
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

      const result = await addItem(cartItem)
      
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

  // ENHANCED: Use actual enrollment URL from purchase
  const handleAccessCourse = () => {
    // Priority 1: Use enrollment URL from user's actual purchase
    if (course.enrollmentUrl) {
      console.log('Using enrollment URL:', course.enrollmentUrl)
      window.open(course.enrollmentUrl, '_blank')
      return
    }

    // Priority 2: If user purchased a specific plan, use that plan's URL
    if (course.purchasedPlanLabel) {
      const purchasedPlan = course.plans.find(p => p.label === course.purchasedPlanLabel)
      if (purchasedPlan && purchasedPlan.url !== '#') {
        console.log('Using purchased plan URL:', purchasedPlan.url)
        window.open(purchasedPlan.url, '_blank')
        return
      }
    }

    // Priority 3: Fallback to selected plan URL
    if (selectedPlan.url !== '#') {
      console.log('Using selected plan URL:', selectedPlan.url)
      window.open(selectedPlan.url, '_blank')
      return
    }

    // Priority 4: Generate URL as last resort
    const fallbackUrl = generateCourseUrl(selectedPlan.category, selectedPlan.enrollment_id)
    console.log('Using generated URL:', fallbackUrl)
    window.open(fallbackUrl, '_blank')
  }

  // Calculate bundle savings (simplified calculation)
  const bundleSavings = isBundle && bundleContents.length > 0 ?
    Math.round((bundleContents.length * 47 - selectedPlan.price)) : 0

  return (
    <div className="group relative h-full">
      {/* Small owned badge if purchased */}
      {isCoursePurchased && (
        <div className="absolute -top-2 -right-2 z-10">
          <Badge className="bg-green-600 text-white border-green-600 shadow-lg text-xs">
            <CheckCircle className="w-3 h-3 mr-1" />
            Owned
          </Badge>
        </div>
      )}
      
      <div className={cn(
        "h-full backdrop-blur-xl bg-white/80 rounded-2xl shadow-lg",
        "border border-purple-200/30 overflow-hidden",
        "transition-all duration-300 hover:shadow-2xl hover:scale-[1.02]",
        "hover:bg-white/90 flex flex-col"
      )}>
        {/* Card Header */}
        <div className="p-6 flex-1 flex flex-col">
          {/* Title Section */}
          <div className="mb-4">
            <div className="flex items-start justify-between mb-2">
              <h3 className="text-xl font-bold text-gray-900 line-clamp-2 flex-1">
                {course.course.name}
              </h3>
              {isBundle && (
                <Badge className="ml-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white border-0">
                  <Package className="w-3 h-3 mr-1" />
                  Bundle
                </Badge>
              )}
            </div>
            
            {/* Show purchased plan info if owned */}
            {isCoursePurchased && course.purchasedPlanLabel && (
              <div className="mt-2 p-2 bg-green-50 rounded-lg">
                <p className="text-xs font-medium text-green-700">
                  You own: {course.purchasedPlanLabel === '6mo' ? '6 Month Access' : '7 Day Trial'}
                </p>
              </div>
            )}
            
            {/* Bundle Contents */}
            {isBundle && bundleContents.length > 0 && (
              <div className="mt-2 p-3 bg-purple-50 rounded-lg">
                <p className="text-xs font-medium text-purple-700 mb-1">
                  Includes {bundleContents.length} courses:
                </p>
                <p className="text-xs text-purple-600 line-clamp-2">
                  Complete package for your immigration journey
                </p>
              </div>
            )}
          </div>

          {/* Description */}
          <p className="text-sm text-gray-600 mb-4 line-clamp-3 flex-1">
            {course.course.description || 'Comprehensive course designed to guide you through the immigration process'}
          </p>

          {/* Features */}
          <div className="space-y-2 mb-4">
            {course.course && (
              <div className="flex items-center text-sm text-gray-700">
                <BookOpen className="w-4 h-4 mr-2 text-purple-600" />
                <span>Lessons</span>
              </div>
            )}
            {selectedPlan.label && (
              <div className="flex items-center text-sm text-gray-700">
                <Clock className="w-4 h-4 mr-2 text-purple-600" />
                <span>{selectedPlan.label === '6mo' ? '6 Month Access' : '7 Day Trial'}</span>
              </div>
            )}
            {bundleSavings > 0 && (
              <div className="flex items-center text-sm font-medium text-green-600">
                <Sparkles className="w-4 h-4 mr-2" />
                <span>Save ${bundleSavings} with bundle!</span>
              </div>
            )}
          </div>

          {/* Plan Selection - Only show if not purchased and multiple plans */}
          {!isCoursePurchased && course.plans.length > 1 && (
            <div className="mb-4">
              <div className="flex gap-2">
                {course.plans.map((plan) => (
                  <button
                    key={plan.label}
                    onClick={() => setSelectedPlan(plan)}
                    className={cn(
                      "flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all",
                      "border-2",
                      selectedPlan.label === plan.label
                        ? "border-purple-600 bg-purple-50 text-purple-700"
                        : "border-gray-200 hover:border-purple-300 text-gray-600"
                    )}
                  >
                    {plan.label === '6mo' ? '6 Months' : '7 Days'}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Card Footer */}
        <div className="p-6 pt-0 mt-auto">
          {/* Price Display */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <span className="text-2xl font-bold text-gray-900">
                {selectedPlan.price === 0 ? 'Free' : `$${selectedPlan.price}`}
              </span>
              {selectedPlan.label === '7day' && selectedPlan.price > 0 && (
                <span className="text-xs text-gray-500 ml-2">trial</span>
              )}
            </div>
          </div>

          {/* Action Button */}
          {isCoursePurchased ? (
            // Access button for purchased courses - uses enrollment URL
            <Button
              onClick={handleAccessCourse}
              className={cn(
                "w-full rounded-xl py-2.5 font-medium shadow-lg",
                "bg-gradient-to-r from-green-600 to-green-700",
                "hover:from-green-700 hover:to-green-800",
                "text-white transition-all duration-200 hover:scale-[1.02]"
              )}
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Access Course
            </Button>
          ) : isInCart && cartItem?.planLabel === selectedPlan.label ? (
            // In cart state
            <Button
              disabled
              className="w-full rounded-xl py-2.5 font-medium bg-gray-100 text-gray-500 cursor-not-allowed"
            >
              <Check className="w-4 h-4 mr-2" />
              In Cart
            </Button>
          ) : (
            // Add to cart button
            <Button
              onClick={handleAddToCart}
              disabled={isLoading || !isHydrated}
              className={cn(
                "w-full rounded-xl py-2.5 font-medium shadow-lg",
                "bg-gradient-to-r from-purple-600 to-pink-600",
                "hover:from-purple-700 hover:to-pink-700",
                "text-white transition-all duration-200",
                "disabled:opacity-50 disabled:cursor-not-allowed",
                !isLoading && isHydrated && "hover:scale-[1.02]"
              )}
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 mr-2 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Adding...
                </>
              ) : (
                <>
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  Add to Cart
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}