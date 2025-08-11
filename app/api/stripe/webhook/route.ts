// app/api/stripe/webhook/route.ts (SIMPLIFIED)
// ============================================
import { NextRequest, NextResponse } from 'next/server'
import { webhookService } from '@/lib/services/webhook.service'

// Use Node.js runtime for proper webhook handling
export const runtime = 'nodejs'

interface WebhookResponse {
  received?: boolean
  eventId?: string
  eventType?: string
  error?: string
}

export async function POST(req: NextRequest): Promise<NextResponse<WebhookResponse>> {
  console.log('\n🔐 === WEBHOOK REQUEST RECEIVED ===')
  
  try {
    // Get request body and signature
    const body = await req.text()
    const signature = req.headers.get('stripe-signature')
    
    console.log('Request details:', {
      hasBody: !!body,
      bodyLength: body.length,
      hasSignature: !!signature,
      timestamp: new Date().toISOString()
    })

    // Validate signature
    if (!signature) {
      console.error('❌ Missing Stripe signature')
      return NextResponse.json(
        { error: 'Missing Stripe signature' },
        { status: 400 }
      )
    }

    // Validate configuration
    if (!process.env.STRIPE_WEBHOOK_SECRET) {
      console.error('❌ STRIPE_WEBHOOK_SECRET not configured')
      return NextResponse.json(
        { error: 'Webhook secret not configured' },
        { status: 500 }
      )
    }

    if (!process.env.LEARNWORLDS_AUTH_TOKEN || !process.env.LEARNWORLDS_CLIENT_TOKEN) {
      console.error('❌ LearnWorlds credentials not configured')
      return NextResponse.json(
        { error: 'LearnWorlds API not configured' },
        { status: 500 }
      )
    }

    // Verify signature and get event
    const event = webhookService.verifySignature(body, signature)
    
    // Process the event
    await webhookService.handleEvent(event)
    
    console.log('\n✅ === WEBHOOK PROCESSED SUCCESSFULLY ===')
    
    return NextResponse.json({ 
      received: true,
      eventId: event.id,
      eventType: event.type 
    })

  } catch (error) {
    console.error('\n❌ === WEBHOOK ERROR ===')
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    })
    
    // Return appropriate error response
    if (error instanceof Error && error.message.includes('signature')) {
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}

// Block other HTTP methods
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