import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { user, account, licenseKeys, session } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import crypto from 'crypto';

type SignInMethod = 'email' | 'username';

interface EmailPasswordRequest {
  method: 'email';
  email: string;
  password: string;
  licenseKey: string;
}

interface UsernamePasswordRequest {
  method: 'username';
  username: string;
  password: string;
  licenseKey: string;
}

type SignInRequest = EmailPasswordRequest | UsernamePasswordRequest;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as SignInRequest;

    // Validate method field
    if (!body.method || !['email', 'username'].includes(body.method)) {
      return NextResponse.json({
        error: 'Invalid or missing authentication method',
        code: 'INVALID_METHOD'
      }, { status: 400 });
    }

    let authenticatedUser: typeof user.$inferSelect | null = null;

    // EMAIL + PASSWORD + LICENSE KEY AUTHENTICATION
    if (body.method === 'email') {
      const { email: rawEmail, password, licenseKey } = body as EmailPasswordRequest;

      // Validate all required fields
      if (!rawEmail || typeof rawEmail !== 'string' || rawEmail.trim() === '') {
        return NextResponse.json({
          error: 'Email is required',
          code: 'MISSING_EMAIL'
        }, { status: 400 });
      }

      if (!password || typeof password !== 'string' || password === '') {
        return NextResponse.json({
          error: 'Password is required',
          code: 'MISSING_PASSWORD'
        }, { status: 400 });
      }

      if (!licenseKey || typeof licenseKey !== 'string' || licenseKey.trim() === '') {
        return NextResponse.json({
          error: 'License key is required',
          code: 'MISSING_LICENSE_KEY'
        }, { status: 400 });
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(rawEmail.trim())) {
        return NextResponse.json({
          error: 'Invalid email format',
          code: 'INVALID_EMAIL_FORMAT'
        }, { status: 400 });
      }

      // Normalize email
      const normalizedEmail = rawEmail.trim().toLowerCase();

      // Query user by email
      const userData = await db.select()
        .from(user)
        .where(eq(user.email, normalizedEmail))
        .limit(1);

      if (userData.length === 0) {
        return NextResponse.json({
          error: 'Invalid credentials or license key',
          code: 'INVALID_CREDENTIALS'
        }, { status: 401 });
      }

      const foundUser = userData[0];

      // Query account with credential provider
      const accountData = await db.select()
        .from(account)
        .where(
          and(
            eq(account.userId, foundUser.id),
            eq(account.providerId, 'credential')
          )
        )
        .limit(1);

      if (accountData.length === 0) {
        return NextResponse.json({
          error: 'Invalid credentials or license key',
          code: 'INVALID_CREDENTIALS'
        }, { status: 401 });
      }

      const foundAccount = accountData[0];

      // Verify password (plain text comparison)
      if (foundAccount.password !== password) {
        return NextResponse.json({
          error: 'Invalid credentials or license key',
          code: 'INVALID_CREDENTIALS'
        }, { status: 401 });
      }

      // Verify license key
      const licenseKeyRecord = await db.select()
        .from(licenseKeys)
        .where(eq(licenseKeys.key, licenseKey.trim()))
        .limit(1);

      if (licenseKeyRecord.length === 0) {
        return NextResponse.json({
          error: 'Invalid credentials or license key',
          code: 'INVALID_CREDENTIALS'
        }, { status: 401 });
      }

      const licenseData = licenseKeyRecord[0];

      // Verify license key belongs to this user
      if (licenseData.userId !== foundUser.id) {
        return NextResponse.json({
          error: 'Invalid credentials or license key',
          code: 'INVALID_CREDENTIALS'
        }, { status: 401 });
      }

      // Verify license key status
      if (licenseData.status !== 'active') {
        return NextResponse.json({
          error: 'License key is not active',
          code: 'INVALID_LICENSE_KEY'
        }, { status: 401 });
      }

      // Verify license key is not expired
      const now = new Date();
      if (licenseData.expiresAt && new Date(licenseData.expiresAt) <= now) {
        return NextResponse.json({
          error: 'License key has expired',
          code: 'EXPIRED_LICENSE_KEY'
        }, { status: 401 });
      }

      authenticatedUser = foundUser;
    }

    // USERNAME + PASSWORD + LICENSE KEY AUTHENTICATION
    else if (body.method === 'username') {
      const { username: rawUsername, password, licenseKey } = body as UsernamePasswordRequest;

      // Validate all required fields
      if (!rawUsername || typeof rawUsername !== 'string' || rawUsername.trim() === '') {
        return NextResponse.json({
          error: 'Username is required',
          code: 'MISSING_USERNAME'
        }, { status: 400 });
      }

      if (!password || typeof password !== 'string' || password === '') {
        return NextResponse.json({
          error: 'Password is required',
          code: 'MISSING_PASSWORD'
        }, { status: 400 });
      }

      if (!licenseKey || typeof licenseKey !== 'string' || licenseKey.trim() === '') {
        return NextResponse.json({
          error: 'License key is required',
          code: 'MISSING_LICENSE_KEY'
        }, { status: 400 });
      }

      // Validate username format (alphanumeric, underscore, hyphen, 3-20 chars)
      const usernameRegex = /^[a-zA-Z0-9_-]{3,20}$/;
      if (!usernameRegex.test(rawUsername.trim())) {
        return NextResponse.json({
          error: 'Invalid username format. Username must be 3-20 characters and contain only letters, numbers, underscores, and hyphens',
          code: 'INVALID_USERNAME_FORMAT'
        }, { status: 400 });
      }

      // Normalize username
      const normalizedUsername = rawUsername.trim().toLowerCase();

      // Query user by username
      const userData = await db.select()
        .from(user)
        .where(eq(user.username, normalizedUsername))
        .limit(1);

      if (userData.length === 0) {
        return NextResponse.json({
          error: 'Invalid credentials or license key',
          code: 'INVALID_CREDENTIALS'
        }, { status: 401 });
      }

      const foundUser = userData[0];

      // Query account with credential provider
      const accountData = await db.select()
        .from(account)
        .where(
          and(
            eq(account.userId, foundUser.id),
            eq(account.providerId, 'credential')
          )
        )
        .limit(1);

      if (accountData.length === 0) {
        return NextResponse.json({
          error: 'Invalid credentials or license key',
          code: 'INVALID_CREDENTIALS'
        }, { status: 401 });
      }

      const foundAccount = accountData[0];

      // Verify password (plain text comparison)
      if (foundAccount.password !== password) {
        return NextResponse.json({
          error: 'Invalid credentials or license key',
          code: 'INVALID_CREDENTIALS'
        }, { status: 401 });
      }

      // Verify license key
      const licenseKeyRecord = await db.select()
        .from(licenseKeys)
        .where(eq(licenseKeys.key, licenseKey.trim()))
        .limit(1);

      if (licenseKeyRecord.length === 0) {
        return NextResponse.json({
          error: 'Invalid credentials or license key',
          code: 'INVALID_CREDENTIALS'
        }, { status: 401 });
      }

      const licenseData = licenseKeyRecord[0];

      // Verify license key belongs to this user
      if (licenseData.userId !== foundUser.id) {
        return NextResponse.json({
          error: 'Invalid credentials or license key',
          code: 'INVALID_CREDENTIALS'
        }, { status: 401 });
      }

      // Verify license key status
      if (licenseData.status !== 'active') {
        return NextResponse.json({
          error: 'License key is not active',
          code: 'INVALID_LICENSE_KEY'
        }, { status: 401 });
      }

      // Verify license key is not expired
      const now = new Date();
      if (licenseData.expiresAt && new Date(licenseData.expiresAt) <= now) {
        return NextResponse.json({
          error: 'License key has expired',
          code: 'EXPIRED_LICENSE_KEY'
        }, { status: 401 });
      }

      authenticatedUser = foundUser;
    }

    // If no user was authenticated, return error
    if (!authenticatedUser) {
      return NextResponse.json({
        error: 'Authentication failed',
        code: 'AUTHENTICATION_FAILED'
      }, { status: 401 });
    }

    // CREATE SESSION
    // Generate unique session token
    const sessionToken = crypto.randomBytes(32).toString('hex');

    // Generate unique session ID
    const sessionId = 'session_' + crypto.randomBytes(16).toString('hex');

    // Set expiration to 30 days from now
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    // Extract IP address from request headers
    const ipAddress = request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
      request.headers.get('x-real-ip') ||
      null;

    // Extract user agent
    const userAgent = request.headers.get('user-agent') || null;

    // Insert session into database
    const newSession = await db.insert(session)
      .values({
        id: sessionId,
        token: sessionToken,
        userId: authenticatedUser.id,
        expiresAt: expiresAt,
        ipAddress: ipAddress,
        userAgent: userAgent,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();

    if (newSession.length === 0) {
      return NextResponse.json({
        error: 'Failed to create session',
        code: 'SESSION_CREATION_FAILED'
      }, { status: 500 });
    }

    // Return success response
    return NextResponse.json({
      success: true,
      session: {
        token: sessionToken,
        expiresAt: expiresAt.toISOString()
      },
      user: {
        id: authenticatedUser.id,
        name: authenticatedUser.name,
        email: authenticatedUser.email,
        username: authenticatedUser.username,
        emailVerified: authenticatedUser.emailVerified,
        image: authenticatedUser.image
      }
    }, { status: 201 });

  } catch (error) {
    console.error('POST sign-in error:', error);
    return NextResponse.json({
      error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error')
    }, { status: 500 });
  }
}