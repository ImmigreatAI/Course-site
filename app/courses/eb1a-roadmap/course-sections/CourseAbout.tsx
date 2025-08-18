// app/courses/eb1a-roadmap/course-sections/CourseAbout.tsx
// ============================================
// Course About Section Component

import { Card, CardContent } from '@/components/ui/card'
import { FileText, CheckCircle } from 'lucide-react'

export function CourseAbout() {
  return (
    <Card className="backdrop-blur-xl bg-white/80 border border-purple-200/30 shadow-lg">
      <CardContent className="p-4 sm:p-6 lg:p-8">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6 flex items-center">
          <FileText className="w-5 sm:w-6 h-5 sm:h-6 mr-3 text-purple-600" />
          About This Course
        </h2>
        <div className="prose prose-gray max-w-none">
          <p className="text-gray-700 leading-relaxed mb-4 text-sm sm:text-base">
            The EB-1A Green Card Roadmap is a comprehensive course designed for professionals who want to secure their green card through the extraordinary ability category. This course provides step-by-step guidance through the entire process, from understanding eligibility criteria to filing your petition.
          </p>
          <p className="text-gray-700 leading-relaxed mb-4 text-sm sm:text-base">
            Our expert instructors have helped hundreds of professionals successfully obtain their EB-1A green cards. You&apos;ll learn proven strategies for evidence collection, document preparation, and petition filing that maximize your chances of approval.
          </p>
          <p className="text-gray-700 leading-relaxed mb-4 text-sm sm:text-base">
            Whether you&apos;re a researcher, artist, business professional, or athlete, this course will provide you with the knowledge and tools you need to navigate the EB-1A process confidently and successfully.
          </p>
          
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mt-6 mb-3">Who This Course Is For:</h3>
          <ul className="space-y-2 text-gray-700">
            <li className="flex items-start">
              <CheckCircle className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
              <span className="text-sm sm:text-base">Researchers and academics with published work</span>
            </li>
            <li className="flex items-start">
              <CheckCircle className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
              <span className="text-sm sm:text-base">Business professionals with leadership roles</span>
            </li>
            <li className="flex items-start">
              <CheckCircle className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
              <span className="text-sm sm:text-base">Artists and performers with recognition</span>
            </li>
            <li className="flex items-start">
              <CheckCircle className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
              <span className="text-sm sm:text-base">Athletes with competitive achievements</span>
            </li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}