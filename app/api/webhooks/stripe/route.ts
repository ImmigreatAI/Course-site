import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe-server';
import { enrollUserInCourse } from '@/lib/learnworld';
import { StripeMetadata, CoursePlan } from '@/types';
import Stripe from 'stripe';

export async function POST(request: NextRequest): Promise<NextResponse> {
  console.log('🔔 Webhook received!');
  
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    console.error('❌ No Stripe signature found');
    return NextResponse.json({ error: 'No signature' }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
    console.log('✅ Webhook signature verified');
    console.log('📝 Event type:', event.type);
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    console.error('❌ Webhook signature verification failed:', errorMessage);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    console.log('🛒 Processing checkout.session.completed event');
    const session = event.data.object as Stripe.Checkout.Session;
    
    console.log('📋 Session metadata:', session.metadata);
    console.log('💰 Amount total:', session.amount_total);
    console.log('📧 Customer email:', session.customer_email);
    
    try {
      // Extract metadata with type safety
      const metadata = session.metadata as StripeMetadata;
      
      if (!metadata || !metadata.userId) {
        console.error('❌ Missing metadata in session');
        return NextResponse.json({ error: 'Missing metadata' }, { status: 400 });
      }
      
      const {
        userId,
        userEmail,
        courseId,
        planId,
        planDuration,
        planDurationType
      } = metadata;

      console.log('👤 Processing enrollment for:', {
        userId,
        userEmail,
        courseId,
        planId
      });

      // Prepare plan object for LearnWorld enrollment
      const plan: CoursePlan = {
        id: planId,
        name: metadata.planName,
        duration: parseInt(planDuration),
        durationType: planDurationType as 'days' | 'weeks' | 'months',
        price: (session.amount_total || 0) / 100, // Convert back from cents
        stripePriceId: '' // Not needed for enrollment
      };

      console.log('📚 Plan details:', plan);

      // Enroll user in LearnWorld
      console.log('🔄 Starting LearnWorld enrollment...');
      const enrollmentResult = await enrollUserInCourse(
        userId,
        userEmail,
        courseId,
        plan
      );

      if (enrollmentResult.success) {
        console.log('✅ User successfully enrolled in course:', userEmail);
        console.log('📊 Enrollment result:', enrollmentResult.data);
      } else {
        console.error('❌ Failed to enroll user in course:', enrollmentResult.error);
        // You might want to implement retry logic or manual intervention here
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('❌ Error processing successful payment:', errorMessage);
      console.error('📍 Full error:', error);
    }
  } else {
    console.log('ℹ️ Unhandled event type:', event.type);
  }

  return NextResponse.json({ received: true });
}