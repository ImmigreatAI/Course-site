'use client'

import { useEffect, useState } from 'react'
import { CourseCard } from './CourseCard'
import { CourseData } from '@/lib/data/courses'

interface ClientCourseCardProps {
  courseGroup: CourseData[]
}

export function ClientCourseCard({ courseGroup }: ClientCourseCardProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    // Return a skeleton loader that matches the card structure
    return (
      <div className="group relative h-full">
        <div className="relative h-full flex flex-col backdrop-blur-xl bg-white/80 border border-purple-200/30 rounded-3xl shadow-xl shadow-purple-100/20 overflow-hidden">
          <div className="p-6 pb-4">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="h-7 bg-gray-200 rounded-lg animate-pulse flex-1" />
              <div className="h-6 w-20 bg-gray-200 rounded-lg animate-pulse" />
            </div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded animate-pulse" />
              <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4" />
            </div>
          </div>
          <div className="flex-1 px-6">
            <div className="h-24 bg-gray-100 rounded-2xl animate-pulse" />
          </div>
          <div className="p-6 pt-4 mt-auto">
            <div className="flex gap-3">
              <div className="h-11 bg-gray-200 rounded-xl animate-pulse flex-1" />
              <div className="h-11 bg-gray-200 rounded-xl animate-pulse flex-1" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  return <CourseCard courseGroup={courseGroup} />
}