import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { messageReadReceipts, shouts, session } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    // Extract and validate authorization token
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authentication required', code: 'NO_AUTH_TOKEN' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);

    // Validate session and get user
    const sessionRecord = await db
      .select()
      .from(session)
      .where(eq(session.token, token))
      .limit(1);

    if (sessionRecord.length === 0) {
      return NextResponse.json(
        { error: 'Invalid authentication token', code: 'INVALID_TOKEN' },
        { status: 401 }
      );
    }

    const userSession = sessionRecord[0];

    // Check if session is expired
    const now = new Date();
    if (userSession.expiresAt < now) {
      return NextResponse.json(
        { error: 'Session expired', code: 'SESSION_EXPIRED' },
        { status: 401 }
      );
    }

    const userId = userSession.userId;

    // Parse request body
    const body = await request.json();
    const { messageId } = body;

    // Validate messageId
    if (!messageId) {
      return NextResponse.json(
        { error: 'messageId is required', code: 'MISSING_MESSAGE_ID' },
        { status: 400 }
      );
    }

    const parsedMessageId = parseInt(messageId);
    if (isNaN(parsedMessageId)) {
      return NextResponse.json(
        { error: 'messageId must be a valid integer', code: 'INVALID_MESSAGE_ID' },
        { status: 400 }
      );
    }

    // Check if message (shout) exists and is not deleted
    const message = await db
      .select()
      .from(shouts)
      .where(
        and(
          eq(shouts.id, parsedMessageId),
          eq(shouts.isDeleted, false)
        )
      )
      .limit(1);

    if (message.length === 0) {
      return NextResponse.json(
        { error: 'Message not found', code: 'MESSAGE_NOT_FOUND' },
        { status: 404 }
      );
    }

    // Check if read receipt already exists
    const existingReceipt = await db
      .select()
      .from(messageReadReceipts)
      .where(
        and(
          eq(messageReadReceipts.messageId, parsedMessageId),
          eq(messageReadReceipts.userId, userId)
        )
      )
      .limit(1);

    if (existingReceipt.length > 0) {
      return NextResponse.json(
        { error: 'Read receipt already exists', code: 'RECEIPT_EXISTS' },
        { status: 409 }
      );
    }

    // Fix: Use text timestamps as per schema
    const nowIso = new Date().toISOString();
    const newReceipt = await db
      .insert(messageReadReceipts)
      .values({
        messageId: parsedMessageId,
        userId: userId,
        readAt: nowIso,
        createdAt: nowIso,
      })
      .returning();

    return NextResponse.json(newReceipt[0], { status: 201 });
  } catch (error) {
    console.error('POST message-read-receipts error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error'),
        code: 'INTERNAL_ERROR'
      },
      { status: 500 }
    );
  }
}