'use client'

import { useState } from 'react'
import { ShoppingCart, CreditCard, Package, Clock, Sparkles } from 'lucide-react'
import { useCartStore } from '@/lib/store/cart-store'
import { CourseData } from '@/lib/data/courses'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface CourseCardProps {
  courseGroup: CourseData[]
}

export function CourseCard({ courseGroup }: CourseCardProps) {
  const [alert, setAlert] = useState<string | null>(null)
  const [selectedPlan, setSelectedPlan] = useState<string>('6mo')
  const { addItem, isItemInCart, canAddToCart } = useCartStore()
  
  // Get the first item to extract course info
  const courseInfo = courseGroup[0].course
  const isBundle = courseInfo.category === 'bundle'
  
  // Get the currently selected plan data
  const currentPlan = isBundle 
    ? courseGroup[0] 
    : courseGroup.find(item => item.plan.label === selectedPlan) || courseGroup[0]
  
  const handleAddToCart = (item: CourseData) => {
    const { canAdd, reason } = canAddToCart(
      item.course.id,
      item.plan.school_id,
      item.course.package
    )
    
    if (!canAdd) {
      setAlert(reason || 'Cannot add this item to cart')
      setTimeout(() => setAlert(null), 3000)
      return
    }
    
    addItem({
      courseId: item.course.id,
      courseName: item.course.name,
      planLabel: item.plan.label,
      price: item.plan.price,
      schoolId: item.plan.school_id,
      stripePriceId: item.stripe_price_id,
    })
    
    setAlert('Added to cart successfully!')
    setTimeout(() => setAlert(null), 2000)
  }
  
  const handleBuyNow = (item: CourseData) => {
    handleAddToCart(item)
    // TODO: Redirect to checkout
  }
  
  return (
    <div className="group relative h-full">
      {/* Premium gradient background effect */}
      <div className="absolute -inset-0.5 bg-gradient-to-r from-pink-300/30 to-purple-300/30 rounded-3xl blur opacity-0 group-hover:opacity-100 transition duration-500" />
      
      <div className="relative h-full flex flex-col backdrop-blur-xl bg-white/80 border border-purple-200/30 rounded-3xl shadow-xl shadow-purple-100/20 hover:shadow-2xl hover:shadow-purple-200/30 transition-all duration-500 overflow-hidden">
        
        {/* Alert Toast */}
        {alert && (
          <div className={cn(
            "absolute top-4 left-4 right-4 z-20 p-3 rounded-xl backdrop-blur-md transition-all duration-300",
            alert.includes('Cannot') 
              ? "bg-red-50/90 border border-red-200/50 text-red-700" 
              : "bg-green-50/90 border border-green-200/50 text-green-700"
          )}>
            <p className="text-sm font-medium">{alert}</p>
          </div>
        )}
        
        {/* Header Section */}
        <div className="p-6 pb-4">
          <div className="flex items-start justify-between gap-3 mb-3">
            <h3 className="text-xl font-bold text-gray-900 leading-tight flex-1">
              {courseInfo.name}
            </h3>
            <div className="flex flex-col gap-2 items-end">
              {isBundle && (
                <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0 shadow-md">
                  <Package className="w-3 h-3 mr-1" />
                  Bundle
                </Badge>
              )}
              {courseInfo.type === 'paid' && (
                <Badge className="bg-black text-white border-0 shadow-md">
                  <Sparkles className="w-3 h-3 mr-1" />
                  Premium
                </Badge>
              )}
              {courseInfo.type === 'free' && (
                <Badge variant="outline" className="border-green-500 text-green-700 bg-green-50/50">
                  Free
                </Badge>
              )}
            </div>
          </div>
          
          <p className="text-sm text-gray-600 line-clamp-2 min-h-[2.5rem]">
            {courseInfo.description}
          </p>
        </div>
        
        {/* Pricing Options - Fixed height section */}
        <div className="flex-1 px-6">
          {!isBundle && courseGroup.length > 1 && (
            <div className="flex gap-2 mb-4">
              {courseGroup.map((item) => (
                <button
                  key={item.plan.label}
                  onClick={() => setSelectedPlan(item.plan.label)}
                  className={cn(
                    "flex-1 py-2.5 px-4 rounded-xl font-medium text-sm transition-all duration-300",
                    selectedPlan === item.plan.label
                      ? "bg-gradient-to-r from-purple-100 to-pink-100 text-purple-900 shadow-md border border-purple-200/50"
                      : "bg-gray-50/50 text-gray-600 hover:bg-gray-100/70 border border-gray-200/30"
                  )}
                >
                  {item.plan.label === '6mo' ? '6 Months' : '7 Days'}
                </button>
              ))}
            </div>
          )}
          
          {/* Price Display */}
          <div className="bg-gradient-to-br from-purple-50/50 to-pink-50/50 rounded-2xl p-4 border border-purple-100/30">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 text-gray-600 mb-1">
                  <Clock className="w-4 h-4" />
                  <span className="text-sm">
                    {currentPlan.plan.label === '6mo' ? '6 months access' : '7 days access'}
                  </span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold text-gray-900">
                    {currentPlan.plan.price === 0 ? 'Free' : `${currentPlan.plan.price}`}
                  </span>
                  {currentPlan.plan.label === '7day' && currentPlan.plan.price > 0 && (
                    <span className="text-sm text-purple-600 font-medium">trial</span>
                  )}
                </div>
              </div>
              {isBundle && (
                <div className="text-right">
                  <p className="text-xs text-gray-500">You save</p>
                  <p className="text-lg font-bold text-green-600">
                    ${(199 * 2) - currentPlan.plan.price}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Action Buttons - Fixed at bottom */}
        <div className="p-6 pt-4 mt-auto">
          <div className="flex gap-3">
            <Button
              onClick={() => handleAddToCart(currentPlan)}
              disabled={isItemInCart(currentPlan.course.id, currentPlan.plan.label)}
              variant="outline"
              className={cn(
                "flex-1 h-11 rounded-xl font-medium transition-all duration-300",
                isItemInCart(currentPlan.course.id, currentPlan.plan.label)
                  ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                  : "border-purple-300 text-purple-700 hover:bg-purple-50 hover:border-purple-400 hover:scale-105"
              )}
            >
              <ShoppingCart className="w-4 h-4 mr-2" />
              {isItemInCart(currentPlan.course.id, currentPlan.plan.label) ? 'Added' : 'Add to Cart'}
            </Button>
            <Button
              onClick={() => handleBuyNow(currentPlan)}
              className="flex-1 h-11 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
            >
              <CreditCard className="w-4 h-4 mr-2" />
              {currentPlan.plan.price === 0 ? 'Enroll Free' : 'Buy Now'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}