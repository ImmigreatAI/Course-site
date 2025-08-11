// app/my-courses/page.tsx
// ============================================
// Enhanced My Courses page with better organization and UI

import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { myCoursesService } from '@/lib/services/my-courses.service'
import { EnrollmentList } from './components/EnrollmentList'
import { PurchaseHistory } from './components/PurchaseHistory'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowRight, BookOpen, ShoppingBag, Clock, TrendingUp } from 'lucide-react'

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
            Setting up your account...
          </h1>
          <p className="text-gray-600">Please refresh the page in a moment.</p>
        </div>
      </div>
    )
  }

  // Group enrollments by status
  const groupedEnrollments = myCoursesService.groupEnrollmentsByStatus(courseData.enrollments)
  const totalCourses = courseData.enrollments.length
  const activeCourses = groupedEnrollments.active.length
  const completedPurchases = courseData.purchases.filter(p => p.status === 'completed').length

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50/30 via-white to-pink-50/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header with Stats */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">My Courses</h1>
              <p className="text-gray-600">
                Access your enrolled courses and track your learning progress
              </p>
            </div>
            <Link href="/courses">
              <Button 
                variant="outline"
                className="border-purple-300 hover:border-purple-400 hover:bg-purple-50"
              >
                Browse More Courses
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
            <div className="bg-white/80 backdrop-blur-xl rounded-xl border border-purple-200/30 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Courses</p>
                  <p className="text-2xl font-bold text-gray-900">{totalCourses}</p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-pink-100 rounded-xl flex items-center justify-center">
                  <BookOpen className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </div>
            
            <div className="bg-white/80 backdrop-blur-xl rounded-xl border border-green-200/30 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Active Courses</p>
                  <p className="text-2xl font-bold text-green-600">{activeCourses}</p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-br from-green-100 to-emerald-100 rounded-xl flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </div>
            
            <div className="bg-white/80 backdrop-blur-xl rounded-xl border border-blue-200/30 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Purchases</p>
                  <p className="text-2xl font-bold text-blue-600">{completedPurchases}</p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-xl flex items-center justify-center">
                  <ShoppingBag className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Enrollments Section with Tabs */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Your Courses</h2>
            <div className="flex gap-2">
              {groupedEnrollments.active.length > 0 && (
                <Badge className="bg-green-100 text-green-700 border-green-200">
                  {groupedEnrollments.active.length} Active
                </Badge>
              )}
              {groupedEnrollments.pending.length > 0 && (
                <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200">
                  {groupedEnrollments.pending.length} Pending
                </Badge>
              )}
              {groupedEnrollments.expired.length > 0 && (
                <Badge className="bg-red-100 text-red-700 border-red-200">
                  {groupedEnrollments.expired.length} Expired
                </Badge>
              )}
            </div>
          </div>
          
          {/* Active Courses */}
          {groupedEnrollments.active.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                <Clock className="w-4 h-4 mr-1 text-green-600" />
                Active Courses
              </h3>
              <EnrollmentList enrollments={groupedEnrollments.active} />
            </div>
          )}
          
          {/* Pending Enrollments */}
          {groupedEnrollments.pending.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                <Clock className="w-4 h-4 mr-1 text-yellow-600" />
                Processing Enrollments
              </h3>
              <EnrollmentList enrollments={groupedEnrollments.pending} />
            </div>
          )}
          
          {/* Expired Courses */}
          {groupedEnrollments.expired.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                <Clock className="w-4 h-4 mr-1 text-red-600" />
                Expired Courses
              </h3>
              <EnrollmentList enrollments={groupedEnrollments.expired} />
            </div>
          )}
          
          {/* No Enrollments */}
          {courseData.enrollments.length === 0 && (
            <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-purple-200/30 p-12 text-center">
              <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No courses yet</h3>
              <p className="text-gray-600 mb-6">Start your learning journey today!</p>
              <Link href="/courses">
                <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white">
                  Browse Courses
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          )}
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