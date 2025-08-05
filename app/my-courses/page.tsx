// app/my-courses/page.tsx
import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { databaseService } from '@/lib/services/database.service'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Package } from 'lucide-react'
import { RealtimeEnrollments } from './components/RealtimeEnrollments'
import type { Database } from '@/types/supabase'

// Define types based on your database structure
type Purchase = Database['public']['Tables']['purchases']['Row'] & {
  purchase_items: Database['public']['Tables']['purchase_items']['Row'][]
}

export default async function MyCoursesPage() {
  const { userId } = await auth()
  
  if (!userId) {
    redirect('/sign-in')
  }

  try {
    // Get user from database using the service
    const user = await databaseService.getUserByClerkId(userId)

    if (!user) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50/30 via-white to-pink-50/30">
          <div className="max-w-4xl mx-auto px-4 py-16 text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Setting up your account...</h1>
            <p className="text-gray-600">Please refresh the page in a moment.</p>
          </div>
        </div>
      )
    }

    // Get user enrollments and purchases using the service
    const enrollments = await databaseService.getUserEnrollments(user.id)
    const purchases = await databaseService.getUserPurchaseHistory(user.id) as Purchase[]

    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50/30 via-white to-pink-50/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">My Courses</h1>
            <p className="text-gray-600">Access your enrolled courses and track your learning progress</p>
          </div>

          {/* Real-time Enrollments */}
          <div className="mb-12">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Your Courses</h2>
            <RealtimeEnrollments userId={user.id} initialEnrollments={enrollments} />
          </div>

          {/* Purchase History */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Purchase History</h2>
            
            {purchases && purchases.length > 0 ? (
              <div className="space-y-4">
                {purchases.map((purchase) => (
                  <Card key={purchase.id} className="backdrop-blur-xl bg-white/80 border-purple-200/30">
                    <div className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <p className="text-sm text-gray-500">
                            Order #{purchase.id.slice(-8)}
                          </p>
                          <p className="text-sm text-gray-600">
                            {purchase.created_at ? new Date(purchase.created_at).toLocaleDateString() : 'N/A'}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-semibold text-gray-900">
                            ${(purchase.amount / 100).toFixed(2)}
                          </p>
                          <Badge 
                            variant={purchase.status === 'completed' ? 'default' : 'secondary'}
                            className={purchase.status === 'completed' ? 'bg-green-600' : ''}
                          >
                            {purchase.status}
                          </Badge>
                        </div>
                      </div>
                      
                      {purchase.purchase_items && purchase.purchase_items.length > 0 && (
                        <div className="border-t pt-4">
                          <p className="text-sm font-medium text-gray-700 mb-2">Items:</p>
                          <div className="space-y-1">
                            {purchase.purchase_items.map((item) => (
                              <div key={item.id} className="flex items-center justify-between text-sm">
                                <span className="text-gray-600">{item.course_name}</span>
                                <span className="text-gray-900">${(item.price / 100).toFixed(2)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="backdrop-blur-xl bg-white/80 border-purple-200/30">
                <div className="p-12 text-center">
                  <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600">No purchase history</p>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    )
  } catch (error) {
    console.error('Error loading user courses:', error)
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50/30 via-white to-pink-50/30">
        <div className="max-w-4xl mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Error loading courses</h1>
          <p className="text-gray-600">Please try refreshing the page.</p>
        </div>
      </div>
    )
  }
}