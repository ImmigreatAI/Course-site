// app/courses/page.tsx
// ============================================
// Enhanced with server-side purchase validation

import { auth } from '@clerk/nextjs/server'
import { CourseCard } from '@/components/CourseCard'
import { getAllCourses } from '@/lib/data/courses'
import { userCoursesService } from '@/lib/services/user-courses.service'
import { PurchasedCoursesProvider } from '@/components/PurchasedCoursesProvider'


export default async function CoursesPage() {
  // Check authentication
  const { userId } = await auth()
  
  // Get courses with access status
  const coursesWithAccess = await userCoursesService.getCoursesWithAccessStatus(userId)
  
  // Get purchased course IDs for client-side state
  const purchasedCourseIds = userId 
    ? await userCoursesService.getUserPurchasedCourseIds(userId)
    : []
  
  return (
    <PurchasedCoursesProvider 
      initialPurchasedIds={purchasedCourseIds}
      isAuthenticated={!!userId}
    >
      <div className="min-h-screen bg-gradient-to-br from-purple-50/30 via-white to-pink-50/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Our Courses
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Choose from our comprehensive selection of immigration courses designed to guide you through your green card journey
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-fr">
            {coursesWithAccess.map((course) => (
              <CourseCard 
                key={course.course.Unique_id} 
                course={course}
                isPurchased={course.isPurchased}
                isAuthenticated={!!userId}
              />
            ))}
          </div>
        </div>
      </div>
    </PurchasedCoursesProvider>
  )
}