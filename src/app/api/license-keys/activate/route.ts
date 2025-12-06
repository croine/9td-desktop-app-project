import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { licenseKeys, user, account, verification } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { randomBytes } from 'crypto';
import { Resend } from 'resend';
import { render } from '@react-email/render';
import { VerificationEmail } from '@/components/emails/VerificationEmail';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { key, email, name, username, password } = body;

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

    // Validate username format if provided
    if (username && username.trim() !== '') {
      const usernameRegex = /^[a-zA-Z0-9_-]{3,20}$/;
      if (!usernameRegex.test(username.trim())) {
        return NextResponse.json(
          { 
            error: 'Invalid username format. Username must be 3-20 characters and contain only letters, numbers, underscores, and hyphens',
            code: 'INVALID_USERNAME_FORMAT' 
          },
          { status: 400 }
        );
      }

      // Check if username already exists
      const normalizedUsername = username.trim().toLowerCase();
      const existingUsername = await db
        .select()
        .from(user)
        .where(eq(user.username, normalizedUsername))
        .limit(1);

      if (existingUsername.length > 0) {
        return NextResponse.json(
          { error: 'Username already taken', code: 'USERNAME_TAKEN' },
          { status: 409 }
        );
      }
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

    // Create user account with emailVerified: false to trigger verification flow
    const newUsers = await db
      .insert(user)
      .values({
        id: userId,
        name: name.trim(),
        email: normalizedEmail,
        username: username && username.trim() !== '' ? username.trim().toLowerCase() : null,
        emailVerified: false, // Changed from true to false
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

    // Generate verification token
    const verificationToken = randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1); // Token expires in 1 hour

    // Create verification record
    await db
      .insert(verification)
      .values({
        id: 'verification_' + randomBytes(16).toString('hex'),
        identifier: normalizedEmail,
        value: verificationToken,
        expiresAt: expiresAt,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

    // Send verification email
    try {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      const verificationUrl = `${appUrl}/verify-email?token=${verificationToken}`;
      
      const emailHtml = render(
        VerificationEmail({
          name: name.trim(),
          verificationUrl,
        })
      );

      await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev',
        to: normalizedEmail,
        subject: '🎯 Verify your 9TD account',
        html: emailHtml,
        replyTo: process.env.RESEND_REPLY_TO,
      });

      console.log(`✅ Verification email sent to ${normalizedEmail}`);
    } catch (emailError) {
      console.error('❌ Failed to send verification email:', emailError);
      // Continue with registration even if email fails
    }

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
        requiresVerification: true, // Added flag
        user: {
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
          username: newUser.username,
        },
        message: 'Account created successfully. Please check your email to verify your account.',
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