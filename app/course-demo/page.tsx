// app/course-demo/page.tsx
import { Metadata } from 'next'
import { CourseCatalog } from '@/components/CourseDemo/CourseCatalog'

export const metadata: Metadata = {
  title: 'Course Demo | immigreat.ai',
  description: 'Preview of our comprehensive immigration course catalog and filtering system.',
}

export default function CourseDemoPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50/30 via-white to-pink-50/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Page Header */}
        <div className="text-center mb-12">
          <div className="relative">
            <div className="absolute -inset-2 bg-gradient-to-r from-purple-300/20 to-pink-300/20 rounded-2xl blur-xl opacity-75" />
            <div className="relative backdrop-blur-xl bg-white/80 border border-purple-200/30 rounded-2xl p-8 shadow-lg">
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                Course
                <span className="block bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  Catalog Demo
                </span>
              </h1>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Explore our comprehensive immigration course library with advanced filtering and series organization.
              </p>
            </div>
          </div>
        </div>

        {/* Course Catalog Component */}
        <CourseCatalog />
      </div>
    </div>
  )
}