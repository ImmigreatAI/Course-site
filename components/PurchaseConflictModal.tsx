// components/PurchaseConflictModal.tsx
// ============================================
// Modal to handle cart conflicts after login

'use client'

import { useEffect, useState } from 'react'
import { useCartStore } from '@/lib/store/cart-store'
import { useAuth } from '@clerk/nextjs'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { AlertTriangle, ShoppingCart, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

export function PurchaseConflictModal() {
  const [isOpen, setIsOpen] = useState(false)
  const { isSignedIn, isLoaded } = useAuth()
  const { 
    conflictingItems, 
    hasConflicts, 
    removeConflictingItems,
    validateCartAgainstPurchases 
  } = useCartStore()

  useEffect(() => {
    // Check for conflicts when user signs in
    if (isLoaded && isSignedIn) {
      // Small delay to ensure purchases are loaded
      const timer = setTimeout(() => {
        validateCartAgainstPurchases()
        if (hasConflicts()) {
          setIsOpen(true)
        }
      }, 1000)
      
      return () => clearTimeout(timer)
    }
  }, [isSignedIn, isLoaded, validateCartAgainstPurchases, hasConflicts])

  const handleRemoveConflicts = () => {
    const removedCount = conflictingItems.length
    const removedNames = conflictingItems.map(item => item.courseName).join(', ')
    
    removeConflictingItems()
    setIsOpen(false)
    
    toast.success(`Removed ${removedCount} item${removedCount > 1 ? 's' : ''} from cart`, {
      description: removedNames,
      duration: 5000
    })
  }

  const handleKeepItems = () => {
    setIsOpen(false)
    toast.info('Items kept in cart. Please remove them manually to proceed with checkout.')
  }

  if (!isOpen || conflictingItems.length === 0) {
    return null
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            <DialogTitle>Cart Conflict Detected</DialogTitle>
          </div>
          <DialogDescription className="pt-2">
            Some items in your cart are already purchased or included in your existing courses. 
            These items need to be removed before you can proceed to checkout.
          </DialogDescription>
        </DialogHeader>
        
        <div className="my-4">
          <p className="text-sm font-medium text-gray-700 mb-3">
            Conflicting items:
          </p>
          <div className="space-y-2 max-h-[200px] overflow-y-auto">
            {conflictingItems.map((item) => (
              <div 
                key={item.courseId}
                className="flex items-center justify-between p-3 bg-amber-50 border border-amber-200 rounded-lg"
              >
                <div className="flex-1">
                  <p className="font-medium text-sm text-gray-900">
                    {item.courseName}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="secondary" className="text-xs">
                      {item.planLabel === '6mo' ? '6 months' : '7 days'}
                    </Badge>
                    <span className="text-xs text-gray-500">
                      ${item.price}
                    </span>
                  </div>
                </div>
                <Badge className="bg-amber-600 text-white">
                  Already Owned
                </Badge>
              </div>
            ))}
          </div>
        </div>
        
        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={handleKeepItems}
            className="flex items-center gap-2"
          >
            <ShoppingCart className="h-4 w-4" />
            Keep in Cart
          </Button>
          <Button
            onClick={handleRemoveConflicts}
            className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white flex items-center gap-2"
          >
            <Trash2 className="h-4 w-4" />
            Remove Conflicts
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}