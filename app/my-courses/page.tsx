// app/my-courses/page.tsx (SIMPLIFIED)
// ============================================
import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { myCoursesService } from '@/lib/services/my-courses.service'
import { EnrollmentList } from './components/EnrollmentList'
import { PurchaseHistory } from './components/PurchaseHistory'

export default async function MyCoursesPage() {
  // Authenticate user
  const { userId } = await auth()
  
  if (!userId) {
    redirect('/sign-in')
  }

  // Fetch course data
  const courseData = await myCoursesService.getUserCourseData(userId)

  // Handle user not found
  if (!courseData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50/30 via-white to-pink-50/30">
        <div className="max-w-4xl mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            You have no courses enrolled please visit the courses page to explore available courses.
          </h1>
          <p className="text-gray-600">if you have purchased recently , not able to finde it here. Please refresh the page </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50/30 via-white to-pink-50/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Courses</h1>
          <p className="text-gray-600">
            Access your enrolled courses and track your learning progress
          </p>
        </div>

        {/* Enrollments Section */}
        <div className="mb-12">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Your Courses</h2>
          <EnrollmentList enrollments={courseData.enrollments} />
        </div>

        {/* Purchase History Section */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Purchase History</h2>
          <PurchaseHistory purchases={courseData.purchases} />
        </div>
      </div>
    </div>
  )
}
