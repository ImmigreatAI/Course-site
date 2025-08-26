// app/courses/eb1a-roadmap/course-detail.tsx
// ============================================
// EB-1A Course Detail Component
// Client component with course information and cart integration

'use client'

import { useEffect } from 'react'
import { courseData, courseContent, relatedCourses } from './course-data'
import { 
  CourseHeader,
  PricingCard,
  CourseIncludes,
  VideoPreview,
  WhatYoullLearn,
  CourseCurriculum,
  CourseAbout,
  RelatedCourses
} from './course-sections'

export default function EB1ACourseDetail() {
  useEffect(() => {
    // Scroll to top on mount
    window.scrollTo(0, 0)
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50/30 via-white to-pink-50/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        
        {/* Breadcrumb */}
        <nav className="mb-4 sm:mb-6 lg:mb-8">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <a href="/courses" className="hover:text-purple-600 transition-colors">Courses</a>
            <span>/</span>
            <span className="text-gray-900 font-medium">EB-1A Green Card Roadmap</span>
          </div>
        </nav>

        {/* Desktop Layout */}
        <div className="hidden lg:grid lg:grid-cols-3 lg:gap-8">
          
          {/* Main Content - Desktop */}
          <div className="lg:col-span-2 space-y-8">
            <CourseHeader course={courseData.course} />
            <VideoPreview />
            <CourseAbout />
            <WhatYoullLearn highlights={courseContent.highlights} />
            <CourseCurriculum curriculum={courseContent.curriculum} />
            
          </div>

          {/* Sidebar - Desktop */}
          <div className="lg:col-span-1">
            <div className="sticky top-8 space-y-6">
              <PricingCard course={courseData.course} plans={courseData.plans} />
              <CourseIncludes includes={courseContent.includes} />
              <RelatedCourses courses={relatedCourses} />
            </div>
          </div>
        </div>

        {/* Mobile/Tablet Layout */}
        <div className="lg:hidden space-y-6">
          {/* 1. Course Header */}
          <CourseHeader course={courseData.course} />
          
          {/* 2. Pricing Card */}
          <PricingCard course={courseData.course} plans={courseData.plans} />
          
          {/* 3. This Course Includes */}
          <CourseIncludes includes={courseContent.includes} />
          
          {/* 4. Video Preview */}
          <VideoPreview />
          
          {/* 5. Course About */}
          <CourseAbout />

          {/* 6. What You'll Learn */}
          <WhatYoullLearn highlights={courseContent.highlights} />
          
          {/* 7. Course Curriculum */}
          <CourseCurriculum curriculum={courseContent.curriculum} />
          
          
          {/* 8. Related Courses */}
          <RelatedCourses courses={relatedCourses} />
        </div>
      </div>
    </div>
  )
}