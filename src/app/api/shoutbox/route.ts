import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { shouts, user, session } from '@/db/schema';
import { eq, and, desc, gt } from 'drizzle-orm';

async function authenticateRequest(request: NextRequest) {
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
    const userId = await authenticateRequest(request);
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const results = await db.select({
      id: shouts.id,
      message: shouts.message,
      createdAt: shouts.createdAt,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    })
      .from(shouts)
      .leftJoin(user, eq(shouts.userId, user.id))
      .where(eq(shouts.isDeleted, false))
      .orderBy(desc(shouts.createdAt))
      .limit(50);

    return NextResponse.json(results, { status: 200 });
  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await authenticateRequest(request);
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { message } = body;

    if ('userId' in body || 'user_id' in body) {
      return NextResponse.json(
        { 
          error: 'User ID cannot be provided in request body',
          code: 'USER_ID_NOT_ALLOWED' 
        },
        { status: 400 }
      );
    }

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required', code: 'MISSING_MESSAGE' },
        { status: 400 }
      );
    }

    if (typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Message must be a string', code: 'INVALID_MESSAGE_TYPE' },
        { status: 400 }
      );
    }

    const trimmedMessage = message.trim();

    if (trimmedMessage.length === 0) {
      return NextResponse.json(
        { error: 'Message cannot be empty', code: 'EMPTY_MESSAGE' },
        { status: 400 }
      );
    }

    if (trimmedMessage.length > 500) {
      return NextResponse.json(
        { error: 'Message length must not exceed 500 characters', code: 'MESSAGE_TOO_LONG' },
        { status: 400 }
      );
    }

    const now = new Date();
    const newShout = await db.insert(shouts)
      .values({
        userId,
        message: trimmedMessage,
        createdAt: now,
        updatedAt: now,
        isDeleted: false,
      })
      .returning();

    if (newShout.length === 0) {
      return NextResponse.json(
        { error: 'Failed to create shout', code: 'INSERT_FAILED' },
        { status: 500 }
      );
    }

    const createdShoutWithUser = await db.select({
      id: shouts.id,
      message: shouts.message,
      createdAt: shouts.createdAt,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    })
      .from(shouts)
      .leftJoin(user, eq(shouts.userId, user.id))
      .where(eq(shouts.id, newShout[0].id))
      .limit(1);

    if (createdShoutWithUser.length === 0) {
      return NextResponse.json(
        { error: 'Failed to retrieve created shout', code: 'RETRIEVAL_FAILED' },
        { status: 500 }
      );
    }

    return NextResponse.json(createdShoutWithUser[0], { status: 201 });
  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    );
  }
}