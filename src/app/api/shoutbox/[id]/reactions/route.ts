import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { messageReactions, shouts, user, session } from '@/db/schema';
import { eq, and, sql } from 'drizzle-orm';

async function authenticateRequest(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7);

  try {
    const sessionResult = await db
      .select({
        userId: session.userId,
        expiresAt: session.expiresAt,
      })
      .from(session)
      .where(eq(session.token, token))
      .limit(1);

    if (sessionResult.length === 0) {
      return null;
    }

    const userSession = sessionResult[0];

    if (new Date(userSession.expiresAt) < new Date()) {
      return null;
    }

    return { id: userSession.userId };
  } catch (error) {
    console.error('Authentication error:', error);
    return null;
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authUser = await authenticateRequest(request);
    if (!authUser) {
      return NextResponse.json(
        { error: 'Authentication required', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const shoutId = params.id;
    if (!shoutId || isNaN(parseInt(shoutId))) {
      return NextResponse.json(
        { error: 'Valid shout ID is required', code: 'INVALID_SHOUT_ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { emoji } = body;

    if (!emoji || typeof emoji !== 'string' || emoji.trim().length === 0) {
      return NextResponse.json(
        { error: 'Emoji is required and must be a non-empty string', code: 'INVALID_EMOJI' },
        { status: 400 }
      );
    }

    if (emoji.length > 10) {
      return NextResponse.json(
        { error: 'Emoji must be at most 10 characters', code: 'EMOJI_TOO_LONG' },
        { status: 400 }
      );
    }

    const shoutIdInt = parseInt(shoutId);

    const shoutResult = await db
      .select()
      .from(shouts)
      .where(and(eq(shouts.id, shoutIdInt), eq(shouts.isDeleted, false)))
      .limit(1);

    if (shoutResult.length === 0) {
      return NextResponse.json(
        { error: 'Shout not found', code: 'SHOUT_NOT_FOUND' },
        { status: 404 }
      );
    }

    const existingReaction = await db
      .select()
      .from(messageReactions)
      .where(
        and(
          eq(messageReactions.shoutId, shoutIdInt),
          eq(messageReactions.userId, authUser.id),
          eq(messageReactions.emoji, emoji.trim())
        )
      )
      .limit(1);

    if (existingReaction.length > 0) {
      await db
        .delete(messageReactions)
        .where(eq(messageReactions.id, existingReaction[0].id));

      return NextResponse.json(
        {
          action: 'removed' as const,
          emoji: emoji.trim(),
          shoutId: shoutIdInt,
        },
        { status: 200 }
      );
    } else {
      await db.insert(messageReactions).values({
        shoutId: shoutIdInt,
        userId: authUser.id,
        emoji: emoji.trim(),
        createdAt: new Date(),
      });

      return NextResponse.json(
        {
          action: 'added' as const,
          emoji: emoji.trim(),
          shoutId: shoutIdInt,
        },
        { status: 201 }
      );
    }
  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authUser = await authenticateRequest(request);
    if (!authUser) {
      return NextResponse.json(
        { error: 'Authentication required', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const shoutId = params.id;
    if (!shoutId || isNaN(parseInt(shoutId))) {
      return NextResponse.json(
        { error: 'Valid shout ID is required', code: 'INVALID_SHOUT_ID' },
        { status: 400 }
      );
    }

    const shoutIdInt = parseInt(shoutId);

    const shoutResult = await db
      .select()
      .from(shouts)
      .where(eq(shouts.id, shoutIdInt))
      .limit(1);

    if (shoutResult.length === 0) {
      return NextResponse.json(
        { error: 'Shout not found', code: 'SHOUT_NOT_FOUND' },
        { status: 404 }
      );
    }

    const reactions = await db
      .select({
        emoji: messageReactions.emoji,
        userId: messageReactions.userId,
        userName: user.name,
      })
      .from(messageReactions)
      .innerJoin(user, eq(messageReactions.userId, user.id))
      .where(eq(messageReactions.shoutId, shoutIdInt));

    const groupedReactions = reactions.reduce((acc, reaction) => {
      if (!acc[reaction.emoji]) {
        acc[reaction.emoji] = {
          emoji: reaction.emoji,
          count: 0,
          users: [],
          hasReacted: false,
        };
      }
      acc[reaction.emoji].count++;
      acc[reaction.emoji].users.push({
        id: reaction.userId,
        name: reaction.userName,
      });
      if (reaction.userId === authUser.id) {
        acc[reaction.emoji].hasReacted = true;
      }
      return acc;
    }, {} as Record<string, { emoji: string; count: number; users: Array<{ id: string; name: string }>; hasReacted: boolean }>);

    const result = Object.values(groupedReactions);

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}