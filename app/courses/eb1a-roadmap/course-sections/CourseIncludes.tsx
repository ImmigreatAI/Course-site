// app/courses/eb1a-roadmap/course-sections/CourseIncludes.tsx
// ============================================
// Course Includes Section Component

import { Card, CardContent } from '@/components/ui/card'
import { CourseInclude } from '../types'

interface CourseIncludesProps {
  includes: CourseInclude[]
}

export function CourseIncludes({ includes }: CourseIncludesProps) {
  return (
    <Card className="backdrop-blur-xl bg-white/80 border border-purple-200/30 shadow-lg">
      <CardContent className="p-4 sm:p-6">
        <h3 className="font-semibold text-gray-900 mb-4">This Course Includes</h3>
        <div className="space-y-3">
          {includes.map((item, index) => (
            <div key={index} className="flex items-center">
              <item.icon className="w-5 h-5 text-purple-600 mr-3 flex-shrink-0" />
              <span className="text-sm text-gray-700">{item.text}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}