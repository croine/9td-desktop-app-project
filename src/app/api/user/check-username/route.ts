import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { user } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username } = body;

    // Validate username is provided
    if (!username || typeof username !== 'string' || username.trim() === '') {
      return NextResponse.json(
        {
          error: 'Username is required',
          code: 'MISSING_USERNAME'
        },
        { status: 400 }
      );
    }

    // Normalize username: trim and convert to lowercase
    const normalizedUsername = username.trim().toLowerCase();

    // Validate username format
    // Must be between 3 and 20 characters
    if (normalizedUsername.length < 3 || normalizedUsername.length > 20) {
      return NextResponse.json(
        {
          error: 'Username must be between 3 and 20 characters',
          code: 'INVALID_USERNAME_FORMAT'
        },
        { status: 400 }
      );
    }

    // Must contain only alphanumeric characters, underscores, and hyphens
    const validFormatRegex = /^[a-z0-9_-]+$/;
    if (!validFormatRegex.test(normalizedUsername)) {
      return NextResponse.json(
        {
          error: 'Username can only contain letters, numbers, underscores, and hyphens',
          code: 'INVALID_USERNAME_FORMAT'
        },
        { status: 400 }
      );
    }

    // Must start with a letter or number (not underscore or hyphen)
    const startsWithAlphanumeric = /^[a-z0-9]/;
    if (!startsWithAlphanumeric.test(normalizedUsername)) {
      return NextResponse.json(
        {
          error: 'Username must start with a letter or number',
          code: 'INVALID_USERNAME_START'
        },
        { status: 400 }
      );
    }

    // Check if username exists in database (case-insensitive)
    const existingUser = await db
      .select()
      .from(user)
      .where(eq(user.username, normalizedUsername))
      .limit(1);

    // Return availability status
    return NextResponse.json(
      {
        available: existingUser.length === 0,
        username: normalizedUsername
      },
      { status: 200 }
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