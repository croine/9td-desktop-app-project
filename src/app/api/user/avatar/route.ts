import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { userPreferences, session } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function PUT(request: NextRequest) {
  try {
    // Extract bearer token from Authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authentication required', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Look up userId from session table using the token
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
    const { avatarUrl } = body;

    // Validate avatarUrl
    if (avatarUrl === undefined || avatarUrl === null) {
      return NextResponse.json(
        { error: 'avatarUrl is required', code: 'MISSING_AVATAR_URL' },
        { status: 400 }
      );
    }

    // Check if userPreferences record exists for this userId
    const existingPreferences = await db
      .select()
      .from(userPreferences)
      .where(eq(userPreferences.userId, userId))
      .limit(1);

    if (existingPreferences.length > 0) {
      // Update existing record
      const updated = await db
        .update(userPreferences)
        .set({
          avatarUrl: avatarUrl,
          updatedAt: new Date()
        })
        .where(eq(userPreferences.userId, userId))
        .returning();

      return NextResponse.json(updated[0], { status: 200 });
    } else {
      // Create new record with defaults
      const created = await db
        .insert(userPreferences)
        .values({
          userId: userId,
          avatarUrl: avatarUrl,
          avatarShape: 'circle',
          avatarColorScheme: 'gradient',
          avatarBorderColor: '#6366f1',
          showPassword: false,
          accountVisibility: 'private',
          twoFactorEnabled: false,
          customTitle: 'Account Secured',
          showEmail: false,
          blurEmail: false,
          createdAt: new Date(),
          updatedAt: new Date()
        })
        .returning();

      return NextResponse.json(created[0], { status: 201 });
    }
  } catch (error) {
    console.error('PUT error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error instanceof Error ? error.message : String(error)) },
      { status: 500 }
    );
  }
}