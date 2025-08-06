// lib/services/cache.service.ts
import { unstable_cache } from 'next/cache'
import { databaseService } from './database.service'

export const getCachedUserEnrollments = unstable_cache(
  async (userId: string) => {
    return databaseService.getUserEnrollments(userId)
  },
  ['user-enrollments'],
  {
    revalidate: 300, // 5 minutes
    tags: ['enrollments']
  }
)

export const getCachedUserPurchases = unstable_cache(
  async (userId: string) => {
    return databaseService.getUserPurchaseHistory(userId)
  },
  ['user-purchases'],
  {
    revalidate: 300, // 5 minutes
    tags: ['purchases']
  }
)