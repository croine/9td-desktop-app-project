import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { licenseKeys } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { randomBytes } from 'crypto';

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
    const { email, sendEmail } = body;

    // Validate required field
    if (!email) {
      return NextResponse.json(
        { 
          error: 'Email is required',
          code: 'MISSING_EMAIL'
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

    // Check if email already has a pending key
    const existingKeys = await db
      .select()
      .from(licenseKeys)
      .where(
        and(
          eq(licenseKeys.email, sanitizedEmail),
          eq(licenseKeys.status, 'pending')
        )
      );

    const now = new Date();

    // If pending key exists, check if expired
    if (existingKeys.length > 0) {
      const existingKey = existingKeys[0];
      const expiresAt = new Date(existingKey.expiresAt);

      // If key is not expired, return existing key
      if (expiresAt > now) {
        return NextResponse.json({
          success: true,
          key: existingKey.key,
          email: existingKey.email,
          expiresAt: existingKey.expiresAt
        });
      }

      // If key is expired, delete it
      await db
        .delete(licenseKeys)
        .where(eq(licenseKeys.id, existingKey.id));
    }

    // Generate new license key
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

    // Calculate expiration date (7 days from now)
    const expiresAt = new Date(now.getTime() + 604800000); // 7 days in milliseconds

    // Insert new license key
    const newLicenseKey = await db
      .insert(licenseKeys)
      .values({
        key: newKey!,
        email: sanitizedEmail,
        status: 'pending',
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

    // TODO: If sendEmail is true, implement email sending logic here
    // This would typically integrate with an email service like SendGrid, Resend, etc.

    return NextResponse.json(
      {
        success: true,
        key: createdKey.key,
        email: createdKey.email,
        expiresAt: createdKey.expiresAt
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error')
      },
      { status: 500 }
    );
  }
}