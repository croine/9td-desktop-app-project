import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { shouts, pinnedMessages, session } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

async function authenticateRequest(request: NextRequest): Promise<string | null> {
  const authHeader = request.headers.get('Authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7);

  try {
    const sessions = await db.select()
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

    return userSession.userId;
  } catch (error) {
    console.error('Session authentication error:', error);
    return null;
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await authenticateRequest(request);
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required', code: 'AUTH_REQUIRED' },
        { status: 401 }
      );
    }

    const messageId = params.id;

    if (!messageId || isNaN(parseInt(messageId))) {
      return NextResponse.json(
        { error: 'Valid message ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    const id = parseInt(messageId);

    const message = await db.select()
      .from(shouts)
      .where(and(eq(shouts.id, id), eq(shouts.isDeleted, false)))
      .limit(1);

    if (message.length === 0) {
      return NextResponse.json(
        { error: 'Message not found', code: 'MESSAGE_NOT_FOUND' },
        { status: 404 }
      );
    }

    if (message[0].userId !== userId) {
      return NextResponse.json(
        { error: 'You can only pin your own messages', code: 'FORBIDDEN' },
        { status: 403 }
      );
    }

    const existingPin = await db.select()
      .from(pinnedMessages)
      .where(eq(pinnedMessages.shoutId, id))
      .limit(1);

    if (existingPin.length > 0) {
      await db.delete(pinnedMessages)
        .where(eq(pinnedMessages.shoutId, id));

      return NextResponse.json({
        success: true,
        pinned: false
      });
    } else {
      const newPin = await db.insert(pinnedMessages)
        .values({
          shoutId: id,
          pinnedBy: userId,
          pinnedAt: new Date(),
          order: 0
        })
        .returning();

      return NextResponse.json({
        success: true,
        pinned: true,
        pinnedAt: newPin[0].pinnedAt,
        order: newPin[0].order
      });
    }
  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}