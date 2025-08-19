// app/course-demo/page.tsx
import { Metadata } from 'next'
import { CourseCatalog } from './CourseDemoComponemts/CourseCatalog'

export const metadata: Metadata = {
  title: 'Courses | immigreat.ai',
  description: 'Browse our comprehensive immigration course library with advanced filtering.',
}

export default function CourseDemoPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50/30 via-white to-pink-50/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Centered Page Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
            Courses
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Explore our comprehensive immigration course library with expert-curated content and advanced filtering options.
          </p>
        </div>

        {/* Course Catalog Component */}
        <CourseCatalog />
      </div>
    </div>
  )
}