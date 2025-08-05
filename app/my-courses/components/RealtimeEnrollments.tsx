// app/my-courses/components/RealtimeEnrollments.tsx
'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Database } from '@/types/supabase'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Clock, ExternalLink, BookOpen, Loader2, Sparkles } from 'lucide-react'
import { toast } from 'sonner'

type Enrollment = Database['public']['Tables']['enrollments']['Row']

interface RealtimeEnrollmentsProps {
  userId: string
  initialEnrollments: Enrollment[]
}

export function RealtimeEnrollments({ 
  userId, 
  initialEnrollments 
}: RealtimeEnrollmentsProps) {
  const [enrollments, setEnrollments] = useState(initialEnrollments)
  const [isConnected, setIsConnected] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    // Set up real-time subscription
    console.log('Setting up real-time subscription for user:', userId)
    
    const channel = supabase
      .channel(`enrollments-${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'enrollments',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          console.log('Real-time event received:', payload)
          
          if (payload.eventType === 'INSERT') {
            const newEnrollment = payload.new as Enrollment
            setEnrollments(prev => {
              // Check if enrollment already exists to prevent duplicates
              const exists = prev.some(e => e.id === newEnrollment.id)
              if (exists) return prev
              
              // Show toast for new enrollment
              toast.success('New course enrolled!', {
                description: `${newEnrollment.course_name} is now available`,
                duration: 5000,
              })
              
              return [newEnrollment, ...prev]
            })
          } else if (payload.eventType === 'UPDATE') {
            const updatedEnrollment = payload.new as Enrollment
            setEnrollments(prev => 
              prev.map(e => e.id === updatedEnrollment.id ? updatedEnrollment : e)
            )
            
            // Show toast for status changes
            if (payload.old && (payload.old as Enrollment).status !== updatedEnrollment.status) {
              if (updatedEnrollment.status === 'active') {
                toast.success('Course activated!', {
                  description: `${updatedEnrollment.course_name} is now active`,
                })
              } else if (updatedEnrollment.status === 'expired') {
                toast.warning('Course expired', {
                  description: `${updatedEnrollment.course_name} has expired`,
                })
              }
            }
          } else if (payload.eventType === 'DELETE') {
            const deletedId = (payload.old as { id: string }).id
            setEnrollments(prev => prev.filter(e => e.id !== deletedId))
            toast.info('Course removed from your enrollments')
          }
        }
      )
      .subscribe((status) => {
        console.log('Subscription status:', status)
        setIsConnected(status === 'SUBSCRIBED')
        
        if (status === 'SUBSCRIBED') {
          console.log('✅ Real-time connection established')
        } else if (status === 'CHANNEL_ERROR') {
          console.error('❌ Real-time connection error')
          toast.error('Real-time updates unavailable')
        }
      })

    return () => {
      console.log('Cleaning up real-time subscription')
      supabase.removeChannel(channel)
    }
  }, [userId, supabase])

  // Group enrollments by status
  const activeEnrollments = enrollments.filter(e => e.status === 'active')
  const pendingEnrollments = enrollments.filter(e => e.status === 'pending')
  const expiredEnrollments = enrollments.filter(e => e.status === 'expired')

  // Calculate days until expiry
  const getDaysUntilExpiry = (expiryDate: string | null) => {
    if (!expiryDate) return null
    const days = Math.ceil((new Date(expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    return days > 0 ? days : 0
  }

  // Render enrollment card
  const EnrollmentCard = ({ enrollment }: { enrollment: Enrollment }) => {
    const daysUntilExpiry = getDaysUntilExpiry(enrollment.expires_at)
    const isExpiringSoon = daysUntilExpiry !== null && daysUntilExpiry <= 7
    
    return (
      <Card 
        key={enrollment.id} 
        className="backdrop-blur-xl bg-white/80 border-purple-200/30 hover:shadow-xl transition-all duration-300 group"
      >
        <div className="p-6">
          <div className="flex items-start justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 line-clamp-2 flex-1">
              {enrollment.course_name}
            </h3>
            <div className="flex gap-2 ml-2">
              {enrollment.status === 'pending' && (
                <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300">
                  <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                  Processing
                </Badge>
              )}
              {enrollment.status === 'active' && (
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
                  Active
                </Badge>
              )}
              {enrollment.status === 'expired' && (
                <Badge variant="outline" className="bg-red-50 text-red-700 border-red-300">
                  Expired
                </Badge>
              )}
              {isConnected && (
                <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-300">
                  <Sparkles className="w-3 h-3 mr-1" />
                  Live
                </Badge>
              )}
            </div>
          </div>
          
          <div className="space-y-2 mb-4">
            <div className="flex items-center text-sm text-gray-600">
              <Clock className="w-4 h-4 mr-2" />
              <span>
                Enrolled: {enrollment.enrolled_at ? new Date(enrollment.enrolled_at).toLocaleDateString() : 'Processing...'}
              </span>
            </div>
            
            {enrollment.expires_at && (
              <div className={`flex items-center text-sm ${isExpiringSoon ? 'text-orange-600 font-medium' : 'text-gray-600'}`}>
                <Clock className="w-4 h-4 mr-2" />
                <span>
                  {daysUntilExpiry === 0 
                    ? 'Expires today!' 
                    : daysUntilExpiry === 1
                    ? 'Expires tomorrow'
                    : `Expires in ${daysUntilExpiry} days`}
                </span>
              </div>
            )}
            
            <div className="flex items-center text-sm text-gray-600">
              <BookOpen className="w-4 h-4 mr-2" />
              <span className="capitalize">
                {enrollment.plan_label === '6mo' ? '6 Month Access' : '7 Day Trial'}
              </span>
            </div>
          </div>
          
          <Button
            disabled={enrollment.status !== 'active'}
            asChild={enrollment.status === 'active'}
            className={`w-full ${
              enrollment.status === 'active'
                ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
          >
            {enrollment.status === 'active' ? (
              <a href={enrollment.course_url} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="w-4 h-4 mr-2" />
                Access Course
              </a>
            ) : enrollment.status === 'pending' ? (
              <span className="flex items-center justify-center">
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Processing Enrollment...
              </span>
            ) : (
              <span>Course Expired</span>
            )}
          </Button>
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-8">
      {/* Active Enrollments */}
      {activeEnrollments.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            Active Courses
            {isConnected && (
              <Badge variant="outline" className="ml-3 bg-green-50 text-green-700 border-green-300">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse" />
                Live Updates
              </Badge>
            )}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {activeEnrollments.map((enrollment) => (
              <EnrollmentCard key={enrollment.id} enrollment={enrollment} />
            ))}
          </div>
        </div>
      )}

      {/* Pending Enrollments */}
      {pendingEnrollments.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Processing Enrollments
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pendingEnrollments.map((enrollment) => (
              <EnrollmentCard key={enrollment.id} enrollment={enrollment} />
            ))}
          </div>
        </div>
      )}

      {/* Expired Enrollments */}
      {expiredEnrollments.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4 text-gray-500">
            Expired Courses
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 opacity-60">
            {expiredEnrollments.map((enrollment) => (
              <EnrollmentCard key={enrollment.id} enrollment={enrollment} />
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {enrollments.length === 0 && (
        <Card className="backdrop-blur-xl bg-white/80 border-purple-200/30">
          <div className="p-12 text-center">
            <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">You haven&apos;t enrolled in any courses yet</p>
            <Button asChild>
              <a href="/courses">Browse Courses</a>
            </Button>
          </div>
        </Card>
      )}
    </div>
  )
}