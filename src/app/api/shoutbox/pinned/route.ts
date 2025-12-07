import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { pinnedMessages, shouts, user, session } from '@/db/schema';
import { eq, and, asc, desc } from 'drizzle-orm';

interface PinnedMessageResponse {
  id: number;
  message: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
  attachment?: {
    url: string;
    type: string;
    name: string;
  } | null;
  gif?: {
    url: string;
    title: string;
    provider: string;
  } | null;
  voiceMessage?: {
    url: string;
    duration: number;
    waveform: string;
  } | null;
  pinned: {
    pinnedBy: string;
    pinnedAt: Date;
    order: number;
  };
  createdAt: Date;
  editedAt: Date | null;
  replyToId: number | null;
}

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

export async function GET(request: NextRequest) {
  try {
    // Authentication check
    const userId = await authenticateRequest(request);
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    // Query pinned messages with joins
    const results = await db
      .select({
        // Shout fields
        id: shouts.id,
        message: shouts.message,
        replyToId: shouts.replyToId,
        editedAt: shouts.editedAt,
        attachmentUrl: shouts.attachmentUrl,
        attachmentType: shouts.attachmentType,
        attachmentName: shouts.attachmentName,
        gifUrl: shouts.gifUrl,
        gifTitle: shouts.gifTitle,
        gifProvider: shouts.gifProvider,
        voiceMessageUrl: shouts.voiceMessageUrl,
        voiceMessageDuration: shouts.voiceMessageDuration,
        voiceMessageWaveform: shouts.voiceMessageWaveform,
        createdAt: shouts.createdAt,
        isDeleted: shouts.isDeleted,
        // User fields
        userId: user.id,
        userName: user.name,
        userEmail: user.email,
        // Pinned metadata
        pinnedBy: pinnedMessages.pinnedBy,
        pinnedAt: pinnedMessages.pinnedAt,
        order: pinnedMessages.order,
      })
      .from(pinnedMessages)
      .innerJoin(shouts, eq(pinnedMessages.shoutId, shouts.id))
      .innerJoin(user, eq(shouts.userId, user.id))
      .where(eq(shouts.isDeleted, false))
      .orderBy(asc(pinnedMessages.order), desc(pinnedMessages.pinnedAt));

    // Transform results to match response format
    const pinnedMessagesResponse: PinnedMessageResponse[] = results.map((row) => {
      const response: PinnedMessageResponse = {
        id: row.id,
        message: row.message,
        user: {
          id: row.userId,
          name: row.userName,
          email: row.userEmail,
        },
        pinned: {
          pinnedBy: row.pinnedBy,
          pinnedAt: row.pinnedAt,
          order: row.order,
        },
        createdAt: row.createdAt,
        editedAt: row.editedAt,
        replyToId: row.replyToId,
      };

      // Add attachment if exists
      if (row.attachmentUrl && row.attachmentType && row.attachmentName) {
        response.attachment = {
          url: row.attachmentUrl,
          type: row.attachmentType,
          name: row.attachmentName,
        };
      }

      // Add GIF if exists
      if (row.gifUrl && row.gifTitle && row.gifProvider) {
        response.gif = {
          url: row.gifUrl,
          title: row.gifTitle,
          provider: row.gifProvider,
        };
      }

      // Add voice message if exists
      if (row.voiceMessageUrl && row.voiceMessageDuration && row.voiceMessageWaveform) {
        response.voiceMessage = {
          url: row.voiceMessageUrl,
          duration: row.voiceMessageDuration,
          waveform: row.voiceMessageWaveform,
        };
      }

      return response;
    });

    return NextResponse.json(pinnedMessagesResponse, { status: 200 });
  } catch (error) {
    console.error('GET /api/shoutbox/pinned error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error'),
        code: 'INTERNAL_ERROR',
      },
      { status: 500 }
    );
  }
}