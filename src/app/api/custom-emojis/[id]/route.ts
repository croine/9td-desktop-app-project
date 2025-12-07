import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { customEmojis, session } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Extract bearer token from Authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authentication required', code: 'MISSING_AUTH_TOKEN' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);

    // Validate session and get user
    const sessionResult = await db
      .select()
      .from(session)
      .where(eq(session.token, token))
      .limit(1);

    if (sessionResult.length === 0) {
      return NextResponse.json(
        { error: 'Invalid authentication token', code: 'INVALID_AUTH_TOKEN' },
        { status: 401 }
      );
    }

    const userSession = sessionResult[0];

    // Check if session is expired
    if (userSession.expiresAt < new Date()) {
      return NextResponse.json(
        { error: 'Session expired', code: 'SESSION_EXPIRED' },
        { status: 401 }
      );
    }

    const userId = userSession.userId;

    // Extract and validate id from route params
    const { id } = await params;
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    const emojiId = parseInt(id);

    // Query custom emoji by id
    const emojiResult = await db
      .select()
      .from(customEmojis)
      .where(eq(customEmojis.id, emojiId))
      .limit(1);

    if (emojiResult.length === 0) {
      return NextResponse.json(
        { error: 'Custom emoji not found', code: 'EMOJI_NOT_FOUND' },
        { status: 404 }
      );
    }

    const emoji = emojiResult[0];

    // Check if authenticated user is the uploader
    if (emoji.uploadedBy !== userId) {
      return NextResponse.json(
        {
          error: 'You can only delete emojis you uploaded',
          code: 'FORBIDDEN',
        },
        { status: 403 }
      );
    }

    // Delete the custom emoji record
    const deleted = await db
      .delete(customEmojis)
      .where(and(eq(customEmojis.id, emojiId), eq(customEmojis.uploadedBy, userId)))
      .returning();

    if (deleted.length === 0) {
      return NextResponse.json(
        { error: 'Failed to delete custom emoji', code: 'DELETE_FAILED' },
        { status: 500 }
      );
    }

    // Return success message with deleted emoji info
    return NextResponse.json(
      {
        message: 'Custom emoji deleted successfully',
        deletedEmoji: {
          id: deleted[0].id,
          name: deleted[0].name,
          imageUrl: deleted[0].imageUrl,
          category: deleted[0].category,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error'),
        code: 'INTERNAL_SERVER_ERROR',
      },
      { status: 500 }
    );
  }
}