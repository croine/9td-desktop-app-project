import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { conversationParticipants, conversations, user, session } from '@/db/schema';
import { eq, and, lt } from 'drizzle-orm';

async function authenticateRequest(request: NextRequest) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7);
  
  const sessionRecord = await db.select()
    .from(session)
    .where(eq(session.token, token))
    .limit(1);

  if (sessionRecord.length === 0) {
    return null;
  }

  const currentSession = sessionRecord[0];
  
  if (new Date(currentSession.expiresAt) < new Date()) {
    return null;
  }

  return currentSession.userId;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authenticatedUserId = await authenticateRequest(request);
    if (!authenticatedUserId) {
      return NextResponse.json(
        { error: 'Authentication required', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const { id } = await params;
    
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid conversation ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    const conversationId = parseInt(id);

    const body = await request.json();
    const { userId: userIdToAdd } = body;

    if (!userIdToAdd || typeof userIdToAdd !== 'string' || userIdToAdd.trim() === '') {
      return NextResponse.json(
        { error: 'userId is required and must be a non-empty string', code: 'MISSING_USER_ID' },
        { status: 400 }
      );
    }

    const conversation = await db.select()
      .from(conversations)
      .where(eq(conversations.id, conversationId))
      .limit(1);

    if (conversation.length === 0) {
      return NextResponse.json(
        { error: 'Conversation not found', code: 'CONVERSATION_NOT_FOUND' },
        { status: 404 }
      );
    }

    if (!conversation[0].isGroup) {
      return NextResponse.json(
        { error: 'Can only add participants to group conversations', code: 'NOT_A_GROUP' },
        { status: 400 }
      );
    }

    const authenticatedUserParticipant = await db.select()
      .from(conversationParticipants)
      .where(
        and(
          eq(conversationParticipants.conversationId, conversationId),
          eq(conversationParticipants.userId, authenticatedUserId)
        )
      )
      .limit(1);

    if (authenticatedUserParticipant.length === 0) {
      return NextResponse.json(
        { error: 'You are not a participant in this conversation', code: 'NOT_A_PARTICIPANT' },
        { status: 403 }
      );
    }

    const userToAdd = await db.select()
      .from(user)
      .where(eq(user.id, userIdToAdd))
      .limit(1);

    if (userToAdd.length === 0) {
      return NextResponse.json(
        { error: 'User not found', code: 'USER_NOT_FOUND' },
        { status: 404 }
      );
    }

    const existingParticipant = await db.select()
      .from(conversationParticipants)
      .where(
        and(
          eq(conversationParticipants.conversationId, conversationId),
          eq(conversationParticipants.userId, userIdToAdd)
        )
      )
      .limit(1);

    if (existingParticipant.length > 0) {
      return NextResponse.json(
        { error: 'User is already a participant in this conversation', code: 'ALREADY_MEMBER' },
        { status: 409 }
      );
    }

    const newParticipant = await db.insert(conversationParticipants)
      .values({
        conversationId,
        userId: userIdToAdd,
        joinedAt: new Date(),
        lastReadAt: null,
      })
      .returning();

    await db.update(conversations)
      .set({ updatedAt: new Date() })
      .where(eq(conversations.id, conversationId));

    return NextResponse.json(
      {
        id: newParticipant[0].id,
        conversationId: newParticipant[0].conversationId,
        user: {
          id: userToAdd[0].id,
          name: userToAdd[0].name,
          email: userToAdd[0].email,
        },
        joinedAt: newParticipant[0].joinedAt,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authenticatedUserId = await authenticateRequest(request);
    if (!authenticatedUserId) {
      return NextResponse.json(
        { error: 'Authentication required', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const { id } = await params;
    
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid conversation ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    const conversationId = parseInt(id);

    const { searchParams } = new URL(request.url);
    const userIdToRemove = searchParams.get('userId');

    if (!userIdToRemove || userIdToRemove.trim() === '') {
      return NextResponse.json(
        { error: 'userId query parameter is required', code: 'MISSING_USER_ID' },
        { status: 400 }
      );
    }

    const conversation = await db.select()
      .from(conversations)
      .where(eq(conversations.id, conversationId))
      .limit(1);

    if (conversation.length === 0) {
      return NextResponse.json(
        { error: 'Conversation not found', code: 'CONVERSATION_NOT_FOUND' },
        { status: 404 }
      );
    }

    if (!conversation[0].isGroup) {
      return NextResponse.json(
        { error: 'Can only remove participants from group conversations', code: 'NOT_A_GROUP' },
        { status: 400 }
      );
    }

    const authenticatedUserParticipant = await db.select()
      .from(conversationParticipants)
      .where(
        and(
          eq(conversationParticipants.conversationId, conversationId),
          eq(conversationParticipants.userId, authenticatedUserId)
        )
      )
      .limit(1);

    if (authenticatedUserParticipant.length === 0) {
      return NextResponse.json(
        { error: 'You are not a participant in this conversation', code: 'NOT_A_PARTICIPANT' },
        { status: 403 }
      );
    }

    if (userIdToRemove === conversation[0].createdBy) {
      return NextResponse.json(
        { error: 'Cannot remove the conversation creator', code: 'CANNOT_REMOVE_CREATOR' },
        { status: 400 }
      );
    }

    const isRemovingSelf = userIdToRemove === authenticatedUserId;
    const isCreator = authenticatedUserId === conversation[0].createdBy;

    if (!isRemovingSelf && !isCreator) {
      return NextResponse.json(
        { error: 'Only the conversation creator can remove other participants', code: 'NOT_AUTHORIZED' },
        { status: 403 }
      );
    }

    const participantToRemove = await db.select()
      .from(conversationParticipants)
      .where(
        and(
          eq(conversationParticipants.conversationId, conversationId),
          eq(conversationParticipants.userId, userIdToRemove)
        )
      )
      .limit(1);

    if (participantToRemove.length === 0) {
      return NextResponse.json(
        { error: 'Participant not found in this conversation', code: 'PARTICIPANT_NOT_FOUND' },
        { status: 404 }
      );
    }

    const deletedParticipant = await db.delete(conversationParticipants)
      .where(
        and(
          eq(conversationParticipants.conversationId, conversationId),
          eq(conversationParticipants.userId, userIdToRemove)
        )
      )
      .returning();

    await db.update(conversations)
      .set({ updatedAt: new Date() })
      .where(eq(conversations.id, conversationId));

    return NextResponse.json(
      {
        message: 'Participant removed successfully',
        userId: userIdToRemove,
        conversationId,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}