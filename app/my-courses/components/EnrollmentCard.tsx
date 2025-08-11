// app/my-courses/components/EnrollmentCard.tsx
// ============================================
'use client'

import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Clock, ExternalLink, BookOpen, Loader2 } from 'lucide-react'
import { myCoursesService } from '@/lib/services/my-courses.service'
import type { Enrollment } from '@/lib/types/enrollment.types'

interface EnrollmentCardProps {
  enrollment: Enrollment
}

export function EnrollmentCard({ enrollment }: EnrollmentCardProps) {
  const daysUntilExpiry = myCoursesService.getDaysUntilExpiry(enrollment.expires_at)
  const isExpiringSoon = daysUntilExpiry !== null && daysUntilExpiry <= 7
  const expiryMessage = myCoursesService.formatExpiryMessage(daysUntilExpiry)
  const planLabel = myCoursesService.formatPlanLabel(enrollment.plan_label)

  // Status badge component
  const StatusBadge = () => {
    switch (enrollment.status) {
      case 'pending':
        return (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300">
            <Loader2 className="w-3 h-3 mr-1 animate-spin" />
            Processing
          </Badge>
        )
      case 'active':
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
            Active
          </Badge>
        )
      case 'expired':
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-300">
            Expired
          </Badge>
        )
      default:
        return null
    }
  }

  // Access button component
  const AccessButton = () => {
    if (enrollment.status === 'active') {
      return (
        <Button
          asChild
          className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
        >
          <a href={enrollment.course_url} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="w-4 h-4 mr-2" />
            Access Course
          </a>
        </Button>
      )
    }

    if (enrollment.status === 'pending') {
      return (
        <Button disabled className="w-full bg-gray-100 text-gray-400 cursor-not-allowed">
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          Processing Enrollment...
        </Button>
      )
    }

    return (
      <Button disabled className="w-full bg-gray-100 text-gray-400 cursor-not-allowed">
        Course Expired
      </Button>
    )
  }

  return (
    <Card className="backdrop-blur-xl bg-white/80 border-purple-200/30 hover:shadow-xl transition-all duration-300 group">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 line-clamp-2 flex-1">
            {enrollment.course_name}
          </h3>
          <div className="ml-2">
            <StatusBadge />
          </div>
        </div>
        
        {/* Details */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center text-sm text-gray-600">
            <Clock className="w-4 h-4 mr-2" />
            <span>
              Enrolled: {enrollment.enrolled_at 
                ? new Date(enrollment.enrolled_at).toLocaleDateString() 
                : 'Processing...'}
            </span>
          </div>
          
          {enrollment.expires_at && (
            <div className={`flex items-center text-sm ${
              isExpiringSoon ? 'text-orange-600 font-medium' : 'text-gray-600'
            }`}>
              <Clock className="w-4 h-4 mr-2" />
              <span>{expiryMessage}</span>
            </div>
          )}
          
          <div className="flex items-center text-sm text-gray-600">
            <BookOpen className="w-4 h-4 mr-2" />
            <span className="capitalize">{planLabel}</span>
          </div>
        </div>
        
        {/* Action Button */}
        <AccessButton />
      </div>
    </Card>
  )
}
