import { Webhook } from 'svix'
import { headers } from 'next/headers'
import { WebhookEvent } from '@clerk/nextjs/server'
import { databaseService } from '@/lib/services/database.service'

export async function POST(req: Request) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET

  if (!WEBHOOK_SECRET) {
    throw new Error('Please add CLERK_WEBHOOK_SECRET to .env.local')
  }

  // Get headers
  const headerPayload = await headers()
  const svix_id = headerPayload.get("svix-id")
  const svix_timestamp = headerPayload.get("svix-timestamp")
  const svix_signature = headerPayload.get("svix-signature")

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response('Error occured -- no svix headers', {
      status: 400
    })
  }

  // Get body
  const payload = await req.json()
  const body = JSON.stringify(payload)

  // Create Svix instance
  const wh = new Webhook(WEBHOOK_SECRET)

  let evt: WebhookEvent

  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent
  } catch (err) {
    console.error('Error verifying webhook:', err)
    return new Response('Error occured', {
      status: 400
    })
  }

  // Handle the webhook
  const eventType = evt.type

  if (eventType === 'user.created' || eventType === 'user.updated') {
    const { id, email_addresses, first_name, last_name, username } = evt.data

    const primaryEmail = email_addresses.find(email => email.id === evt.data.primary_email_address_id)

    if (primaryEmail) {
      try {
        await databaseService.createOrUpdateUser({
          clerk_user_id: id,
          email: primaryEmail.email_address,
          full_name: `${first_name || ''} ${last_name || ''}`.trim() || null,  // Ensure null not empty string
          username: username || null  // Ensure null not undefined
        })
        console.log(`User ${id} synced to database`)
      } catch (error) {
        console.error('Error syncing user to database:', error)
        return new Response('Database error', { status: 500 })
      }
    }
  }

  return new Response('', { status: 200 })
}