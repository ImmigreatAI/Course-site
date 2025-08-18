// app/courses/eb1a-roadmap/page.tsx
// ============================================
// Individual Course Page - EB-1A Roadmap
// Complete implementation with server-side auth and client components

import { auth } from '@clerk/nextjs/server'
import { PurchasedCoursesProvider } from '@/components/PurchasedCoursesProvider'
import { userCoursesService } from '@/lib/services/user-courses.service'
import EB1ACourseDetail from './course-detail'

export const metadata = {
  title: "EB-1A Green Card Roadmap - immigreat.ai",
  description: "Complete step-by-step guide to securing your EB-1A green card through extraordinary ability demonstration. Expert-curated course with templates and community support.",
  keywords: "EB-1A, green card, extraordinary ability, immigration, USCIS, petition",
  openGraph: {
    title: "EB-1A Green Card Roadmap",
    description: "Complete step-by-step guide to securing your EB-1A green card through extraordinary ability demonstration.",
    type: "website",
  },
  robots: {
    index: true,
    follow: true,
  }
}

export default async function EB1ACoursePage() {
  // Check authentication
  const { userId } = await auth()
  
  // Get purchased course IDs for client-side state
  const purchasedCourseIds = userId 
    ? await userCoursesService.getUserPurchasedCourseIds(userId)
    : []
  
  return (
    <PurchasedCoursesProvider 
      initialPurchasedIds={purchasedCourseIds}
      isAuthenticated={!!userId}
    >
      <EB1ACourseDetail />
    </PurchasedCoursesProvider>
  )
}