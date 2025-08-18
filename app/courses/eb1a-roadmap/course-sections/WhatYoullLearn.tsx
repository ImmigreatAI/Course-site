// app/courses/eb1a-roadmap/course-sections/WhatYoullLearn.tsx
// ============================================
// What You'll Learn Section Component

import { Card, CardContent } from '@/components/ui/card'
import { Sparkles, CheckCircle } from 'lucide-react'

interface WhatYoullLearnProps {
  highlights: string[]
}

export function WhatYoullLearn({ highlights }: WhatYoullLearnProps) {
  return (
    <Card className="backdrop-blur-xl bg-white/80 border border-purple-200/30 shadow-lg">
      <CardContent className="p-4 sm:p-6 lg:p-8">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6 flex items-center">
          <Sparkles className="w-5 sm:w-6 h-5 sm:h-6 mr-3 text-purple-600" />
          What You&apos;ll Learn
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
          {highlights.map((highlight, index) => (
            <div key={index} className="flex items-start">
              <CheckCircle className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
              <span className="text-gray-700 text-sm sm:text-base">{highlight}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}