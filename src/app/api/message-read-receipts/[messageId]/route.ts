import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { messageReadReceipts, user, shouts, session } from '@/db/schema';
import { eq, desc, and } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ messageId: string }> }
) {
  try {
    // Extract and validate bearer token
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authentication required', code: 'NO_AUTH_TOKEN' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);

    // Validate session
    const sessionRecord = await db
      .select()
      .from(session)
      .where(eq(session.token, token))
      .limit(1);

    if (sessionRecord.length === 0) {
      return NextResponse.json(
        { error: 'Invalid session token', code: 'INVALID_SESSION' },
        { status: 401 }
      );
    }

    // Check if session is expired
    const currentSession = sessionRecord[0];
    if (new Date(currentSession.expiresAt) < new Date()) {
      return NextResponse.json(
        { error: 'Session expired', code: 'SESSION_EXPIRED' },
        { status: 401 }
      );
    }

    const authenticatedUserId = currentSession.userId;

    // Extract and validate messageId from route params
    const { messageId } = await params;
    const parsedMessageId = parseInt(messageId);

    if (isNaN(parsedMessageId)) {
      return NextResponse.json(
        { error: 'Valid message ID is required', code: 'INVALID_MESSAGE_ID' },
        { status: 400 }
      );
    }

    // Check if message (shout) exists and is not deleted
    const messageRecord = await db
      .select()
      .from(shouts)
      .where(eq(shouts.id, parsedMessageId))
      .limit(1);

    if (messageRecord.length === 0 || messageRecord[0].isDeleted) {
      return NextResponse.json(
        { error: 'Message not found', code: 'MESSAGE_NOT_FOUND' },
        { status: 404 }
      );
    }

    // Query messageReadReceipts with user details
    const readReceipts = await db
      .select({
        id: messageReadReceipts.id,
        messageId: messageReadReceipts.messageId,
        userId: messageReadReceipts.userId,
        readAt: messageReadReceipts.readAt,
        createdAt: messageReadReceipts.createdAt,
        userName: user.name,
        userEmail: user.email,
      })
      .from(messageReadReceipts)
      .innerJoin(user, eq(messageReadReceipts.userId, user.id))
      .where(eq(messageReadReceipts.messageId, parsedMessageId))
      .orderBy(desc(messageReadReceipts.readAt));

    // Transform response to include nested user object
    const formattedReceipts = readReceipts.map((receipt) => ({
      id: receipt.id,
      messageId: receipt.messageId,
      userId: receipt.userId,
      readAt: receipt.readAt,
      createdAt: receipt.createdAt,
      user: {
        id: receipt.userId,
        name: receipt.userName,
        email: receipt.userEmail,
      },
    }));

    return NextResponse.json(formattedReceipts, { status: 200 });
  } catch (error) {
    console.error('GET message read receipts error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    );
  }
}