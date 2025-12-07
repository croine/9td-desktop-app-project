import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { messageBookmarks, shouts, user, session } from '@/db/schema';
import { eq, and, desc, lte } from 'drizzle-orm';

async function validateSession(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7);

  try {
    const sessions = await db
      .select()
      .from(session)
      .where(eq(session.token, token))
      .limit(1);

    if (sessions.length === 0) {
      return null;
    }

    const userSession = sessions[0];

    if (new Date(userSession.expiresAt) < new Date()) {
      return null;
    }

    return userSession.userId;
  } catch (error) {
    console.error('Session validation error:', error);
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    const userId = await validateSession(request);
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '50'), 100);
    const offset = parseInt(searchParams.get('offset') ?? '0');

    const bookmarksQuery = await db
      .select({
        id: messageBookmarks.id,
        note: messageBookmarks.note,
        bookmarkedAt: messageBookmarks.bookmarkedAt,
        shout: {
          id: shouts.id,
          message: shouts.message,
          createdAt: shouts.createdAt,
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
          },
        },
      })
      .from(messageBookmarks)
      .innerJoin(shouts, eq(messageBookmarks.shoutId, shouts.id))
      .innerJoin(user, eq(shouts.userId, user.id))
      .where(
        and(
          eq(messageBookmarks.userId, userId),
          eq(shouts.isDeleted, false)
        )
      )
      .orderBy(desc(messageBookmarks.bookmarkedAt))
      .limit(limit)
      .offset(offset);

    return NextResponse.json(bookmarksQuery, { status: 200 });
  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await validateSession(request);
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { shoutId, note } = body;

    if (!shoutId) {
      return NextResponse.json(
        { error: 'shoutId is required', code: 'MISSING_REQUIRED_FIELD' },
        { status: 400 }
      );
    }

    const shoutIdInt = parseInt(shoutId);
    if (isNaN(shoutIdInt)) {
      return NextResponse.json(
        { error: 'shoutId must be a valid integer', code: 'INVALID_SHOUT_ID' },
        { status: 400 }
      );
    }

    if (note && typeof note === 'string' && note.length > 500) {
      return NextResponse.json(
        { error: 'Note cannot exceed 500 characters', code: 'NOTE_TOO_LONG' },
        { status: 400 }
      );
    }

    const shoutExists = await db
      .select()
      .from(shouts)
      .where(and(eq(shouts.id, shoutIdInt), eq(shouts.isDeleted, false)))
      .limit(1);

    if (shoutExists.length === 0) {
      return NextResponse.json(
        { error: 'Shout not found', code: 'SHOUT_NOT_FOUND' },
        { status: 404 }
      );
    }

    const existingBookmark = await db
      .select()
      .from(messageBookmarks)
      .where(
        and(
          eq(messageBookmarks.userId, userId),
          eq(messageBookmarks.shoutId, shoutIdInt)
        )
      )
      .limit(1);

    if (existingBookmark.length > 0) {
      return NextResponse.json(
        { error: 'Bookmark already exists', code: 'BOOKMARK_EXISTS' },
        { status: 409 }
      );
    }

    const newBookmark = await db
      .insert(messageBookmarks)
      .values({
        userId,
        shoutId: shoutIdInt,
        note: note ? note.trim() : null,
        bookmarkedAt: new Date(),
      })
      .returning();

    const bookmarkWithDetails = await db
      .select({
        id: messageBookmarks.id,
        note: messageBookmarks.note,
        bookmarkedAt: messageBookmarks.bookmarkedAt,
        shout: {
          id: shouts.id,
          message: shouts.message,
          createdAt: shouts.createdAt,
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
          },
        },
      })
      .from(messageBookmarks)
      .innerJoin(shouts, eq(messageBookmarks.shoutId, shouts.id))
      .innerJoin(user, eq(shouts.userId, user.id))
      .where(eq(messageBookmarks.id, newBookmark[0].id))
      .limit(1);

    return NextResponse.json(bookmarkWithDetails[0], { status: 201 });
  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}