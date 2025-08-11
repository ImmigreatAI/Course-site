// components/CourseCardSkeleton.tsx
// ============================================
// Skeleton loader for course cards

'use client'

export function CourseCardSkeleton() {
  return (
    <div className="group relative h-full">
      <div className="h-full backdrop-blur-xl bg-white/80 rounded-2xl shadow-lg border border-purple-200/30 overflow-hidden flex flex-col animate-pulse">
        {/* Card Header */}
        <div className="p-6 flex-1 flex flex-col">
          {/* Title Section */}
          <div className="mb-4">
            <div className="flex items-start justify-between mb-2">
              <div className="h-6 bg-gray-200 rounded-md w-3/4" />
              <div className="h-6 w-16 bg-purple-200 rounded-full ml-2" />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2 mb-4 flex-1">
            <div className="h-4 bg-gray-200 rounded w-full" />
            <div className="h-4 bg-gray-200 rounded w-5/6" />
            <div className="h-4 bg-gray-200 rounded w-4/6" />
          </div>

          {/* Features */}
          <div className="space-y-2 mb-4">
            <div className="flex items-center">
              <div className="w-4 h-4 bg-purple-200 rounded mr-2" />
              <div className="h-4 bg-gray-200 rounded w-24" />
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-purple-200 rounded mr-2" />
              <div className="h-4 bg-gray-200 rounded w-32" />
            </div>
          </div>

          {/* Plan Selection */}
          <div className="mb-4">
            <div className="flex gap-2">
              <div className="flex-1 h-10 bg-purple-100 rounded-lg" />
              <div className="flex-1 h-10 bg-gray-100 rounded-lg" />
            </div>
          </div>
        </div>

        {/* Card Footer */}
        <div className="p-6 pt-0 mt-auto">
          {/* Price Display */}
          <div className="flex items-center justify-between mb-4">
            <div className="h-8 w-20 bg-gray-200 rounded" />
          </div>

          {/* Action Button */}
          <div className="h-11 bg-gradient-to-r from-purple-200 to-pink-200 rounded-xl" />
        </div>
      </div>
    </div>
  )
}