// lib/services/database.service.ts
// ============================================
// Enhanced with user purchase validation methods

import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'

type Tables = Database['public']['Tables']
type User = Tables['users']['Row']
type Purchase = Tables['purchases']['Row']
type PurchaseItem = Tables['purchase_items']['Row']
type Enrollment = Tables['enrollments']['Row']

// Create a simple server client without cookies
function createSimpleServerClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables')
  }

  return createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    }
  })
}

// Create admin client for write operations
function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase admin environment variables')
  }

  return createClient<Database>(supabaseUrl, supabaseServiceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    }
  })
}

export class DatabaseService {
  // For read operations - use anon key (works everywhere)
  private getReadClient() {
    return createSimpleServerClient()
  }

  // For write operations - use service key (API routes only)
  private getWriteClient() {
    return createAdminClient()
  }

  // Read operations using anon key
  async getUserByClerkId(clerkUserId: string): Promise<User | null> {
    const supabase = this.getReadClient()
    
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('clerk_user_id', clerkUserId)
      .single()

    if (error && error.code !== 'PGRST116') throw error
    return data
  }

  async getUserEnrollments(userId: string): Promise<Enrollment[]> {
    const supabase = this.getReadClient()
    
    const { data, error } = await supabase
      .from('enrollments')
      .select('*')
      .eq('user_id', userId)
      .order('enrolled_at', { ascending: false })

    if (error) throw error
    return data || []
  }

  async getUserPurchaseHistory(userId: string) {
    const supabase = this.getReadClient()
    
    const { data, error } = await supabase
      .from('purchases')
      .select(`
        *,
        purchase_items (*)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  }

  // NEW: Get user's purchased course IDs (Unique_ids)
  async getUserPurchasedCourseIds(userId: string): Promise<string[]> {
    const supabase = this.getReadClient()
    
    try {
      // First get the database user
      const user = await this.getUserByClerkId(userId)
      if (!user) return []

      // Get all active enrollments with their course IDs
      const { data, error } = await supabase
        .from('enrollments')
        .select(`
          course_id,
          status,
          expires_at,
          purchase_item:purchase_items!inner(
            purchase:purchases!inner(
              status
            )
          )
        `)
        .eq('user_id', user.id)
        .eq('status', 'active')
        .eq('purchase_item.purchase.status', 'completed')

      if (error) {
        console.error('Error fetching purchased courses:', error)
        return []
      }

      // Filter out expired enrollments and extract unique course IDs
      const now = new Date()
      const activeCourseIds = (data || [])
        .filter(enrollment => {
          if (!enrollment.expires_at) return true
          return new Date(enrollment.expires_at) > now
        })
        .map(enrollment => enrollment.course_id)
        .filter((id, index, self) => self.indexOf(id) === index) // Remove duplicates

      return activeCourseIds
    } catch (error) {
      console.error('Error in getUserPurchasedCourseIds:', error)
      return []
    }
  }

  // NEW: Check if user has specific enrollments by course IDs
  async getUserEnrollmentsByCourseIds(
    userId: string, 
    courseIds: string[]
  ): Promise<Map<string, Enrollment | null>> {
    const supabase = this.getReadClient()
    
    try {
      const user = await this.getUserByClerkId(userId)
      if (!user) return new Map()

      const { data, error } = await supabase
        .from('enrollments')
        .select('*')
        .eq('user_id', user.id)
        .in('course_id', courseIds)
        .eq('status', 'active')

      if (error) {
        console.error('Error fetching enrollments by course IDs:', error)
        return new Map()
      }

      // Create a map for easy lookup
      const enrollmentMap = new Map<string, Enrollment | null>()
      courseIds.forEach(id => {
        const enrollment = data?.find(e => e.course_id === id) || null
        enrollmentMap.set(id, enrollment)
      })

      return enrollmentMap
    } catch (error) {
      console.error('Error in getUserEnrollmentsByCourseIds:', error)
      return new Map()
    }
  }

  // Write operations using service key (for API routes only)
  async createOrUpdateUser(data: {
    clerk_user_id: string
    email: string
    full_name?: string | null
    username?: string | null
    learnworlds_user_id?: string | null 
  }): Promise<User> {
    const supabase = this.getWriteClient()
    
    const { data: user, error } = await supabase
      .from('users')
      .upsert({
        clerk_user_id: data.clerk_user_id,
        email: data.email,
        full_name: data.full_name || null,
        username: data.username || null,
        learnworlds_user_id: data.learnworlds_user_id || null, 
      }, {
        onConflict: 'clerk_user_id'
      })
      .select()
      .single()

    if (error) throw error
    return user
  }

  async createPurchase(data: {
    user_id: string
    stripe_session_id: string
    stripe_payment_intent_id?: string | null
    amount: number
    currency: string
  }): Promise<Purchase> {
    const supabase = this.getWriteClient()
    
    const { data: purchase, error } = await supabase
      .from('purchases')
      .insert({
        user_id: data.user_id,
        stripe_session_id: data.stripe_session_id,
        stripe_payment_intent_id: data.stripe_payment_intent_id || null,
        amount: data.amount,
        currency: data.currency,
        status: 'pending'
      })
      .select()
      .single()

    if (error) throw error
    return purchase
  }

  async createPurchaseItems(purchaseId: string, items: Array<{
    course_id: string
    course_name: string
    plan_label: '6mo' | '7day'
    price: number
    enrollment_id: string
    stripe_price_id: string
  }>): Promise<PurchaseItem[]> {
    const supabase = this.getWriteClient()
    
    const { data, error } = await supabase
      .from('purchase_items')
      .insert(
        items.map(item => ({
          purchase_id: purchaseId,
          ...item
        }))
      )
      .select()

    if (error) throw error
    return data || []
  }

  async completePurchase(stripeSessionId: string): Promise<Purchase> {
    const supabase = this.getWriteClient()
    
    const { data, error } = await supabase
      .from('purchases')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString()
      })
      .eq('stripe_session_id', stripeSessionId)
      .select()
      .single()

    if (error) throw error
    return data
  }

  async createEnrollment(data: {
    user_id: string
    purchase_item_id: string
    course_id: string
    course_name: string
    course_url: string
    plan_label: string
    learnworlds_enrollment_id?: string | null
  }): Promise<Enrollment> {
    const supabase = this.getWriteClient()
    
    const { data: enrollment, error } = await supabase
      .from('enrollments')
      .insert({
        ...data,
        learnworlds_enrollment_id: data.learnworlds_enrollment_id || null,
        status: 'active',
        enrolled_at: new Date().toISOString(),
        expires_at: this.calculateExpiryDate(data.plan_label)
      })
      .select()
      .single()

    if (error) throw error
    return enrollment
  }

  private calculateExpiryDate(planLabel: string): string {
    const now = new Date()
    if (planLabel === '6mo') {
      now.setMonth(now.getMonth() + 6)
    } else if (planLabel === '7day') {
      now.setDate(now.getDate() + 7)
    }
    return now.toISOString()
  }
}

export const databaseService = new DatabaseService()