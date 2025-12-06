import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { licenseKeys, user, account } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { randomBytes } from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { key, email, name, password } = body;

    // Validate all required fields are present
    if (!key) {
      return NextResponse.json(
        { error: 'License key is required', code: 'MISSING_KEY' },
        { status: 400 }
      );
    }

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required', code: 'MISSING_EMAIL' },
        { status: 400 }
      );
    }

    if (!name) {
      return NextResponse.json(
        { error: 'Name is required', code: 'MISSING_NAME' },
        { status: 400 }
      );
    }

    if (!password) {
      return NextResponse.json(
        { error: 'Password is required', code: 'MISSING_PASSWORD' },
        { status: 400 }
      );
    }

    // Validate fields are non-empty
    if (key.trim() === '') {
      return NextResponse.json(
        { error: 'License key cannot be empty', code: 'EMPTY_KEY' },
        { status: 400 }
      );
    }

    if (email.trim() === '') {
      return NextResponse.json(
        { error: 'Email cannot be empty', code: 'EMPTY_EMAIL' },
        { status: 400 }
      );
    }

    if (name.trim() === '') {
      return NextResponse.json(
        { error: 'Name cannot be empty', code: 'EMPTY_NAME' },
        { status: 400 }
      );
    }

    if (password.trim() === '') {
      return NextResponse.json(
        { error: 'Password cannot be empty', code: 'EMPTY_PASSWORD' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format', code: 'INVALID_EMAIL_FORMAT' },
        { status: 400 }
      );
    }

    // Normalize email to lowercase
    const normalizedEmail = email.toLowerCase().trim();

    // Verify license key exists and get details
    const licenseKeyRecords = await db
      .select()
      .from(licenseKeys)
      .where(eq(licenseKeys.key, key.trim()))
      .limit(1);

    if (licenseKeyRecords.length === 0) {
      return NextResponse.json(
        { error: 'Invalid license key', code: 'INVALID_LICENSE_KEY' },
        { status: 400 }
      );
    }

    const licenseKey = licenseKeyRecords[0];

    // Verify license key status is "pending"
    if (licenseKey.status !== 'pending') {
      return NextResponse.json(
        {
          error: `License key is ${licenseKey.status}. Only pending keys can be activated.`,
          code: 'INVALID_KEY_STATUS',
        },
        { status: 400 }
      );
    }

    // Verify license key is not expired
    const now = new Date();
    if (licenseKey.expiresAt && new Date(licenseKey.expiresAt) <= now) {
      return NextResponse.json(
        { error: 'License key has expired', code: 'LICENSE_KEY_EXPIRED' },
        { status: 400 }
      );
    }

    // Verify email matches the key's email
    if (licenseKey.email.toLowerCase() !== normalizedEmail) {
      return NextResponse.json(
        {
          error: 'Email does not match the license key',
          code: 'EMAIL_MISMATCH',
        },
        { status: 400 }
      );
    }

    // Check if email already has a user account
    const existingUsers = await db
      .select()
      .from(user)
      .where(eq(user.email, normalizedEmail))
      .limit(1);

    if (existingUsers.length > 0) {
      return NextResponse.json(
        {
          error: 'An account with this email already exists',
          code: 'EMAIL_ALREADY_EXISTS',
        },
        { status: 409 }
      );
    }

    // Generate unique user ID
    const userId = 'user_' + randomBytes(16).toString('hex');

    // Create user account
    const newUsers = await db
      .insert(user)
      .values({
        id: userId,
        name: name.trim(),
        email: normalizedEmail,
        emailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    if (newUsers.length === 0) {
      return NextResponse.json(
        { error: 'Failed to create user account', code: 'USER_CREATION_FAILED' },
        { status: 500 }
      );
    }

    const newUser = newUsers[0];

    // Generate unique account ID
    const accountId = 'account_' + randomBytes(16).toString('hex');

    // Create account record
    await db
      .insert(account)
      .values({
        id: accountId,
        accountId: normalizedEmail,
        providerId: 'credential',
        userId: userId,
        password: password,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    // Update license key
    const updatedLicenseKeys = await db
      .update(licenseKeys)
      .set({
        userId: userId,
        status: 'active',
        activatedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(licenseKeys.id, licenseKey.id))
      .returning();

    if (updatedLicenseKeys.length === 0) {
      return NextResponse.json(
        {
          error: 'Failed to activate license key',
          code: 'LICENSE_ACTIVATION_FAILED',
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        user: {
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
        },
        message: 'Account activated successfully',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}