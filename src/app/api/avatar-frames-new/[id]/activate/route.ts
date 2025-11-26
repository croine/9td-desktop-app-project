import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { userFrames, session } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Extract bearer token from Authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authentication required', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);

    // Query session table to get userId
    const sessionRecord = await db
      .select()
      .from(session)
      .where(eq(session.token, token))
      .limit(1);

    if (sessionRecord.length === 0) {
      return NextResponse.json(
        { error: 'Invalid or expired session', code: 'INVALID_SESSION' },
        { status: 401 }
      );
    }

    const userId = sessionRecord[0].userId;

    const { id } = params;

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid frame ID is required', code: 'INVALID_FRAME_ID' },
        { status: 400 }
      );
    }

    const frameId = parseInt(id);

    const existingFrame = await db
      .select()
      .from(userFrames)
      .where(and(eq(userFrames.userId, userId), eq(userFrames.frameId, frameId)))
      .limit(1);

    if (existingFrame.length === 0) {
      return NextResponse.json(
        { error: 'Frame not unlocked by user', code: 'FRAME_NOT_UNLOCKED' },
        { status: 404 }
      );
    }

    await db
      .update(userFrames)
      .set({ isActive: false })
      .where(eq(userFrames.userId, userId));

    const activatedFrame = await db
      .update(userFrames)
      .set({ isActive: true })
      .where(and(eq(userFrames.userId, userId), eq(userFrames.frameId, frameId)))
      .returning();

    if (activatedFrame.length === 0) {
      return NextResponse.json(
        { error: 'Failed to activate frame', code: 'ACTIVATION_FAILED' },
        { status: 500 }
      );
    }

    return NextResponse.json(activatedFrame[0], { status: 200 });
  } catch (error) {
    console.error('PUT error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error'),
        code: 'ACTIVATION_FAILED',
      },
      { status: 500 }
    );
  }
}