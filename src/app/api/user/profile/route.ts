import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { user, session } from '@/db/schema';
import { eq, and, ne } from 'drizzle-orm';

export async function PATCH(request: NextRequest) {
  try {
    // Extract bearer token from Authorization header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authentication required', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Query session table to get userId using the token
    const sessionRecord = await db
      .select()
      .from(session)
      .where(eq(session.token, token))
      .limit(1);

    if (sessionRecord.length === 0) {
      return NextResponse.json(
        { error: 'Authentication required', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const userId = sessionRecord[0].userId;

    // Parse request body
    const body = await request.json();
    const { name, email } = body;

    // Validate that at least one field is provided
    if (name === undefined && email === undefined) {
      return NextResponse.json(
        { error: 'At least one field (name or email) must be provided', code: 'NO_FIELDS_PROVIDED' },
        { status: 400 }
      );
    }

    // Validate name if provided
    if (name !== undefined) {
      const trimmedName = typeof name === 'string' ? name.trim() : '';
      if (!trimmedName) {
        return NextResponse.json(
          { error: 'Name must be a non-empty string', code: 'INVALID_NAME' },
          { status: 400 }
        );
      }
    }

    // Validate email if provided
    let trimmedEmail = '';
    if (email !== undefined) {
      trimmedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
      if (!trimmedEmail) {
        return NextResponse.json(
          { error: 'Email must be a non-empty string', code: 'INVALID_EMAIL' },
          { status: 400 }
        );
      }

      // Basic email format validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(trimmedEmail)) {
        return NextResponse.json(
          { error: 'Email must be a valid email format', code: 'INVALID_EMAIL_FORMAT' },
          { status: 400 }
        );
      }

      // Check if email is already taken by another user
      const existingUser = await db
        .select()
        .from(user)
        .where(and(eq(user.email, trimmedEmail), ne(user.id, userId)))
        .limit(1);

      if (existingUser.length > 0) {
        return NextResponse.json(
          { error: 'Email already in use', code: 'EMAIL_TAKEN' },
          { status: 409 }
        );
      }
    }

    // Build update object with only provided fields
    const updates: Record<string, any> = {
      updatedAt: new Date()
    };

    if (name !== undefined) {
      updates.name = name.trim();
    }

    if (email !== undefined) {
      updates.email = trimmedEmail;
    }

    // Update user table
    const updatedUser = await db
      .update(user)
      .set(updates)
      .where(eq(user.id, userId))
      .returning();

    if (updatedUser.length === 0) {
      return NextResponse.json(
        { error: 'User not found', code: 'USER_NOT_FOUND' },
        { status: 404 }
      );
    }

    // Return updated user object (excluding password-related fields)
    const { id, name: userName, email: userEmail, emailVerified, image, createdAt, updatedAt } = updatedUser[0];

    return NextResponse.json({
      id,
      name: userName,
      email: userEmail,
      emailVerified,
      image,
      createdAt,
      updatedAt
    }, { status: 200 });

  } catch (error: any) {
    console.error('PATCH /api/user/profile error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + error.message },
      { status: 500 }
    );
  }
}