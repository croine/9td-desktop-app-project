import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { messageMentions, shouts, user, session } from '@/db/schema';
import { eq, and, desc, sql } from 'drizzle-orm';

async function getCurrentUser(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.substring(7);
    if (!token) {
      return null;
    }

    const sessions = await db
      .select({
        userId: session.userId,
        expiresAt: session.expiresAt,
      })
      .from(session)
      .where(eq(session.token, token))
      .limit(1);

    if (sessions.length === 0) {
      return null;
    }

    const userSession = sessions[0];
    const now = new Date();
    if (userSession.expiresAt < now) {
      return null;
    }

    return { id: userSession.userId };
  } catch (error) {
    console.error('Authentication error:', error);
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser(request);
    if (!currentUser) {
      return NextResponse.json(
        { error: 'Authentication required', code: 'AUTHENTICATION_REQUIRED' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '20'), 50);
    const offset = parseInt(searchParams.get('offset') ?? '0');

    if (isNaN(limit) || isNaN(offset) || limit < 1 || offset < 0) {
      return NextResponse.json(
        { error: 'Invalid pagination parameters', code: 'INVALID_PAGINATION' },
        { status: 400 }
      );
    }

    const unreadCountResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(messageMentions)
      .where(
        and(
          eq(messageMentions.mentionedUserId, currentUser.id),
          eq(messageMentions.isRead, false)
        )
      );

    const unreadCount = Number(unreadCountResult[0]?.count ?? 0);

    const mentionsData = await db
      .select({
        id: messageMentions.id,
        shoutId: messageMentions.shoutId,
        shoutMessage: shouts.message,
        shoutCreatedAt: shouts.createdAt,
        mentionedByUserId: user.id,
        mentionedByUserName: user.name,
        mentionedByUserEmail: user.email,
        isRead: messageMentions.isRead,
        createdAt: messageMentions.createdAt,
      })
      .from(messageMentions)
      .innerJoin(shouts, eq(messageMentions.shoutId, shouts.id))
      .innerJoin(user, eq(messageMentions.mentionedByUserId, user.id))
      .where(
        and(
          eq(messageMentions.mentionedUserId, currentUser.id),
          eq(shouts.isDeleted, false)
        )
      )
      .orderBy(desc(messageMentions.createdAt))
      .limit(limit)
      .offset(offset);

    const mentions = mentionsData.map((mention) => ({
      id: mention.id,
      shout: {
        id: mention.shoutId,
        message: mention.shoutMessage,
        createdAt: mention.shoutCreatedAt,
      },
      mentionedBy: {
        id: mention.mentionedByUserId,
        name: mention.mentionedByUserName,
        email: mention.mentionedByUserEmail,
      },
      isRead: Boolean(mention.isRead),
      createdAt: mention.createdAt,
    }));

    return NextResponse.json({
      unreadCount,
      mentions,
    });
  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser(request);
    if (!currentUser) {
      return NextResponse.json(
        { error: 'Authentication required', code: 'AUTHENTICATION_REQUIRED' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { mentionIds } = body;

    if (!mentionIds) {
      return NextResponse.json(
        { error: 'mentionIds is required', code: 'MISSING_MENTION_IDS' },
        { status: 400 }
      );
    }

    if (!Array.isArray(mentionIds)) {
      return NextResponse.json(
        { error: 'mentionIds must be an array', code: 'INVALID_MENTION_IDS_TYPE' },
        { status: 400 }
      );
    }

    if (mentionIds.length === 0) {
      return NextResponse.json(
        { error: 'mentionIds array cannot be empty', code: 'EMPTY_MENTION_IDS' },
        { status: 400 }
      );
    }

    const validMentionIds = mentionIds.every(
      (id) => Number.isInteger(id) && id > 0
    );

    if (!validMentionIds) {
      return NextResponse.json(
        { error: 'All mentionIds must be positive integers', code: 'INVALID_MENTION_ID_FORMAT' },
        { status: 400 }
      );
    }

    const existingMentions = await db
      .select({ id: messageMentions.id })
      .from(messageMentions)
      .where(
        and(
          eq(messageMentions.mentionedUserId, currentUser.id),
          sql`${messageMentions.id} IN ${mentionIds}`
        )
      );

    if (existingMentions.length === 0) {
      return NextResponse.json(
        { error: 'No mentions found to update', code: 'MENTIONS_NOT_FOUND' },
        { status: 404 }
      );
    }

    const validIds = existingMentions.map((m) => m.id);

    const updated = await db
      .update(messageMentions)
      .set({ isRead: true })
      .where(
        and(
          eq(messageMentions.mentionedUserId, currentUser.id),
          sql`${messageMentions.id} IN ${validIds}`
        )
      )
      .returning();

    return NextResponse.json({
      success: true,
      markedRead: updated.length,
    });
  } catch (error) {
    console.error('PATCH error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    );
  }
}