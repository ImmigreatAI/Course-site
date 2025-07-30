'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { CheckCircle, Loader2, BookOpen, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useCartStore } from '@/lib/store/cart-store'

export default function SuccessPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { clearCart } = useCartStore()
  const [isLoading, setIsLoading] = useState(true)
  const [sessionId, setSessionId] = useState<string | null>(null)

  useEffect(() => {
    const session_id = searchParams.get('session_id')
    setSessionId(session_id)
    
    // Clear the cart after successful payment
    if (session_id) {
      clearCart()
    }
    
    // Simulate loading for better UX
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 1500)

    return () => clearTimeout(timer)
  }, [searchParams, clearCart])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50/30 via-white to-pink-50/30 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="absolute -inset-4 bg-gradient-to-r from-purple-300/30 to-pink-300/30 rounded-full blur-xl opacity-75 animate-pulse" />
            <div className="relative bg-white/90 backdrop-blur-xl border border-purple-200/40 rounded-3xl p-8 shadow-2xl shadow-purple-100/50">
              <Loader2 className="h-12 w-12 mx-auto text-purple-600 animate-spin mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Processing your order...
              </h2>
              <p className="text-gray-600">
                Please wait while we confirm your payment
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50/30 via-white to-pink-50/30">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center">
          {/* Success Icon */}
          <div className="relative mb-8">
            <div className="absolute -inset-6 bg-gradient-to-r from-green-300/30 to-emerald-300/30 rounded-full blur-2xl opacity-75" />
            <div className="relative inline-flex items-center justify-center w-24 h-24 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full shadow-2xl shadow-green-200/50">
              <CheckCircle className="h-12 w-12 text-white" />
            </div>
          </div>

          {/* Success Message */}
          <div className="mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Payment Successful! 🎉
            </h1>
            <p className="text-xl text-gray-600 mb-2">
              Thank you for your purchase
            </p>
            {sessionId && (
              <p className="text-sm text-gray-500">
                Order ID: {sessionId.slice(-12)}
              </p>
            )}
          </div>

          {/* Success Card */}
          <div className="relative mb-12">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-300/30 to-pink-300/30 rounded-3xl blur opacity-75" />
            <div className="relative backdrop-blur-xl bg-white/80 border border-purple-200/30 rounded-3xl p-8 shadow-2xl shadow-purple-100/20">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="text-left">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    What&apos;s Next?
                  </h3>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li className="flex items-center">
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-3" />
                      Your courses are now available in My Courses
                    </li>
                    <li className="flex items-center">
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-3" />
                      Access your learning materials instantly
                    </li>
                    <li className="flex items-center">
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-3" />
                      Receipt sent to your email address
                    </li>
                  </ul>
                </div>
                
                <div className="text-left">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Need Help?
                  </h3>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li className="flex items-center">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mr-3" />
                      Check our FAQ section
                    </li>
                    <li className="flex items-center">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mr-3" />
                      Contact support if you have questions
                    </li>
                    <li className="flex items-center">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mr-3" />
                      Join our community for tips and updates
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={() => router.push('/my-courses')}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl px-8 py-3 font-medium shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
            >
              <BookOpen className="w-5 h-5 mr-2" />
              Access My Courses
            </Button>
            
            <Button
              onClick={() => router.push('/courses')}
              variant="outline"
              className="border-purple-300 text-purple-700 hover:bg-purple-50 hover:border-purple-400 rounded-xl px-8 py-3 font-medium transition-all duration-300 hover:scale-105"
            >
              Browse More Courses
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}