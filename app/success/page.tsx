// app/success/page.tsx
'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function SuccessPage() {
  const router = useRouter()

  useEffect(() => {
    // Clear cart after successful purchase
    // You might want to do this after verifying the payment with Stripe
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50/30 via-white to-pink-50/30 flex items-center justify-center py-16">
      <div className="max-w-md w-full mx-auto px-4">
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl p-8 border border-purple-100/30 text-center">
          <div className="mb-6">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
          </div>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Payment Successful!
          </h1>
          
          <p className="text-gray-600 mb-8">
            Thank you for your purchase. You&apos;ll receive an email confirmation shortly with access details to your courses.
          </p>
          
          <div className="space-y-3">
            <Button
              onClick={() => router.push('/my-courses')}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white rounded-xl"
            >
              Go to My Courses
            </Button>
            
            <Button
              onClick={() => router.push('/')}
              variant="outline"
              className="w-full border-purple-300 text-purple-700 hover:bg-purple-50 rounded-xl"
            >
              Back to Home
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}