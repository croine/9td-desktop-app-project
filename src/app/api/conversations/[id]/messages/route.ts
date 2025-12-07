import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { messages, conversationParticipants, conversations, user, session, unreadMessages } from '@/db/schema';
import { eq, and, isNull, desc, lt } from 'drizzle-orm';

async function authenticateRequest(request: NextRequest) {
  const authHeader = request.headers.get('Authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7);

  try {
    const sessionRecord = await db.select()
      .from(session)
      .where(eq(session.token, token))
      .limit(1);

    if (sessionRecord.length === 0) {
      return null;
    }

    const userSession = sessionRecord[0];
    
    if (new Date(userSession.expiresAt) < new Date()) {
      return null;
    }

    return userSession.userId;
  } catch (error) {
    console.error('Authentication error:', error);
    return null;
  }
}

async function isParticipant(conversationId: number, userId: string): Promise<boolean> {
  try {
    const participant = await db.select()
      .from(conversationParticipants)
      .where(
        and(
          eq(conversationParticipants.conversationId, conversationId),
          eq(conversationParticipants.userId, userId)
        )
      )
      .limit(1);

    return participant.length > 0;
  } catch (error) {
    console.error('Participant check error:', error);
    return false;
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await authenticateRequest(request);
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const conversationId = parseInt(params.id);
    if (!conversationId || isNaN(conversationId)) {
      return NextResponse.json(
        { error: 'Valid conversation ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    const conversationExists = await db.select()
      .from(conversations)
      .where(eq(conversations.id, conversationId))
      .limit(1);

    if (conversationExists.length === 0) {
      return NextResponse.json(
        { error: 'Conversation not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    const isUserParticipant = await isParticipant(conversationId, userId);
    if (!isUserParticipant) {
      return NextResponse.json(
        { error: 'Access forbidden: You are not a participant in this conversation', code: 'FORBIDDEN' },
        { status: 403 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '50'), 100);
    const offset = parseInt(searchParams.get('offset') ?? '0');
    const before = searchParams.get('before');

    let query = db.select({
      id: messages.id,
      conversationId: messages.conversationId,
      senderId: messages.senderId,
      senderName: user.name,
      senderEmail: user.email,
      content: messages.content,
      messageType: messages.messageType,
      metadata: messages.metadata,
      createdAt: messages.createdAt,
      updatedAt: messages.updatedAt,
    })
      .from(messages)
      .leftJoin(user, eq(messages.senderId, user.id))
      .where(
        and(
          eq(messages.conversationId, conversationId),
          isNull(messages.deletedAt)
        )
      )
      .orderBy(desc(messages.createdAt));

    if (before) {
      const beforeId = parseInt(before);
      if (!isNaN(beforeId)) {
        query = db.select({
          id: messages.id,
          conversationId: messages.conversationId,
          senderId: messages.senderId,
          senderName: user.name,
          senderEmail: user.email,
          content: messages.content,
          messageType: messages.messageType,
          metadata: messages.metadata,
          createdAt: messages.createdAt,
          updatedAt: messages.updatedAt,
        })
          .from(messages)
          .leftJoin(user, eq(messages.senderId, user.id))
          .where(
            and(
              eq(messages.conversationId, conversationId),
              isNull(messages.deletedAt),
              lt(messages.id, beforeId)
            )
          )
          .orderBy(desc(messages.createdAt));
      }
    }

    const results = await query.limit(limit + 1).offset(offset);

    const hasMore = results.length > limit;
    const messagesList = results.slice(0, limit);

    const formattedMessages = messagesList.map(msg => ({
      id: msg.id,
      conversationId: msg.conversationId,
      sender: {
        id: msg.senderId,
        name: msg.senderName,
        email: msg.senderEmail,
      },
      content: msg.content,
      messageType: msg.messageType,
      metadata: msg.metadata,
      createdAt: msg.createdAt,
      updatedAt: msg.updatedAt,
    }));

    return NextResponse.json({
      messages: formattedMessages,
      hasMore,
    });

  } catch (error) {
    console.error('GET messages error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
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
        { error: 'Authentication required', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const conversationId = parseInt(params.id);
    if (!conversationId || isNaN(conversationId)) {
      return NextResponse.json(
        { error: 'Valid conversation ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    const conversationExists = await db.select()
      .from(conversations)
      .where(eq(conversations.id, conversationId))
      .limit(1);

    if (conversationExists.length === 0) {
      return NextResponse.json(
        { error: 'Conversation not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    const isUserParticipant = await isParticipant(conversationId, userId);
    if (!isUserParticipant) {
      return NextResponse.json(
        { error: 'Access forbidden: You are not a participant in this conversation', code: 'FORBIDDEN' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { content, messageType = 'text', metadata } = body;

    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return NextResponse.json(
        { error: 'Content is required and must be a non-empty string', code: 'MISSING_CONTENT' },
        { status: 400 }
      );
    }

    if (content.length > 5000) {
      return NextResponse.json(
        { error: 'Content must not exceed 5000 characters', code: 'CONTENT_TOO_LONG' },
        { status: 400 }
      );
    }

    const allowedMessageTypes = ['text', 'system', 'task_mention'];
    if (!allowedMessageTypes.includes(messageType)) {
      return NextResponse.json(
        { error: `Invalid message type. Allowed types: ${allowedMessageTypes.join(', ')}`, code: 'INVALID_MESSAGE_TYPE' },
        { status: 400 }
      );
    }

    if (metadata !== undefined && metadata !== null) {
      if (typeof metadata !== 'object' || Array.isArray(metadata)) {
        return NextResponse.json(
          { error: 'Metadata must be a valid JSON object', code: 'INVALID_METADATA' },
          { status: 400 }
        );
      }
    }

    const now = new Date();
    const newMessage = await db.insert(messages)
      .values({
        conversationId,
        senderId: userId,
        content: content.trim(),
        messageType,
        metadata: metadata || null,
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    await db.update(conversations)
      .set({ updatedAt: now })
      .where(eq(conversations.id, conversationId));

    // Create unread message records for all participants except sender
    const participants = await db.select({ userId: conversationParticipants.userId })
      .from(conversationParticipants)
      .where(eq(conversationParticipants.conversationId, conversationId));

    const unreadRecords = participants
      .filter(p => p.userId !== userId)
      .map(p => ({
        userId: p.userId,
        conversationId,
        messageId: newMessage[0].id,
        createdAt: now,
      }));

    if (unreadRecords.length > 0) {
      await db.insert(unreadMessages).values(unreadRecords);
    }

    const senderDetails = await db.select({
      id: user.id,
      name: user.name,
      email: user.email,
    })
      .from(user)
      .where(eq(user.id, userId))
      .limit(1);

    const createdMessage = {
      id: newMessage[0].id,
      conversationId: newMessage[0].conversationId,
      sender: {
        id: senderDetails[0].id,
        name: senderDetails[0].name,
        email: senderDetails[0].email,
      },
      content: newMessage[0].content,
      messageType: newMessage[0].messageType,
      metadata: newMessage[0].metadata,
      createdAt: newMessage[0].createdAt,
      updatedAt: newMessage[0].updatedAt,
    };

    return NextResponse.json(createdMessage, { status: 201 });

  } catch (error) {
    console.error('POST message error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}