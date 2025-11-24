import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { userPreferences, session } from '@/db/schema';
import { eq } from 'drizzle-orm';

const DEFAULT_PREFERENCES = {
  customTitle: "Account Secured",
  showEmail: false,
  blurEmail: false,
};

export async function GET(request: NextRequest) {
  try {
    // Get user ID from cookie - extract session token
    const cookieHeader = request.headers.get('cookie');
    if (!cookieHeader) {
      return NextResponse.json(
        { error: 'Authentication required', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    // Extract session token from cookie
    const sessionTokenMatch = cookieHeader.match(/better-auth\.session_token=([^;]+)/);
    if (!sessionTokenMatch) {
      return NextResponse.json(
        { error: 'Authentication required', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const sessionToken = sessionTokenMatch[1];

    // Get user ID from session table using Drizzle
    const sessionData = await db.select()
      .from(session)
      .where(eq(session.token, sessionToken))
      .limit(1);

    if (sessionData.length === 0) {
      return NextResponse.json(
        { error: 'Invalid session', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const userId = sessionData[0].userId;

    // Get user preferences
    const preferences = await db.select()
      .from(userPreferences)
      .where(eq(userPreferences.userId, userId))
      .limit(1);

    // If no preferences exist, return default values
    if (preferences.length === 0) {
      return NextResponse.json(DEFAULT_PREFERENCES, { status: 200 });
    }

    return NextResponse.json(preferences[0], { status: 200 });

  } catch (error) {
    console.error('GET /api/user-preferences error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Get user ID from cookie - extract session token
    const cookieHeader = request.headers.get('cookie');
    if (!cookieHeader) {
      return NextResponse.json(
        { error: 'Authentication required', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    // Extract session token from cookie
    const sessionTokenMatch = cookieHeader.match(/better-auth\.session_token=([^;]+)/);
    if (!sessionTokenMatch) {
      return NextResponse.json(
        { error: 'Authentication required', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const sessionToken = sessionTokenMatch[1];

    // Get user ID from session table using Drizzle
    const sessionData = await db.select()
      .from(session)
      .where(eq(session.token, sessionToken))
      .limit(1);

    if (sessionData.length === 0) {
      return NextResponse.json(
        { error: 'Invalid session', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const userId = sessionData[0].userId;

    // Parse request body
    const body = await request.json();
    const { customTitle, showEmail, blurEmail } = body;

    // Validate customTitle length if provided
    if (customTitle !== undefined && customTitle !== null) {
      if (typeof customTitle !== 'string') {
        return NextResponse.json(
          { error: 'customTitle must be a string', code: 'INVALID_CUSTOM_TITLE' },
          { status: 400 }
        );
      }
      if (customTitle.length > 100) {
        return NextResponse.json(
          { error: 'customTitle must not exceed 100 characters', code: 'CUSTOM_TITLE_TOO_LONG' },
          { status: 400 }
        );
      }
    }

    // Validate showEmail if provided
    if (showEmail !== undefined && showEmail !== null && typeof showEmail !== 'boolean') {
      return NextResponse.json(
        { error: 'showEmail must be a boolean', code: 'INVALID_SHOW_EMAIL' },
        { status: 400 }
      );
    }

    // Validate blurEmail if provided
    if (blurEmail !== undefined && blurEmail !== null && typeof blurEmail !== 'boolean') {
      return NextResponse.json(
        { error: 'blurEmail must be a boolean', code: 'INVALID_BLUR_EMAIL' },
        { status: 400 }
      );
    }

    // Check if preferences already exist
    const existingPreferences = await db.select()
      .from(userPreferences)
      .where(eq(userPreferences.userId, userId))
      .limit(1);

    const now = new Date();

    if (existingPreferences.length === 0) {
      // Create new preferences with defaults and provided values
      const newPreferences = await db.insert(userPreferences)
        .values({
          userId,
          customTitle: customTitle !== undefined ? customTitle : DEFAULT_PREFERENCES.customTitle,
          showEmail: showEmail !== undefined ? showEmail : DEFAULT_PREFERENCES.showEmail,
          blurEmail: blurEmail !== undefined ? blurEmail : DEFAULT_PREFERENCES.blurEmail,
          createdAt: now,
          updatedAt: now,
        })
        .returning();

      return NextResponse.json(newPreferences[0], { status: 201 });
    } else {
      // Update existing preferences with only provided fields
      const updateData: {
        customTitle?: string;
        showEmail?: boolean;
        blurEmail?: boolean;
        updatedAt: Date;
      } = {
        updatedAt: now,
      };

      if (customTitle !== undefined) {
        updateData.customTitle = customTitle;
      }
      if (showEmail !== undefined) {
        updateData.showEmail = showEmail;
      }
      if (blurEmail !== undefined) {
        updateData.blurEmail = blurEmail;
      }

      const updatedPreferences = await db.update(userPreferences)
        .set(updateData)
        .where(eq(userPreferences.userId, userId))
        .returning();

      return NextResponse.json(updatedPreferences[0], { status: 200 });
    }

  } catch (error) {
    console.error('PUT /api/user-preferences error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}