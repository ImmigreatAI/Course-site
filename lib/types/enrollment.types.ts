// lib/types/enrollment.types.ts
// ============================================
import type { Database } from '@/types/supabase'

export type Enrollment = Database['public']['Tables']['enrollments']['Row']
export type Purchase = Database['public']['Tables']['purchases']['Row']
export type PurchaseItem = Database['public']['Tables']['purchase_items']['Row']

export interface PurchaseWithItems extends Purchase {
  purchase_items: PurchaseItem[]
}

export interface EnrollmentGroup {
  active: Enrollment[]
  pending: Enrollment[]
  expired: Enrollment[]
}

export interface CoursePageData {
  enrollments: Enrollment[]
  purchases: PurchaseWithItems[]
}
