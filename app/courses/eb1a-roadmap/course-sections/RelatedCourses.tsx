// app/courses/eb1a-roadmap/course-sections/RelatedCourses.tsx
// ============================================
// Related Courses Section Component

import { Card, CardContent } from '@/components/ui/card'
import { Star } from 'lucide-react'
import { RelatedCourse } from '../types'

interface RelatedCoursesProps {
  courses: RelatedCourse[]
}

export function RelatedCourses({ courses }: RelatedCoursesProps) {
  return (
    <Card className="backdrop-blur-xl bg-white/80 border border-purple-200/30 shadow-lg">
      <CardContent className="p-4 sm:p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Related Courses</h3>
        <div className="space-y-4">
          {courses.map((course, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-3 sm:p-4 hover:border-purple-300 transition-colors cursor-pointer">
              <h4 className="font-medium text-gray-900 mb-2 text-sm sm:text-base">{course.title}</h4>
              <p className="text-xs sm:text-sm text-gray-600 mb-3">{course.description}</p>
              <div className="flex items-center justify-between">
                <div className="flex items-center text-xs sm:text-sm text-gray-500">
                  <Star className="w-3 h-3 text-yellow-400 fill-current mr-1" />
                  <span>{course.rating}</span>
                  <span className="mx-1">•</span>
                  <span>{course.students} students</span>
                </div>
                <span className="font-semibold text-purple-600 text-sm sm:text-base">${course.price}</span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}