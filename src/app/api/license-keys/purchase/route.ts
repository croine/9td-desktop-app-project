import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { licenseKeys } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { randomBytes } from 'crypto';
import Stripe from 'stripe';

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-11-20.acacia',
});

// Generate cryptographically secure license key in format XXXX-XXXX-XXXX-XXXX
function generateLicenseKey(): string {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const segments = 4;
  const segmentLength = 4;
  const keySegments: string[] = [];

  for (let i = 0; i < segments; i++) {
    let segment = '';
    const randomBytesArray = randomBytes(segmentLength);
    
    for (let j = 0; j < segmentLength; j++) {
      const randomIndex = randomBytesArray[j] % characters.length;
      segment += characters[randomIndex];
    }
    
    keySegments.push(segment);
  }

  return keySegments.join('-');
}

// Validate email format
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, name, returnUrl } = body;

    // Validate required fields
    if (!email || !name) {
      return NextResponse.json(
        { 
          error: 'Email and name are required',
          code: 'MISSING_FIELDS'
        },
        { status: 400 }
      );
    }

    // Validate email format
    if (typeof email !== 'string' || !isValidEmail(email.trim())) {
      return NextResponse.json(
        { 
          error: 'Invalid email format',
          code: 'INVALID_EMAIL'
        },
        { status: 400 }
      );
    }

    const sanitizedEmail = email.trim().toLowerCase();
    const sanitizedName = name.trim();

    // Generate license key now (we'll mark it as pending until payment)
    let newKey: string;
    let keyIsUnique = false;
    let attempts = 0;
    const maxAttempts = 10;

    // Ensure key is unique (collision handling)
    while (!keyIsUnique && attempts < maxAttempts) {
      newKey = generateLicenseKey();
      
      const existingKey = await db
        .select()
        .from(licenseKeys)
        .where(eq(licenseKeys.key, newKey))
        .limit(1);

      if (existingKey.length === 0) {
        keyIsUnique = true;
      }
      
      attempts++;
    }

    if (!keyIsUnique) {
      return NextResponse.json(
        { 
          error: 'Failed to generate unique key. Please try again.',
          code: 'KEY_GENERATION_FAILED'
        },
        { status: 500 }
      );
    }

    // Calculate expiration date (7 days from activation)
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 604800000); // 7 days in milliseconds

    // Create pending license key in database
    const newLicenseKey = await db
      .insert(licenseKeys)
      .values({
        key: newKey!,
        email: sanitizedEmail,
        status: 'pending_payment', // New status for unpaid keys
        expiresAt: expiresAt,
        activatedAt: null,
        userId: null,
        createdAt: now,
        updatedAt: now
      })
      .returning();

    if (newLicenseKey.length === 0) {
      return NextResponse.json(
        { 
          error: 'Failed to create license key',
          code: 'INSERT_FAILED'
        },
        { status: 500 }
      );
    }

    const createdKey = newLicenseKey[0];

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: '9TD License Key',
              description: 'One-time license key for full premium access (valid for 7 days)',
              images: [],
            },
            unit_amount: 4900, // $49.00 in cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      customer_email: sanitizedEmail,
      success_url: returnUrl || `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/pricing?tab=license&success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: returnUrl || `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/pricing?tab=license&canceled=true`,
      metadata: {
        license_key: createdKey.key,
        customer_name: sanitizedName,
        customer_email: sanitizedEmail,
        type: 'license_key_purchase',
      },
    });

    return NextResponse.json(
      {
        success: true,
        checkoutUrl: session.url,
        sessionId: session.id,
        message: 'Stripe checkout session created successfully'
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('POST error:', error);
    
    // Handle Stripe-specific errors
    if (error instanceof Stripe.errors.StripeError) {
      return NextResponse.json(
        { 
          error: 'Payment processing error: ' + error.message,
          code: 'STRIPE_ERROR'
        },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { 
        error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error')
      },
      { status: 500 }
    );
  }
}