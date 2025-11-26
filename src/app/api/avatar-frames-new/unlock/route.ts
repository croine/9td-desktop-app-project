import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { avatarFramesNew, userFrames, session } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

export async function POST(request: NextRequest) {
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

    // Parse request body
    const body = await request.json();
    const { frameId } = body;

    // Validate frameId
    if (!frameId) {
      return NextResponse.json(
        { error: 'Frame ID is required', code: 'INVALID_FRAME_ID' },
        { status: 400 }
      );
    }

    const parsedFrameId = parseInt(frameId);
    if (isNaN(parsedFrameId)) {
      return NextResponse.json(
        { error: 'Frame ID must be a valid integer', code: 'INVALID_FRAME_ID' },
        { status: 400 }
      );
    }

    // Verify frame exists
    const frame = await db
      .select()
      .from(avatarFramesNew)
      .where(eq(avatarFramesNew.id, parsedFrameId))
      .limit(1);

    if (frame.length === 0) {
      return NextResponse.json(
        { error: 'Frame not found', code: 'FRAME_NOT_FOUND' },
        { status: 404 }
      );
    }

    // Check if user already has this frame unlocked
    const existingUserFrame = await db
      .select()
      .from(userFrames)
      .where(
        and(
          eq(userFrames.userId, userId),
          eq(userFrames.frameId, parsedFrameId)
        )
      )
      .limit(1);

    if (existingUserFrame.length > 0) {
      return NextResponse.json(
        { error: 'Frame already unlocked', code: 'ALREADY_UNLOCKED' },
        { status: 409 }
      );
    }

    // Insert new userFrame record
    const newUserFrame = await db
      .insert(userFrames)
      .values({
        userId: userId,
        frameId: parsedFrameId,
        unlockedAt: new Date(),
        isActive: false,
      })
      .returning();

    return NextResponse.json(newUserFrame[0], { status: 201 });
  } catch (error) {
    console.error('POST /api/avatar-frames-new/unlock error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}