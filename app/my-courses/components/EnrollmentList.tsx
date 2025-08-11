// app/my-courses/components/EnrollmentList.tsx
// ============================================
'use client'

import { EnrollmentCard } from './EnrollmentCard'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { BookOpen } from 'lucide-react'
import { myCoursesService } from '@/lib/services/my-courses.service'
import type { Enrollment } from '@/lib/types/enrollment.types'

interface EnrollmentListProps {
  enrollments: Enrollment[]
}

export function EnrollmentList({ enrollments }: EnrollmentListProps) {
  // Group enrollments by status
  const groups = myCoursesService.groupEnrollmentsByStatus(enrollments)

  // Empty state
  if (enrollments.length === 0) {
    return (
      <Card className="backdrop-blur-xl bg-white/80 border-purple-200/30">
        <div className="p-12 text-center">
          <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600 mb-4">
            You haven&apos;t enrolled in any courses yet
          </p>
          <Button asChild>
            <a href="/courses">Browse Courses</a>
          </Button>
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-8">
      {/* Active Enrollments */}
      {groups.active.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Active Courses
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {groups.active.map((enrollment) => (
              <EnrollmentCard key={enrollment.id} enrollment={enrollment} />
            ))}
          </div>
        </div>
      )}

      {/* Pending Enrollments */}
      {groups.pending.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Processing Enrollments
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {groups.pending.map((enrollment) => (
              <EnrollmentCard key={enrollment.id} enrollment={enrollment} />
            ))}
          </div>
        </div>
      )}

      {/* Expired Enrollments */}
      {groups.expired.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-500 mb-4">
            Expired Courses
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 opacity-60">
            {groups.expired.map((enrollment) => (
              <EnrollmentCard key={enrollment.id} enrollment={enrollment} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
