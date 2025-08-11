// components/QuickAccessButton.tsx
// ============================================
// Quick access button for purchased courses

'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ExternalLink, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useState } from 'react'

interface QuickAccessButtonProps {
  courseUrl: string
  courseName: string
  className?: string
  size?: 'sm' | 'default' | 'lg'
  variant?: 'default' | 'outline' | 'ghost'
}

export function QuickAccessButton({ 
  courseUrl, 
  courseName,
  className = '',
  size = 'default',
  variant = 'default'
}: QuickAccessButtonProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const handleAccess = async () => {
    setIsLoading(true)
    
    try {
      // Track course access (analytics)
      toast.success(`Opening ${courseName}...`, {
        description: 'Redirecting to course platform',
        duration: 2000
      })
      
      // Small delay for UX
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // Open in new tab
      window.open(courseUrl, '_blank', 'noopener,noreferrer')
    } catch (error) {
      console.error('Error accessing course:', error)
      toast.error('Failed to access course. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button
      onClick={handleAccess}
      disabled={isLoading}
      size={size}
      variant={variant}
      className={className}
    >
      {isLoading ? (
        <>
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          Opening...
        </>
      ) : (
        <>
          <ExternalLink className="w-4 h-4 mr-2" />
          Access Course
        </>
      )}
    </Button>
  )
}