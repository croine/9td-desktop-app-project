import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { licenseKeys } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import crypto from 'crypto';

function generateLicenseKey(): string {
  const segments = [];
  for (let i = 0; i < 4; i++) {
    const segment = crypto.randomBytes(2).toString('hex').toUpperCase();
    segments.push(segment);
  }
  return segments.join('-');
}

function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    // Validate email is provided
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
    const trimmedEmail = email.trim().toLowerCase();
    if (!validateEmail(trimmedEmail)) {
      return NextResponse.json(
        { 
          error: 'Invalid email format',
          code: 'INVALID_EMAIL'
        },
        { status: 400 }
      );
    }

    // Query database for pending license key with matching email
    const existingKeys = await db.select()
      .from(licenseKeys)
      .where(
        and(
          eq(licenseKeys.email, trimmedEmail),
          eq(licenseKeys.status, 'pending')
        )
      )
      .limit(1);

    if (existingKeys.length === 0) {
      return NextResponse.json(
        { 
          success: false,
          error: 'No pending license key found for this email',
          code: 'KEY_NOT_FOUND'
        },
        { status: 404 }
      );
    }

    const existingKey = existingKeys[0];
    const now = new Date();
    const expiresAt = new Date(existingKey.expiresAt);

    // Check if the key has expired
    if (expiresAt < now) {
      // Delete the expired key
      await db.delete(licenseKeys)
        .where(eq(licenseKeys.id, existingKey.id));

      // Generate a new license key
      const newKey = generateLicenseKey();
      const newExpiresAt = new Date();
      newExpiresAt.setDate(newExpiresAt.getDate() + 7);

      const newLicenseKey = await db.insert(licenseKeys)
        .values({
          key: newKey,
          email: trimmedEmail,
          status: 'pending',
          expiresAt: newExpiresAt,
          createdAt: new Date(),
          updatedAt: new Date()
        })
        .returning();

      return NextResponse.json(
        {
          success: true,
          key: newLicenseKey[0].key,
          email: newLicenseKey[0].email,
          expiresAt: newLicenseKey[0].expiresAt,
          message: 'Previous license key expired. New key generated and will be sent to your email.'
        },
        { status: 200 }
      );
    }

    // Key is still valid, return existing key
    return NextResponse.json(
      {
        success: true,
        key: existingKey.key,
        email: existingKey.email,
        expiresAt: existingKey.expiresAt,
        message: 'License key resent to your email.'
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error: ' + (error as Error).message 
      },
      { status: 500 }
    );
  }
}