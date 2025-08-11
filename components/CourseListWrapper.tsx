// components/CourseListWrapper.tsx
// ============================================
// Wrapper component for course list with loading states

'use client'

import { useEffect, useState } from 'react'
import { CourseCard } from '@/components/CourseCard'
import { CourseCardSkeleton } from '@/components/CourseCardSkeleton'
import { useCartStore } from '@/lib/store/cart-store'
import { useAuth } from '@clerk/nextjs'
import type { CourseWithAccess } from '@/lib/services/user-courses.service'

interface CourseListWrapperProps {
  courses: CourseWithAccess[]
  isAuthenticated: boolean
}

export function CourseListWrapper({ courses, isAuthenticated }: CourseListWrapperProps) {
  const [isLoading, setIsLoading] = useState(true)
  const { isHydrated } = useCartStore()
  const { isLoaded } = useAuth()

  useEffect(() => {
    // Wait for both cart hydration and auth to load
    if (isHydrated && isLoaded) {
      setIsLoading(false)
    }
  }, [isHydrated, isLoaded])

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-fr">
        {[...Array(6)].map((_, index) => (
          <CourseCardSkeleton key={index} />
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-fr">
      {courses.map((course) => (
        <CourseCard 
          key={course.course.Unique_id} 
          course={course}
          isPurchased={course.isPurchased}
          isAuthenticated={isAuthenticated}
        />
      ))}
    </div>
  )
}