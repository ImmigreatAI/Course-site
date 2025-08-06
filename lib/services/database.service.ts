// lib/services/database.service.ts
import { createAdminClient } from '@/lib/supabase/admin'
import type { Database } from '@/types/supabase'

type Tables = Database['public']['Tables']
type User = Tables['users']['Row']
type Purchase = Tables['purchases']['Row']
type PurchaseItem = Tables['purchase_items']['Row']
type Enrollment = Tables['enrollments']['Row']

export class DatabaseService {
  private supabase = createAdminClient()

  // User operations
  async createOrUpdateUser(data: {
    clerk_user_id: string
    email: string
    full_name?: string | null  // Changed to accept null
    username?: string | null   // Changed to accept null
    learnworlds_user_id?: string | null 
  }): Promise<User> {
    const { data: user, error } = await this.supabase
      .from('users')
      .upsert({
        clerk_user_id: data.clerk_user_id,
        email: data.email,
        full_name: data.full_name || null,  // Convert undefined to null
        username: data.username || null,     // Convert undefined to null
        learnworlds_user_id: data.learnworlds_user_id || null, 
      }, {
        onConflict: 'clerk_user_id'
      })
      .select()
      .single()

    if (error) throw error
    return user
  }

  async getUserByClerkId(clerkUserId: string): Promise<User | null> {
    const { data, error } = await this.supabase
      .from('users')
      .select('*')
      .eq('clerk_user_id', clerkUserId)
      .single()

    if (error && error.code !== 'PGRST116') throw error
    return data
  }

  // Purchase operations
  async createPurchase(data: {
    user_id: string
    stripe_session_id: string
    stripe_payment_intent_id?: string | null  // Accept null
    amount: number
    currency: string
  }): Promise<Purchase> {
    const { data: purchase, error } = await this.supabase
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
    plan_label: '6mo' | '7day'  // Ensure type matches
    price: number
    enrollment_id: string
    stripe_price_id: string
  }>): Promise<PurchaseItem[]> {
    const { data, error } = await this.supabase
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
    const { data, error } = await this.supabase
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

  // Enrollment operations
  async createEnrollment(data: {
    user_id: string
    purchase_item_id: string
    course_id: string
    course_name: string
    course_url: string
    plan_label: string
    learnworlds_enrollment_id?: string | null
  }): Promise<Enrollment> {
    const { data: enrollment, error } = await this.supabase
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

  async getUserEnrollments(userId: string): Promise<Enrollment[]> {
    const { data, error } = await this.supabase
      .from('enrollments')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .order('enrolled_at', { ascending: false })

    if (error) throw error
    return data || []
  }

  async getUserPurchaseHistory(userId: string) {
    const { data, error } = await this.supabase
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