// components/CourseAccessIndicator.tsx
// ============================================
// Visual indicator for course access status

'use client'

import { Badge } from '@/components/ui/badge'
import { CheckCircle, Lock, Clock, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

type AccessStatus = 'owned' | 'available' | 'locked' | 'expiring' | 'expired'

interface CourseAccessIndicatorProps {
  status: AccessStatus
  expiresIn?: number // days until expiry
  className?: string
}

export function CourseAccessIndicator({ 
  status, 
  expiresIn,
  className 
}: CourseAccessIndicatorProps) {
  const getIndicatorContent = () => {
    switch (status) {
      case 'owned':
        return {
          icon: CheckCircle,
          text: 'Owned',
          className: 'bg-green-100 text-green-700 border-green-200'
        }
      case 'available':
        return {
          icon: CheckCircle,
          text: 'Available',
          className: 'bg-blue-100 text-blue-700 border-blue-200'
        }
      case 'locked':
        return {
          icon: Lock,
          text: 'Purchase Required',
          className: 'bg-gray-100 text-gray-700 border-gray-200'
        }
      case 'expiring':
        return {
          icon: Clock,
          text: expiresIn ? `Expires in ${expiresIn} days` : 'Expiring Soon',
          className: 'bg-amber-100 text-amber-700 border-amber-200'
        }
      case 'expired':
        return {
          icon: AlertCircle,
          text: 'Expired',
          className: 'bg-red-100 text-red-700 border-red-200'
        }
      default:
        return {
          icon: AlertCircle,
          text: 'Unknown',
          className: 'bg-gray-100 text-gray-700 border-gray-200'
        }
    }
  }

  const { icon: Icon, text, className: badgeClassName } = getIndicatorContent()

  return (
    <Badge 
      variant="outline" 
      className={cn(badgeClassName, 'flex items-center gap-1', className)}
    >
      <Icon className="w-3 h-3" />
      <span>{text}</span>
    </Badge>
  )
}