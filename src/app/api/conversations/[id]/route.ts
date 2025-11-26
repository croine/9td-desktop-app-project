import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { conversations, conversationParticipants, user, session } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

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

    return { userId: userSession.userId };
  } catch (error) {
    console.error('Authentication error:', error);
    return null;
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

    const conversationId = params.id;

    if (!conversationId || isNaN(parseInt(conversationId))) {
      return NextResponse.json(
        { error: 'Valid conversation ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    const id = parseInt(conversationId);

    const conversationRecord = await db.select()
      .from(conversations)
      .where(eq(conversations.id, id))
      .limit(1);

    if (conversationRecord.length === 0) {
      return NextResponse.json(
        { error: 'Conversation not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    const isParticipant = await db.select()
      .from(conversationParticipants)
      .where(
        and(
          eq(conversationParticipants.conversationId, id),
          eq(conversationParticipants.userId, authUser.userId)
        )
      )
      .limit(1);

    if (isParticipant.length === 0) {
      return NextResponse.json(
        { error: 'Access forbidden: You are not a participant of this conversation', code: 'FORBIDDEN' },
        { status: 403 }
      );
    }

    const participants = await db.select({
      id: user.id,
      name: user.name,
      email: user.email,
      joinedAt: conversationParticipants.joinedAt,
      lastReadAt: conversationParticipants.lastReadAt,
    })
      .from(conversationParticipants)
      .innerJoin(user, eq(conversationParticipants.userId, user.id))
      .where(eq(conversationParticipants.conversationId, id));

    const conversation = conversationRecord[0];

    return NextResponse.json({
      id: conversation.id,
      name: conversation.name,
      isGroup: conversation.isGroup,
      createdBy: conversation.createdBy,
      participants: participants,
      createdAt: conversation.createdAt,
      updatedAt: conversation.updatedAt,
    }, { status: 200 });

  } catch (error) {
    console.error('GET conversation error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}