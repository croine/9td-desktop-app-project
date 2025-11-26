import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { userAchievementsNew, session } from '@/db/schema';
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

    // Extract and validate ID from params
    const { id } = params;
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    const achievementRecordId = parseInt(id);

    // Parse and validate request body
    const body = await request.json();
    const { displayed } = body;

    // Validate displayed field
    if (displayed === undefined || displayed === null) {
      return NextResponse.json(
        { error: 'displayed field is required', code: 'INVALID_DISPLAYED' },
        { status: 400 }
      );
    }

    if (typeof displayed !== 'boolean') {
      return NextResponse.json(
        { error: 'displayed must be a boolean value', code: 'INVALID_DISPLAYED' },
        { status: 400 }
      );
    }

    // Check if achievement record exists and belongs to user
    const existingRecord = await db
      .select()
      .from(userAchievementsNew)
      .where(
        and(
          eq(userAchievementsNew.id, achievementRecordId),
          eq(userAchievementsNew.userId, userId)
        )
      )
      .limit(1);

    if (existingRecord.length === 0) {
      return NextResponse.json(
        { 
          error: 'Achievement not found or does not belong to user',
          code: 'NOT_FOUND'
        },
        { status: 404 }
      );
    }

    // Update the displayed field
    const updated = await db
      .update(userAchievementsNew)
      .set({
        displayed: displayed
      })
      .where(
        and(
          eq(userAchievementsNew.id, achievementRecordId),
          eq(userAchievementsNew.userId, userId)
        )
      )
      .returning();

    if (updated.length === 0) {
      return NextResponse.json(
        { 
          error: 'Failed to update achievement display status',
          code: 'UPDATE_FAILED'
        },
        { status: 500 }
      );
    }

    return NextResponse.json(updated[0], { status: 200 });

  } catch (error) {
    console.error('PUT /api/achievements-new/:id/display error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}