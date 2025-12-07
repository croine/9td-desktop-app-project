import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { messageBookmarks, session } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

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

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Authentication check
    const userId = await validateSession(request);
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    // Extract and validate ID from route params
    const { id } = params;
    
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid bookmark ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    const bookmarkId = parseInt(id);

    // Check if bookmark exists and belongs to authenticated user
    const existingBookmark = await db
      .select()
      .from(messageBookmarks)
      .where(
        and(
          eq(messageBookmarks.id, bookmarkId),
          eq(messageBookmarks.userId, userId)
        )
      )
      .limit(1);

    if (existingBookmark.length === 0) {
      return NextResponse.json(
        { error: 'Bookmark not found or does not belong to you', code: 'BOOKMARK_NOT_FOUND' },
        { status: 404 }
      );
    }

    // Delete the bookmark
    const deleted = await db
      .delete(messageBookmarks)
      .where(
        and(
          eq(messageBookmarks.id, bookmarkId),
          eq(messageBookmarks.userId, userId)
        )
      )
      .returning();

    if (deleted.length === 0) {
      return NextResponse.json(
        { error: 'Failed to delete bookmark', code: 'DELETE_FAILED' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { 
        message: 'Bookmark deleted successfully', 
        bookmarkId: bookmarkId 
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('DELETE bookmark error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    );
  }
}