// app/api/stripe/webhook/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerStripe } from '@/lib/stripe/config'
import Stripe from 'stripe'

// Use Node.js runtime for proper webhook handling
export const runtime = 'nodejs'

interface WebhookResponse {
  received?: boolean
  eventId?: string
  eventType?: string
  error?: string
}

// LearnWorlds API configuration
const LEARNWORLDS_API_URL = process.env.LEARNWORLDS_API_URL || 'https://courses.getgreencardonyourown.com/admin/api/v2'
const LEARNWORLDS_AUTH_HEADER = `Bearer ${process.env.LEARNWORLDS_AUTH_TOKEN || ''}`
const LEARNWORLDS_CLIENT_HEADER = process.env.LEARNWORLDS_CLIENT_TOKEN || ''

interface LearnWorldsUser {
  id?: string
  email: string
  username: string
}

interface EnrollmentData {
  productId: string
  productType: 'course' | 'bundle'
  justification: string
  price: number
  send_enrollment_email: boolean
}

// Check if user exists in LearnWorlds
async function checkUserExists(email: string): Promise<LearnWorldsUser | null> {
  try {
    const url = `${LEARNWORLDS_API_URL}/users/${encodeURIComponent(email)}`
    
    console.log('Checking user existence:', { 
      url, 
      email,
      authHeader: LEARNWORLDS_AUTH_HEADER ? LEARNWORLDS_AUTH_HEADER.substring(0, 20) + '...' : 'missing',
      clientHeader: LEARNWORLDS_CLIENT_HEADER ? LEARNWORLDS_CLIENT_HEADER.substring(0, 20) + '...' : 'missing'
    })
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': LEARNWORLDS_AUTH_HEADER,
        'Lw-Client': LEARNWORLDS_CLIENT_HEADER,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    })

    console.log('User check response:', {
      status: response.status,
      statusText: response.statusText,
      contentType: response.headers.get('content-type'),
      headers: Object.fromEntries(response.headers.entries())
    })

    const responseText = await response.text()
    console.log('Raw response text length:', responseText.length)
    console.log('Raw response text (first 500 chars):', responseText.substring(0, 500))
    
    if (response.status === 200) {
      if (!responseText.trim()) {
        console.log('Empty 200 response - API authentication or endpoint issue')
        throw new Error('Empty response from LearnWorlds API - check authentication credentials')
      }
      
      // Check if response is HTML (authentication error page)
      if (responseText.includes('<html>') || responseText.includes('<!DOCTYPE')) {
        console.error('Received HTML response instead of JSON - likely authentication issue')
        throw new Error('Authentication failed - received HTML page instead of JSON')
      }
      
      try {
        const userData = JSON.parse(responseText)
        console.log('User found in LearnWorlds:', { email, userId: userData.id })
        return userData
      } catch (parseError) {
        console.error('Failed to parse user response:', { responseText, parseError })
        throw new Error(`Invalid JSON response: ${responseText.substring(0, 200)}`)
      }
    } else if (response.status === 404) {
      console.log('User not found in LearnWorlds (404):', email)
      return null
    } else if (response.status === 401 || response.status === 403) {
      console.error('Authentication failed:', {
        status: response.status,
        statusText: response.statusText,
        responseText: responseText.substring(0, 200)
      })
      throw new Error(`Authentication failed: ${response.status} - Check your LearnWorlds API credentials`)
    } else {
      console.error('API error:', {
        status: response.status,
        statusText: response.statusText,
        responseText: responseText.substring(0, 200)
      })
      throw new Error(`API error: ${response.status} - ${response.statusText}`)
    }
  } catch (error) {
    console.error('Error in checkUserExists:', error)
    throw error
  }
}

// Create new user in LearnWorlds
async function createUser(email: string, username: string): Promise<LearnWorldsUser> {
  try {
    const url = `${LEARNWORLDS_API_URL}/users`
    
    const requestBody = {
      email: email,
      username: username
    }
    
    console.log('Creating user:', { 
      url, 
      email, 
      username,
      requestBody
    })
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': LEARNWORLDS_AUTH_HEADER,
        'Lw-Client': LEARNWORLDS_CLIENT_HEADER,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(requestBody)
    })

    console.log('User creation response:', {
      status: response.status,
      statusText: response.statusText,
      contentType: response.headers.get('content-type'),
      headers: Object.fromEntries(response.headers.entries())
    })

    const responseText = await response.text()
    console.log('Raw creation response length:', responseText.length)
    console.log('Raw creation response (first 500 chars):', responseText.substring(0, 500))

    if (response.status === 200 || response.status === 201) {
      if (!responseText.trim()) {
        console.error('Empty response from user creation API - authentication issue')
        throw new Error('Empty response from LearnWorlds user creation API - check authentication')
      }
      
      // Check if response is HTML (authentication error page)
      if (responseText.includes('<html>') || responseText.includes('<!DOCTYPE')) {
        console.error('Received HTML response instead of JSON during user creation')
        throw new Error('User creation failed - received HTML page instead of JSON (auth issue)')
      }
      
      try {
        const userData = JSON.parse(responseText)
        console.log('User created in LearnWorlds:', { email, userId: userData.id })
        return userData
      } catch (parseError) {
        console.error('Failed to parse user creation response:', { responseText, parseError })
        throw new Error(`Invalid JSON response from user creation: ${responseText.substring(0, 200)}`)
      }
    } else if (response.status === 401 || response.status === 403) {
      console.error('Authentication failed during user creation:', {
        status: response.status,
        statusText: response.statusText,
        responseText: responseText.substring(0, 200)
      })
      throw new Error(`User creation authentication failed: ${response.status} - Check API credentials`)
    } else {
      console.error('User creation API error:', {
        status: response.status,
        statusText: response.statusText,
        responseText: responseText.substring(0, 200)
      })
      throw new Error(`Failed to create user: ${response.status} - ${response.statusText}`)
    }
  } catch (error) {
    console.error('Error in createUser:', error)
    throw error
  }
}

// Enroll user in course/bundle
async function enrollUser(
  email: string, 
  enrollmentData: EnrollmentData
): Promise<boolean> {
  try {
    const url = `${LEARNWORLDS_API_URL}/users/${encodeURIComponent(email)}/enrollment`
    
    console.log('Enrolling user:', { 
      url, 
      email, 
      productId: enrollmentData.productId,
      productType: enrollmentData.productType
    })
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': LEARNWORLDS_AUTH_HEADER,
        'Lw-Client': LEARNWORLDS_CLIENT_HEADER,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(enrollmentData)
    })

    console.log('Enrollment response:', {
      status: response.status,
      statusText: response.statusText,
      contentType: response.headers.get('content-type')
    })

    if (response.ok) {
      const responseText = await response.text()
      console.log('Raw enrollment response:', responseText)
      
      if (!responseText.trim()) {
        console.log('Empty enrollment response - assuming success')
        return true
      }
      
      try {
        const result = JSON.parse(responseText)
        console.log('Enrollment successful:', {
          email,
          productId: enrollmentData.productId,
          productType: enrollmentData.productType,
          success: result.success
        })
        return result.success === true
      } catch (parseError) {
        console.log('Could not parse enrollment response, but got 200 status - assuming success')
        return true
      }
    } else {
      const errorText = await response.text().catch(() => 'Unable to read error response')
      console.error('Error enrolling user:', {
        status: response.status,
        statusText: response.statusText,
        errorText,
        email,
        enrollmentData
      })
      throw new Error(`Failed to enroll user: ${response.status} - ${errorText}`)
    }
  } catch (error) {
    console.error('Error in enrollUser:', error)
    throw error
  }
}

// Complete enrollment process
async function processEnrollment(session: Stripe.Checkout.Session): Promise<void> {
  const userEmail = session.metadata?.userEmail
  const userName = session.metadata?.userName || 'User'
  const enrollmentIds = session.metadata?.enrollmentIds
  const courseCategories = session.metadata?.courseCategories

  if (!userEmail || !enrollmentIds) {
    throw new Error('Missing required enrollment data')
  }

  let parsedEnrollmentIds: string[]
  let parsedCategories: string[]

  try {
    parsedEnrollmentIds = JSON.parse(enrollmentIds)
    parsedCategories = JSON.parse(courseCategories || '[]')
  } catch (error) {
    throw new Error('Failed to parse enrollment data')
  }

  // Step 1: Check if user exists, create if not
  let user = await checkUserExists(userEmail)
  if (!user) {
    user = await createUser(userEmail, userName)
  }

  // Step 2: Enroll in all courses/bundles
  const enrollmentPromises = parsedEnrollmentIds.map(async (enrollmentId, index) => {
    const category = parsedCategories[index] || 'course'
    const productType = category === 'bundle' ? 'bundle' : 'course'
    
    const enrollmentData: EnrollmentData = {
      productId: enrollmentId,
      productType: productType,
      justification: 'Added by admin - Stripe payment completed',
      price: session.amount_total ? session.amount_total / 100 : 0, // Convert from cents
      send_enrollment_email: true
    }

    return enrollUser(userEmail, enrollmentData)
  })

  // Wait for all enrollments to complete
  const enrollmentResults = await Promise.allSettled(enrollmentPromises)
  
  // Log results
  const successCount = enrollmentResults.filter(result => 
    result.status === 'fulfilled' && result.value === true
  ).length

  const failureCount = enrollmentResults.length - successCount

  console.log('Enrollment process completed:', {
    sessionId: session.id,
    userEmail,
    totalCourses: parsedEnrollmentIds.length,
    successful: successCount,
    failed: failureCount
  })

  // Log any failures
  enrollmentResults.forEach((result, index) => {
    if (result.status === 'rejected') {
      console.error(`Enrollment failed for ${parsedEnrollmentIds[index]}:`, result.reason)
    }
  })

  if (failureCount > 0) {
    throw new Error(`${failureCount} out of ${enrollmentResults.length} enrollments failed`)
  }
}

export async function POST(req: NextRequest): Promise<NextResponse<WebhookResponse>> {
  let body: string
  let signature: string | null

  try {
    // Get the raw body and signature
    body = await req.text()
    signature = req.headers.get('stripe-signature')

    if (!signature) {
      console.error('Missing Stripe signature in webhook request')
      return NextResponse.json(
        { error: 'Missing Stripe signature' },
        { status: 400 }
      )
    }

    if (!process.env.STRIPE_WEBHOOK_SECRET) {
      console.error('STRIPE_WEBHOOK_SECRET not configured')
      return NextResponse.json(
        { error: 'Webhook secret not configured' },
        { status: 500 }
      )
    }

    // Check LearnWorlds API configuration
    if (!LEARNWORLDS_AUTH_HEADER || !LEARNWORLDS_CLIENT_HEADER) {
      console.error('LearnWorlds API credentials not configured')
      return NextResponse.json(
        { error: 'LearnWorlds API not configured' },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('Error reading webhook request:', error)
    return NextResponse.json(
      { error: 'Invalid request' },
      { status: 400 }
    )
  }

  // Verify webhook signature
  let event: Stripe.Event
  const stripe = getServerStripe()

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    )
  } catch (error) {
    console.error('Webhook signature verification failed:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      signature: signature?.slice(0, 20) + '...',
    })
    
    return NextResponse.json(
      { error: 'Invalid signature' },
      { status: 400 }
    )
  }

  // Process webhook events
  try {
    console.log(`Processing webhook event: ${event.type} (${event.id})`)

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        
        // Validate required data
        if (!session.metadata?.userEmail || !session.metadata?.enrollmentIds) {
          console.error('Missing required metadata in session:', {
            sessionId: session.id,
            hasUserEmail: !!session.metadata?.userEmail,
            hasEnrollmentIds: !!session.metadata?.enrollmentIds,
          })
          break
        }

        console.log('Payment successful - processing enrollment:', {
          sessionId: session.id,
          userEmail: session.metadata.userEmail,
          userName: session.metadata.userName,
          amountTotal: session.amount_total,
          currency: session.currency,
          paymentStatus: session.payment_status,
        })

        try {
          await processEnrollment(session)
          console.log('Enrollment process completed successfully')
        } catch (enrollmentError) {
          console.error('Enrollment process failed:', {
            sessionId: session.id,
            error: enrollmentError instanceof Error ? enrollmentError.message : 'Unknown error'
          })
          // Don't fail the webhook - log the error for manual review
        }

        break
      }

      case 'checkout.session.expired': {
        const session = event.data.object as Stripe.Checkout.Session
        
        console.log('Checkout session expired:', {
          sessionId: session.id,
          userEmail: session.metadata?.userEmail,
          createdAt: new Date(session.created * 1000).toISOString(),
        })

        // TODO: Clean up any temporary data or send abandonment email
        break
      }

      case 'checkout.session.async_payment_succeeded': {
        const session = event.data.object as Stripe.Checkout.Session
        
        console.log('Async payment succeeded:', {
          sessionId: session.id,
          userEmail: session.metadata?.userEmail,
        })

        // Handle delayed payment success (e.g., bank transfers)
        try {
          await processEnrollment(session)
          console.log('Async enrollment process completed successfully')
        } catch (enrollmentError) {
          console.error('Async enrollment process failed:', enrollmentError)
        }
        break
      }

      case 'checkout.session.async_payment_failed': {
        const session = event.data.object as Stripe.Checkout.Session
        
        console.log('Async payment failed:', {
          sessionId: session.id,
          userEmail: session.metadata?.userEmail,
        })

        // TODO: Notify user and handle failed payment
        break
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        
        console.log('Payment failed:', {
          paymentIntentId: paymentIntent.id,
          userEmail: paymentIntent.metadata?.userEmail,
          lastPaymentError: paymentIntent.last_payment_error,
        })

        // TODO: Log failure and potentially notify user
        break
      }

      case 'invoice.payment_succeeded': {
        // Handle successful recurring payments (if you add subscriptions later)
        const invoice = event.data.object as Stripe.Invoice
        console.log('Invoice payment succeeded:', invoice.id)
        break
      }

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ 
      received: true,
      eventId: event.id,
      eventType: event.type 
    })

  } catch (error) {
    console.error('Webhook processing error:', {
      eventId: event.id,
      eventType: event.type,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    })
    
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}

// Only allow POST requests
export async function GET(): Promise<NextResponse> {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  )
}

export async function PUT(): Promise<NextResponse> {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  )
}

export async function DELETE(): Promise<NextResponse> {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  )
}