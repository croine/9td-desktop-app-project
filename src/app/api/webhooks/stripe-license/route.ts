import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { db } from '@/db';
import { licenseKeys } from '@/db/schema';
import { eq } from 'drizzle-orm';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-11-20.acacia',
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET_LICENSE || '';

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!signature) {
      console.error('No stripe-signature header found');
      return NextResponse.json(
        { error: 'No stripe-signature header' },
        { status: 400 }
      );
    }

    if (!webhookSecret) {
      console.error('STRIPE_WEBHOOK_SECRET_LICENSE not configured');
      return NextResponse.json(
        { error: 'Webhook secret not configured' },
        { status: 500 }
      );
    }

    // Verify webhook signature
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return NextResponse.json(
        { error: 'Webhook signature verification failed' },
        { status: 400 }
      );
    }

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        
        // Check if this is a license key purchase
        if (session.metadata?.type === 'license_key_purchase') {
          const licenseKey = session.metadata.license_key;
          const customerEmail = session.metadata.customer_email;
          const customerName = session.metadata.customer_name;

          if (!licenseKey) {
            console.error('No license key in session metadata');
            break;
          }

          // Update license key status from pending_payment to pending (ready to activate)
          const updatedKeys = await db
            .update(licenseKeys)
            .set({
              status: 'pending',
              updatedAt: new Date(),
            })
            .where(eq(licenseKeys.key, licenseKey))
            .returning();

          if (updatedKeys.length === 0) {
            console.error('License key not found:', licenseKey);
            break;
          }

          // Send license key email
          try {
            const emailResponse = await fetch(
              `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/send-license-email`,
              {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  customerEmail: customerEmail,
                  customerName: customerName,
                  licenseKey: licenseKey,
                  productName: '9TD Task Management',
                }),
              }
            );

            if (!emailResponse.ok) {
              console.error('Failed to send license email:', await emailResponse.text());
            } else {
              console.log('License key email sent successfully to:', customerEmail);
            }
          } catch (emailError) {
            console.error('Error sending license email:', emailError);
          }

          console.log('License key activated after payment:', licenseKey);
        }
        break;
      }

      case 'checkout.session.expired': {
        const session = event.data.object as Stripe.Checkout.Session;
        
        // Clean up expired checkout sessions
        if (session.metadata?.type === 'license_key_purchase') {
          const licenseKey = session.metadata.license_key;
          
          if (licenseKey) {
            // Delete the pending license key if payment was never completed
            await db
              .delete(licenseKeys)
              .where(eq(licenseKeys.key, licenseKey));
            
            console.log('Deleted expired license key:', licenseKey);
          }
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}
