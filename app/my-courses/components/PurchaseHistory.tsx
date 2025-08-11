// app/my-courses/components/PurchaseHistory.tsx
// ============================================
'use client'

import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Package } from 'lucide-react'
import type { PurchaseWithItems } from '@/lib/types/enrollment.types'

interface PurchaseHistoryProps {
  purchases: PurchaseWithItems[]
}

export function PurchaseHistory({ purchases }: PurchaseHistoryProps) {
  if (!purchases || purchases.length === 0) {
    return (
      <Card className="backdrop-blur-xl bg-white/80 border-purple-200/30">
        <div className="p-12 text-center">
          <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600">No purchase history</p>
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {purchases.map((purchase) => (
        <Card 
          key={purchase.id} 
          className="backdrop-blur-xl bg-white/80 border-purple-200/30"
        >
          <div className="p-6">
            {/* Purchase Header */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-gray-500">
                  Order #{purchase.id.slice(-8)}
                </p>
                <p className="text-sm text-gray-600">
                  {purchase.created_at 
                    ? new Date(purchase.created_at).toLocaleDateString() 
                    : 'N/A'}
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
            
            {/* Purchase Items */}
            {purchase.purchase_items && purchase.purchase_items.length > 0 && (
              <div className="border-t pt-4">
                <p className="text-sm font-medium text-gray-700 mb-2">Items:</p>
                <div className="space-y-1">
                  {purchase.purchase_items.map((item) => (
                    <div 
                      key={item.id} 
                      className="flex items-center justify-between text-sm"
                    >
                      <span className="text-gray-600">{item.course_name}</span>
                      <span className="text-gray-900">
                        ${(item.price / 100).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Card>
      ))}
    </div>
  )
}
