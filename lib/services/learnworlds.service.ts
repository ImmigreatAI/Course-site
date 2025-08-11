// lib/services/learnworlds.service.ts
// ============================================
import { z } from 'zod'

// Configuration
const LEARNWORLDS_API_URL = process.env.LEARNWORLDS_API_URL || 'https://courses.getgreencardonyourown.com/admin/api/v2'
const LEARNWORLDS_AUTH_HEADER = `Bearer ${process.env.LEARNWORLDS_AUTH_TOKEN || ''}`
const LEARNWORLDS_CLIENT_HEADER = process.env.LEARNWORLDS_CLIENT_TOKEN || ''
const LEARNWORLDS_API_DELAY_MS = 500 // Rate limiting delay

// Types
export interface LearnWorldsUser {
  id?: string
  email: string
  username: string
}

export interface EnrollmentData {
  productId: string
  productType: 'course' | 'bundle'
  justification: string
  price: number
  send_enrollment_email: boolean
}

export interface EnrollmentResult {
  enrollmentId: string
  category: string
  success: boolean
  error?: string
  index: number
  originalPrice: number
  courseName: string
}

// Validation schemas
const LearnWorldsUserSchema = z.object({
  id: z.string().optional(),
  email: z.string().email(),
  username: z.string()
})

const EnrollmentResponseSchema = z.object({
  success: z.boolean()
}).passthrough()

export class LearnWorldsService {
  private headers = {
    'Authorization': LEARNWORLDS_AUTH_HEADER,
    'Lw-Client': LEARNWORLDS_CLIENT_HEADER,
    'Accept': 'application/json',
    'Content-Type': 'application/json'
  }

  // Rate limiting helper
  private async delayForRateLimit(): Promise<void> {
    console.log(`⏱️  Waiting ${LEARNWORLDS_API_DELAY_MS}ms for rate limiting...`)
    await new Promise(resolve => setTimeout(resolve, LEARNWORLDS_API_DELAY_MS))
  }

  // Validate API response
  private async validateResponse(response: Response, operation: string): Promise<string> {
    const responseText = await response.text()
    
    console.log(`${operation} response:`, {
      status: response.status,
      statusText: response.statusText,
      contentType: response.headers.get('content-type'),
      textLength: responseText.length
    })

    // Check for authentication errors
    if (response.status === 401 || response.status === 403) {
      throw new Error(`Authentication failed (${response.status}): Check LearnWorlds API credentials`)
    }

    // Check for HTML responses (usually means auth issues)
    if (responseText.includes('<html>') || responseText.includes('<!DOCTYPE')) {
      throw new Error('Received HTML instead of JSON - authentication issue')
    }

    // Check for empty responses
    if (!responseText.trim() && !response.ok) {
      throw new Error(`Empty response from LearnWorlds API - ${operation} failed`)
    }

    return responseText
  }

  // Check if user exists
  async checkUserExists(email: string): Promise<LearnWorldsUser | null> {
    try {
      const url = `${LEARNWORLDS_API_URL}/users/${encodeURIComponent(email)}`
      
      console.log('🔍 Checking user existence:', { email })
      
      const response = await fetch(url, {
        method: 'GET',
        headers: this.headers
      })

      if (response.status === 404) {
        console.log('User not found in LearnWorlds:', email)
        await this.delayForRateLimit()
        return null
      }

      const responseText = await this.validateResponse(response, 'User check')
      
      if (response.ok) {
        const userData = LearnWorldsUserSchema.parse(JSON.parse(responseText))
        console.log('✅ User found:', { email, userId: userData.id })
        await this.delayForRateLimit()
        return userData
      }

      throw new Error(`User check failed: ${response.status}`)
    } catch (error) {
      console.error('Error checking user:', error)
      throw error
    }
  }

  // Create new user
  async createUser(email: string, username: string): Promise<LearnWorldsUser> {
    try {
      const url = `${LEARNWORLDS_API_URL}/users`
      const requestBody = { email, username }
      
      console.log('👤 Creating user:', { email, username })
      
      const response = await fetch(url, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify(requestBody)
      })

      const responseText = await this.validateResponse(response, 'User creation')
      
      if (response.ok || response.status === 201) {
        const userData = LearnWorldsUserSchema.parse(JSON.parse(responseText))
        console.log('✅ User created:', { email, userId: userData.id })
        await this.delayForRateLimit()
        return userData
      }

      throw new Error(`User creation failed: ${response.status}`)
    } catch (error) {
      console.error('Error creating user:', error)
      throw error
    }
  }

  // Enroll user in course/bundle
  async enrollUser(email: string, enrollmentData: EnrollmentData): Promise<boolean> {
    try {
      const url = `${LEARNWORLDS_API_URL}/users/${encodeURIComponent(email)}/enrollment`
      
      // Ensure price is explicitly set for free courses
      const requestBody = { ...enrollmentData }
      if (enrollmentData.price === 0) {
        console.log('🆓 Processing free course enrollment')
        requestBody.price = 0
      }
      
      console.log('📚 Enrolling user:', { 
        email, 
        productId: enrollmentData.productId,
        productType: enrollmentData.productType,
        price: enrollmentData.price
      })
      
      const response = await fetch(url, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify(requestBody)
      })

      const responseText = await this.validateResponse(response, 'Enrollment')
      
      if (response.ok) {
        // Empty response with 200 is considered success
        if (!responseText.trim()) {
          console.log('✅ Enrollment successful (empty response)')
          await this.delayForRateLimit()
          return true
        }
        
        try {
          const result = EnrollmentResponseSchema.parse(JSON.parse(responseText))
          console.log('✅ Enrollment successful')
          await this.delayForRateLimit()
          return result.success === true
        } catch {
          // If we can't parse but got 200, assume success
          console.log('✅ Enrollment successful (unparseable response)')
          await this.delayForRateLimit()
          return true
        }
      }

      // Handle specific error cases
      if (responseText.includes('already owned') || responseText.includes('Product is already owned')) {
        console.log('⚠️ Course already owned - treating as success')
        await this.delayForRateLimit()
        return true
      }

      throw new Error(`Enrollment failed: ${response.status} - ${responseText.substring(0, 200)}`)
    } catch (error) {
      console.error('Error enrolling user:', error)
      await this.delayForRateLimit() // Still delay on error
      throw error
    }
  }

  // Get or create user
  async ensureUserExists(email: string, username: string): Promise<LearnWorldsUser> {
    let user = await this.checkUserExists(email)
    
    if (!user) {
      console.log('⚠️ User does not exist, creating...')
      user = await this.createUser(email, username)
    }
    
    return user
  }
}

export const learnWorldsService = new LearnWorldsService()
