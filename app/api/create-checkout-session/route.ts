import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe-server';
import { courseData } from '@/lib/courseData';
import { CheckoutSessionData, StripeMetadata } from '@/types';
import Stripe from 'stripe';

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body: CheckoutSessionData = await request.json();
    const { planId, courseId, userId, userEmail, userName } = body;
    
    const selectedPlan = courseData.plans.find(plan => plan.id === planId);
    
    if (!selectedPlan) {
      return NextResponse.json({ error: 'Invalid plan selected' }, { status: 400 });
    }

    const metadata: StripeMetadata = {
      userId,
      userEmail,
      userName,
      courseId,
      planId,
      planName: selectedPlan.name,
      planDuration: selectedPlan.duration.toString(),
      planDurationType: selectedPlan.durationType,
    };

    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      payment_method_types: ['card'],
      mode: 'payment',
      customer_email: userEmail,
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `${courseData.title} - ${selectedPlan.name}`,
              description: courseData.description,
            },
            unit_amount: selectedPlan.price * 100, // Stripe expects cents
          },
          quantity: 1,
        },
      ],
      metadata,
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/`,
    };

    const session = await stripe.checkout.sessions.create(sessionParams);

    return NextResponse.json({ sessionId: session.id });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('Checkout session creation failed:', errorMessage);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}