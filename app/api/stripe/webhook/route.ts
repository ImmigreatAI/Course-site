// app/api/stripe/webhook/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerStripe } from '@/lib/stripe/config'
import { databaseService } from '@/lib/services/database.service'
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

// Rate limiting configuration
const LEARNWORLDS_API_DELAY_MS = 500 // 0.5 seconds between API calls

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

// Helper function to add delay
async function delayForRateLimit() {
  console.log(`⏱️  Waiting ${LEARNWORLDS_API_DELAY_MS}ms for rate limiting...`)
  await new Promise(resolve => setTimeout(resolve, LEARNWORLDS_API_DELAY_MS))
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
    
    // For free courses, always include price: 0 (LearnWorlds requires it)
    const requestBody = { ...enrollmentData }
    if (enrollmentData.price === 0) {
      console.log('🆓 Processing free course enrollment with price: 0')
      requestBody.price = 0 // Ensure price is explicitly 0
    }
    
    console.log('Enrolling user:', { 
      url, 
      email, 
      requestBody,
      isFree: enrollmentData.price === 0
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

    console.log('Enrollment response:', {
      status: response.status,
      statusText: response.statusText,
      contentType: response.headers.get('content-type')
    })

    // Read response text once and store it
    const responseText = await response.text()
    console.log('Raw enrollment response:', {
      status: response.status,
      responseLength: responseText.length,
      responsePreview: responseText.substring(0, 200)
    })

    if (response.ok) {
      if (!responseText.trim()) {
        console.log('Empty enrollment response but 200 status - assuming success')
        return true
      }
      
      try {
        const result = JSON.parse(responseText)
        console.log('Enrollment successful:', {
          email,
          productId: enrollmentData.productId,
          productType: enrollmentData.productType,
          success: result.success,
          result
        })
        return result.success === true
      } catch {
        console.log('Could not parse enrollment response, but got 200 status - assuming success')
        return true
      }
    } else {
      // Handle specific error cases
      let errorMessage = responseText
      
      try {
        const errorJson = JSON.parse(responseText)
        errorMessage = errorJson.error || errorJson.message || responseText
        
        // Handle "already owned" as success (user already has the course)
        if (errorMessage.includes('already owned') || errorMessage.includes('Product is already owned')) {
          console.log('⚠️ Course already owned by user - treating as success')
          return true
        }
      } catch {
        // Use raw response text as error message
      }
      
      console.error('Enrollment API error:', {
        status: response.status,
        statusText: response.statusText,
        errorMessage: errorMessage.substring(0, 500),
        email,
        enrollmentData
      })
      
      throw new Error(`Failed to enroll user: ${response.status} - ${errorMessage}`)
    }
  } catch (error) {
    console.error('Error in enrollUser:', error)
    throw error
  }
}

// Complete enrollment process with database operations
async function processEnrollment(session: Stripe.Checkout.Session): Promise<void> {
  console.log('\n🚀 === STARTING ENROLLMENT PROCESS ===')
  
  const userEmail = session.metadata?.userEmail
  const userName = session.metadata?.userName || 'User'
  const enrollmentIds = session.metadata?.enrollmentIds
  const courseCategories = session.metadata?.courseCategories
  const coursePrices = session.metadata?.coursePrices
  const courseNames = session.metadata?.courseNames
  const planLabels = session.metadata?.planLabels
  const stripePriceIds = session.metadata?.stripePriceIds
  const enrollmentUrls = session.metadata?.enrollmentUrls
  const clerkUserId = session.metadata?.userId

  console.log('📋 Session metadata extracted:', {
    userEmail,
    userName,
    enrollmentIds,
    courseCategories,
    coursePrices,
    courseNames,
    sessionId: session.id,
    amountTotal: session.amount_total,
    clerkUserId
  })

  if (!userEmail || !enrollmentIds || !clerkUserId) {
    console.log('❌ MISSING REQUIRED DATA:', { 
      hasEmail: !!userEmail, 
      hasEnrollmentIds: !!enrollmentIds,
      hasClerkUserId: !!clerkUserId 
    })
    throw new Error('Missing required enrollment data')
  }

  let parsedEnrollmentIds: string[]
  let parsedCategories: string[]
  let parsedPrices: number[]
  let parsedNames: string[]
  let parsedPlanLabels: string[]
  let parsedStripePriceIds: string[]
  let parsedEnrollmentUrls: string[]

  try {
    parsedEnrollmentIds = JSON.parse(enrollmentIds)
    parsedCategories = JSON.parse(courseCategories || '[]')
    parsedPrices = JSON.parse(coursePrices || '[]')
    parsedNames = JSON.parse(courseNames || '[]')
    parsedPlanLabels = JSON.parse(planLabels || '[]')
    parsedStripePriceIds = JSON.parse(stripePriceIds || '[]')
    parsedEnrollmentUrls = JSON.parse(enrollmentUrls || '[]')
    
    console.log('✅ Parsed enrollment data:', {
      enrollmentIds: parsedEnrollmentIds,
      categories: parsedCategories,
      individualPrices: parsedPrices,
      courseNames: parsedNames,
      planLabels: parsedPlanLabels,
      totalCourses: parsedEnrollmentIds.length
    })
  } catch (error) {
    console.log('❌ FAILED TO PARSE ENROLLMENT DATA:', error)
    throw new Error('Failed to parse enrollment data')
  }

  // === DATABASE OPERATIONS START ===
  console.log('\n💾 === DATABASE OPERATIONS PHASE ===')
  
  try {
    // Get or create user in database
    console.log('🔍 Checking user in database...')
    let dbUser = await databaseService.getUserByClerkId(clerkUserId)
    
    if (!dbUser) {
      console.log('📝 Creating user in database...')
      dbUser = await databaseService.createOrUpdateUser({
        clerk_user_id: clerkUserId,
        email: userEmail,
        full_name: userName,
        username: userName
      })
      console.log('✅ User created in database:', dbUser.id)
    } else {
      console.log('✅ User found in database:', dbUser.id)
    }

    // Create purchase record
    console.log('💳 Creating purchase record...')
    const purchase = await databaseService.createPurchase({
      user_id: dbUser.id,
      stripe_session_id: session.id,
      stripe_payment_intent_id: session.payment_intent as string | null,
      amount: session.amount_total || 0,
      currency: session.currency || 'usd'
    })
    console.log('✅ Purchase record created:', purchase.id)

    // Create purchase items
    console.log('📦 Creating purchase items...')
    const purchaseItemsData = parsedEnrollmentIds.map((enrollmentId, i) => ({
      course_id: enrollmentId,
      course_name: parsedNames[i] || 'Unknown Course',
      plan_label: (parsedPlanLabels[i] || '6mo') as '6mo' | '7day',
      price: parsedPrices[i] || 0,
      enrollment_id: enrollmentId,
      stripe_price_id: parsedStripePriceIds[i] || ''
    }))

    const purchaseItems = await databaseService.createPurchaseItems(purchase.id, purchaseItemsData)
    console.log('✅ Purchase items created:', purchaseItems.length)

    // === LEARNWORLDS ENROLLMENT START ===
    console.log(`\n👤 === USER MANAGEMENT PHASE ===`)
    console.log(`Checking if user exists in LearnWorlds: ${userEmail}`)

    // Step 1: Check if user exists in LearnWorlds, create if not
    let user = await checkUserExists(userEmail)
    
    // Add delay after user check API call
    await delayForRateLimit()
    
    if (!user) {
      console.log('⚠️  User does not exist in LearnWorlds, creating new user...')
      user = await createUser(userEmail, userName)
      console.log('✅ New user created successfully in LearnWorlds')
      
      // Add delay after user creation API call
      await delayForRateLimit()
      
      // Update database with LearnWorlds user ID
      if (user.id) {
        await databaseService.createOrUpdateUser({
          clerk_user_id: clerkUserId,
          email: userEmail,
          full_name: userName,
          username: userName,
          learnworlds_user_id: user.id
        })
        console.log('✅ Updated database with LearnWorlds user ID')
      }
    } else {
      console.log('✅ User already exists in LearnWorlds, proceeding with enrollment')
    }

    console.log(`\n📚 === COURSE ENROLLMENT PHASE ===`)
    console.log(`Total courses to enroll: ${parsedEnrollmentIds.length}`)

    // Step 2: Enroll in each course/bundle individually with correct individual prices
    const enrollmentResults: Array<{
      enrollmentId: string
      category: string
      success: boolean
      error?: string
      index: number
      originalPrice: number
      courseName: string
    }> = []

    for (let i = 0; i < parsedEnrollmentIds.length; i++) {
      const enrollmentId = parsedEnrollmentIds[i]
      const category = parsedCategories[i] || 'course'
      const originalPrice = parsedPrices[i] || 0
      const courseName = parsedNames[i] || 'Unknown Course'
      const productType = category === 'bundle' ? 'bundle' : 'course'
      const courseNumber = i + 1
      
      console.log(`\n📖 === ENROLLING COURSE ${courseNumber}/${parsedEnrollmentIds.length} ===`)
      console.log('Course details:', {
        enrollmentId,
        courseName,
        category,
        productType,
        originalPrice,
        index: i
      })

      const enrollmentData: EnrollmentData = {
        productId: enrollmentId,
        productType: productType,
        justification: 'Added by admin - Stripe payment completed',
        price: originalPrice, // Use ORIGINAL individual price, not divided amount
        send_enrollment_email: true
      }

      console.log('Enrollment data prepared with ORIGINAL PRICE:', {
        ...enrollmentData,
        priceType: typeof enrollmentData.price,
        isFree: enrollmentData.price === 0
      })

      try {
        console.log(`⏳ Starting enrollment for course ${courseNumber} with price ${originalPrice}...`)
        const success = await enrollUser(userEmail, enrollmentData)
        
        enrollmentResults.push({
          enrollmentId,
          category,
          success,
          index: i,
          originalPrice,
          courseName
        })
        
        if (success) {
          console.log(`✅ SUCCESS: Course ${courseNumber} "${courseName}" enrolled successfully at ${originalPrice}!`)
          
          // Create enrollment record in database
          const purchaseItem = purchaseItems[i]
          const enrollmentUrl = parsedEnrollmentUrls[i] || ''
          
          console.log('💾 Creating enrollment record in database...')
          await databaseService.createEnrollment({
            user_id: dbUser.id,
            purchase_item_id: purchaseItem.id,
            course_id: enrollmentId,
            course_name: courseName,
            course_url: enrollmentUrl,
            plan_label: parsedPlanLabels[i] || '6mo',
            learnworlds_enrollment_id: enrollmentId
          })
          console.log('✅ Enrollment record created in database')
        } else {
          console.log(`❌ FAILED: Course ${courseNumber} "${courseName}" enrollment returned false`)
        }

        // Add delay after each enrollment API call (even if it's the last one)
        await delayForRateLimit()

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        
        enrollmentResults.push({
          enrollmentId,
          category,
          success: false,
          error: errorMessage,
          index: i,
          originalPrice,
          courseName
        })
        
        console.log(`❌ ERROR: Course ${courseNumber} "${courseName}" enrollment failed with exception!`)
        console.log('Error details:', {
          enrollmentId,
          courseName,
          productType,
          originalPrice,
          userEmail,
          error: errorMessage,
          fullError: error
        })
        
        // Still add delay after failed enrollment to respect rate limits
        await delayForRateLimit()
      }
    }

    console.log(`\n📊 === ENROLLMENT SUMMARY ===`)
    
    // Summary of enrollment results
    const successCount = enrollmentResults.filter(result => result.success).length
    const failureCount = enrollmentResults.length - successCount
    const successfulEnrollments = enrollmentResults.filter(result => result.success)
    const failedEnrollments = enrollmentResults.filter(result => !result.success)

    console.log('Final enrollment results:', {
      sessionId: session.id,
      userEmail,
      totalCourses: parsedEnrollmentIds.length,
      successful: successCount,
      failed: failureCount,
      allResults: enrollmentResults.map(r => ({
        courseName: r.courseName,
        originalPrice: r.originalPrice,
        success: r.success,
        error: r.error
      }))
    })

    if (successfulEnrollments.length > 0) {
      console.log('✅ SUCCESSFUL ENROLLMENTS:')
      successfulEnrollments.forEach((result, index) => {
        console.log(`  ${index + 1}. "${result.courseName}" - ${result.originalPrice} (${result.category})`)
      })
    }

    if (failedEnrollments.length > 0) {
      console.log('❌ FAILED ENROLLMENTS:')
      failedEnrollments.forEach((result, index) => {
        console.log(`  ${index + 1}. "${result.courseName}" - ${result.originalPrice} (${result.category}) - Error: ${result.error || 'Unknown'}`)
      })
    }

    // Mark purchase as completed in database
    console.log('💾 Marking purchase as completed...')
    await databaseService.completePurchase(session.id)
    console.log('✅ Purchase marked as completed in database')

    if (failureCount > 0) {
      const errorMessage = `${failureCount} out of ${enrollmentResults.length} enrollments failed. Check logs for details.`
      console.log(`❌ ENROLLMENT PROCESS PARTIALLY FAILED: ${errorMessage}`)
      // Don't throw error - partial success is acceptable
    } else {
      console.log('🎉 === ALL COURSES ENROLLED AND SAVED TO DATABASE SUCCESSFULLY! ===\n')
    }

  } catch (databaseError) {
    console.error('❌ DATABASE OPERATION FAILED:', {
      error: databaseError instanceof Error ? databaseError.message : 'Unknown error',
      stack: databaseError instanceof Error ? databaseError.stack : undefined
    })
    throw databaseError
  }
}

export async function POST(req: NextRequest): Promise<NextResponse<WebhookResponse>> {
  let body: string
  let signature: string | null
  let event: Stripe.Event

  console.log('\n🔐 === WEBHOOK VERIFICATION PHASE ===')

  try {
    // Get the raw body and signature
    body = await req.text()
    signature = req.headers.get('stripe-signature')

    console.log('Webhook request received:', {
      hasBody: !!body,
      bodyLength: body.length,
      hasSignature: !!signature,
      signaturePreview: signature?.substring(0, 20) + '...',
      timestamp: new Date().toISOString()
    })

    if (!signature) {
      console.error('❌ VERIFICATION FAILED: Missing Stripe signature in webhook request')
      return NextResponse.json(
        { error: 'Missing Stripe signature' },
        { status: 400 }
      )
    }

    if (!process.env.STRIPE_WEBHOOK_SECRET) {
      console.error('❌ VERIFICATION FAILED: STRIPE_WEBHOOK_SECRET not configured')
      return NextResponse.json(
        { error: 'Webhook secret not configured' },
        { status: 500 }
      )
    }

    // Check LearnWorlds API configuration
    if (!LEARNWORLDS_AUTH_HEADER || !LEARNWORLDS_CLIENT_HEADER) {
      console.error('❌ VERIFICATION FAILED: LearnWorlds API credentials not configured')
      return NextResponse.json(
        { error: 'LearnWorlds API not configured' },
        { status: 500 }
      )
    }

    console.log('✅ All required configurations present')

  } catch (error) {
    console.error('❌ VERIFICATION FAILED: Error reading webhook request:', error)
    return NextResponse.json(
      { error: 'Invalid request' },
      { status: 400 }
    )
  }

  // Verify webhook signature
  const stripe = getServerStripe()

  try {
    console.log('🔍 Verifying Stripe webhook signature...')
    
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    )
    
    console.log('✅ WEBHOOK SIGNATURE VERIFIED SUCCESSFULLY')
    console.log('Verified event details:', {
      eventId: event.id,
      eventType: event.type,
      created: new Date(event.created * 1000).toISOString(),
      livemode: event.livemode
    })
    
  } catch (error) {
    console.error('❌ WEBHOOK SIGNATURE VERIFICATION FAILED:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      signature: signature?.slice(0, 20) + '...',
    })
    
    return NextResponse.json(
      { error: 'Invalid signature' },
      { status: 400 }
    )
  }

  // Process webhook events ONLY after successful verification
  try {
    console.log(`\n🎯 === PROCESSING VERIFIED EVENT: ${event.type} ===`)
    console.log('Event ID:', event.id)

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        
        console.log('\n💳 === CHECKOUT SESSION COMPLETED ===')
        console.log('Session details:', {
          sessionId: session.id,
          paymentStatus: session.payment_status,
          amountTotal: session.amount_total,
          currency: session.currency,
          customerEmail: session.customer_details?.email,
          mode: session.mode
        })
        
        // Validate required metadata
        if (!session.metadata?.userEmail || !session.metadata?.enrollmentIds) {
          console.error('❌ ENROLLMENT SKIPPED: Missing required metadata in session:', {
            sessionId: session.id,
            hasUserEmail: !!session.metadata?.userEmail,
            hasEnrollmentIds: !!session.metadata?.enrollmentIds,
            metadata: session.metadata
          })
          break
        }

        console.log('✅ Session metadata validation passed')
        console.log('Payment successful - starting enrollment process:', {
          sessionId: session.id,
          userEmail: session.metadata.userEmail,
          userName: session.metadata.userName,
          amountTotal: session.amount_total,
          currency: session.currency,
          paymentStatus: session.payment_status,
        })

        try {
          console.log('\n🚀 === STARTING ENROLLMENT PROCESS ===')
          await processEnrollment(session)
          console.log('✅ ENROLLMENT PROCESS COMPLETED SUCCESSFULLY')
        } catch (enrollmentError) {
          console.error('❌ ENROLLMENT PROCESS FAILED:', {
            sessionId: session.id,
            error: enrollmentError instanceof Error ? enrollmentError.message : 'Unknown error',
            stack: enrollmentError instanceof Error ? enrollmentError.stack : undefined
          })
          // Don't fail the webhook - log the error for manual review
        }

        break
      }

      case 'checkout.session.expired': {
        const session = event.data.object as Stripe.Checkout.Session
        
        console.log('\n⏰ === CHECKOUT SESSION EXPIRED ===')
        console.log('Expired session details:', {
          sessionId: session.id,
          userEmail: session.metadata?.userEmail,
          createdAt: new Date(session.created * 1000).toISOString(),
        })

        // TODO: Clean up any temporary data or send abandonment email
        break
      }

      case 'checkout.session.async_payment_succeeded': {
        const session = event.data.object as Stripe.Checkout.Session
        
        console.log('\n💰 === ASYNC PAYMENT SUCCEEDED ===')
        console.log('Async payment details:', {
          sessionId: session.id,
          userEmail: session.metadata?.userEmail,
        })

        // Handle delayed payment success (e.g., bank transfers)
        try {
          console.log('🚀 Starting enrollment for async payment...')
          await processEnrollment(session)
          console.log('✅ Async enrollment process completed successfully')
        } catch (enrollmentError) {
          console.error('❌ Async enrollment process failed:', enrollmentError)
        }
        break
      }

      case 'checkout.session.async_payment_failed': {
        const session = event.data.object as Stripe.Checkout.Session
        
        console.log('\n❌ === ASYNC PAYMENT FAILED ===')
        console.log('Failed async payment details:', {
          sessionId: session.id,
          userEmail: session.metadata?.userEmail,
        })

        // TODO: Notify user and handle failed payment
        break
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        
        console.log('\n💳❌ === PAYMENT INTENT FAILED ===')
        console.log('Failed payment details:', {
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
        console.log('\n📄✅ === INVOICE PAYMENT SUCCEEDED ===')
        console.log('Invoice payment details:', { invoiceId: invoice.id })
        break
      }

      default:
        console.log(`\n❓ === UNHANDLED EVENT TYPE: ${event.type} ===`)
        console.log(`\n❓ === UNHANDLED EVENT TYPE: ${event.type} ===`)
       console.log('Event will be acknowledged but not processed')
   }

   console.log('\n✅ === WEBHOOK PROCESSING COMPLETED SUCCESSFULLY ===')
   return NextResponse.json({ 
     received: true,
     eventId: event.id,
     eventType: event.type 
   })

 } catch (error) {
   console.error('\n❌ === WEBHOOK PROCESSING ERROR ===')
   console.error('Processing error details:', {
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