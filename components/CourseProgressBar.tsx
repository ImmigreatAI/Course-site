// components/CourseProgressBar.tsx
// ============================================
// Progress bar for course completion

'use client'

import { cn } from '@/lib/utils'

interface CourseProgressBarProps {
  progress: number // 0-100
  className?: string
  showLabel?: boolean
  size?: 'sm' | 'md' | 'lg'
}

export function CourseProgressBar({ 
  progress, 
  className,
  showLabel = true,
  size = 'md'
}: CourseProgressBarProps) {
  const clampedProgress = Math.min(Math.max(progress, 0), 100)
  
  const sizeClasses = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3'
  }

  return (
    <div className={cn('w-full', className)}>
      {showLabel && (
        <div className="flex justify-between items-center mb-1">
          <span className="text-xs text-gray-600">Progress</span>
          <span className="text-xs font-medium text-gray-900">{clampedProgress}%</span>
        </div>
      )}
      <div className={cn(
        'w-full bg-gray-200 rounded-full overflow-hidden',
        sizeClasses[size]
      )}>
        <div 
          className={cn(
            'h-full transition-all duration-500 ease-out',
            clampedProgress === 100 
              ? 'bg-gradient-to-r from-green-500 to-green-600' 
              : 'bg-gradient-to-r from-purple-500 to-pink-500'
          )}
          style={{ width: `${clampedProgress}%` }}
        />
      </div>
      {clampedProgress === 100 && (
        <p className="text-xs text-green-600 mt-1">Course completed! 🎉</p>
      )}
    </div>
  )
}