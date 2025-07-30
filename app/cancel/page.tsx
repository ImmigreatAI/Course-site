'use client'

import { useRouter } from 'next/navigation'
import { XCircle, ArrowLeft, ShoppingCart } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function CancelPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50/30 via-white to-pink-50/30">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center">
          {/* Cancel Icon */}
          <div className="relative mb-8">
            <div className="absolute -inset-6 bg-gradient-to-r from-orange-300/30 to-red-300/30 rounded-full blur-2xl opacity-75" />
            <div className="relative inline-flex items-center justify-center w-24 h-24 bg-gradient-to-r from-orange-500 to-red-500 rounded-full shadow-2xl shadow-orange-200/50">
              <XCircle className="h-12 w-12 text-white" />
            </div>
          </div>

          {/* Cancel Message */}
          <div className="mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Payment Cancelled
            </h1>
            <p className="text-xl text-gray-600 mb-2">
              No worries! Your payment was not processed
            </p>
            <p className="text-sm text-gray-500">
              Your cart items are still saved and ready when you are
            </p>
          </div>

          {/* Information Card */}
          <div className="relative mb-12">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-orange-300/30 to-red-300/30 rounded-3xl blur opacity-75" />
            <div className="relative backdrop-blur-xl bg-white/80 border border-orange-200/30 rounded-3xl p-8 shadow-2xl shadow-orange-100/20">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="text-left">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    What Happened?
                  </h3>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li className="flex items-center">
                      <div className="w-2 h-2 bg-orange-500 rounded-full mr-3" />
                      Payment was cancelled before completion
                    </li>
                    <li className="flex items-center">
                      <div className="w-2 h-2 bg-orange-500 rounded-full mr-3" />
                      No charges were made to your account
                    </li>
                    <li className="flex items-center">
                      <div className="w-2 h-2 bg-orange-500 rounded-full mr-3" />
                      Your cart items are safely preserved
                    </li>
                  </ul>
                </div>
                
                <div className="text-left">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Ready to Continue?
                  </h3>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li className="flex items-center">
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-3" />
                      Your cart is ready for checkout anytime
                    </li>
                    <li className="flex items-center">
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-3" />
                      Browse more courses if you&apos;d like
                    </li>
                    <li className="flex items-center">
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-3" />
                      Contact support if you need assistance
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={() => router.push('/courses')}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl px-8 py-3 font-medium shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
            >
              <ShoppingCart className="w-5 h-5 mr-2" />
              Continue Shopping
            </Button>
            
            <Button
              onClick={() => router.back()}
              variant="outline"
              className="border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 rounded-xl px-8 py-3 font-medium transition-all duration-300 hover:scale-105"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Go Back
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}