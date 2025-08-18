// app/courses/eb1a-roadmap/course-sections/CourseHeader.tsx
// ============================================
// Course Header Section Component

import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Star, Clock, Users, Globe } from 'lucide-react'
import { Course } from '../types'

interface CourseHeaderProps {
  course: Course
}

export function CourseHeader({ course }: CourseHeaderProps) {
  return (
    <div className="relative">
      <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-300/30 to-pink-300/30 rounded-3xl blur opacity-75" />
      <Card className="relative backdrop-blur-xl bg-white/80 border border-purple-200/30 shadow-2xl shadow-purple-100/20">
        <CardContent className="p-4 sm:p-6 lg:p-8">
          <div className="flex items-start justify-between mb-4 sm:mb-6">
            <div className="flex-1">
              <div className="flex flex-col sm:flex-row sm:items-center mb-3 gap-2">
                <Badge className="bg-gradient-to-r from-purple-600 to-pink-600 text-white w-fit">
                  EB-1A Course
                </Badge>
                <div className="flex items-center">
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
                    ))}
                  </div>
                  <span className="ml-2 text-sm text-gray-600">(4.9) • 1,247 students</span>
                </div>
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-3 sm:mb-4 leading-tight">
                {course.name}
              </h1>
              <p className="text-base sm:text-lg text-gray-600 leading-relaxed">
                {course.description}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-sm text-gray-600">
            <div className="flex items-center">
              <Clock className="w-4 h-4 mr-2" />
              12+ hours content
            </div>
            <div className="flex items-center">
              <Users className="w-4 h-4 mr-2" />
              1,247 students
            </div>
            <div className="flex items-center">
              <Globe className="w-4 h-4 mr-2" />
              English
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}