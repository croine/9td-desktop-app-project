import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { conversationParticipants, unreadMessages, session } from '@/db/schema';
import { eq, and, lt } from 'drizzle-orm';

async function authenticateRequest(request: NextRequest): Promise<string | null> {
  const authHeader = request.headers.get('authorization');
  
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

    // Check if session is expired
    if (userSession.expiresAt < new Date()) {
      return null;
    }

    return userSession.userId;
  } catch (error) {
    console.error('Authentication error:', error);
    return null;
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Authenticate request
    const userId = await authenticateRequest(request);
    
    if (!userId) {
      return NextResponse.json(
        { 
          error: 'Authentication required',
          code: 'UNAUTHORIZED' 
        },
        { status: 401 }
      );
    }

    // Validate conversation ID
    const conversationId = params.id;
    
    if (!conversationId || isNaN(parseInt(conversationId))) {
      return NextResponse.json(
        { 
          error: 'Valid conversation ID is required',
          code: 'INVALID_ID' 
        },
        { status: 400 }
      );
    }

    const conversationIdInt = parseInt(conversationId);

    // Check if user is a participant in the conversation
    const participantRecord = await db.select()
      .from(conversationParticipants)
      .where(
        and(
          eq(conversationParticipants.conversationId, conversationIdInt),
          eq(conversationParticipants.userId, userId)
        )
      )
      .limit(1);

    if (participantRecord.length === 0) {
      return NextResponse.json(
        { 
          error: 'Conversation not found or you are not a participant',
          code: 'FORBIDDEN' 
        },
        { status: 403 }
      );
    }

    // Update lastReadAt timestamp
    const updated = await db.update(conversationParticipants)
      .set({
        lastReadAt: new Date()
      })
      .where(
        and(
          eq(conversationParticipants.conversationId, conversationIdInt),
          eq(conversationParticipants.userId, userId)
        )
      )
      .returning();

    if (updated.length === 0) {
      return NextResponse.json(
        { 
          error: 'Failed to update conversation read status',
          code: 'UPDATE_FAILED' 
        },
        { status: 404 }
      );
    }

    // Delete all unread message records for this user and conversation
    await db.delete(unreadMessages)
      .where(
        and(
          eq(unreadMessages.userId, userId),
          eq(unreadMessages.conversationId, conversationIdInt)
        )
      );

    const updatedRecord = updated[0];

    return NextResponse.json({
      conversationId: updatedRecord.conversationId,
      userId: updatedRecord.userId,
      lastReadAt: updatedRecord.lastReadAt
    });

  } catch (error) {
    console.error('PUT error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error')
      },
      { status: 500 }
    );
  }
}