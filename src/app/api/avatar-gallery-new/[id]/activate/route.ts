import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { avatarGalleryNew, session } from '@/db/schema';
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
    const id = params.id;
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    const avatarId = parseInt(id);

    // Verify record exists and belongs to user
    const existingAvatar = await db
      .select()
      .from(avatarGalleryNew)
      .where(and(eq(avatarGalleryNew.id, avatarId), eq(avatarGalleryNew.userId, userId)))
      .limit(1);

    if (existingAvatar.length === 0) {
      return NextResponse.json(
        { error: 'Avatar not found or does not belong to user', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    // Transaction logic:
    // 1. Deactivate all avatars for this user
    await db
      .update(avatarGalleryNew)
      .set({
        isActive: false
      })
      .where(eq(avatarGalleryNew.userId, userId));

    // 2. Activate the specific avatar
    const activated = await db
      .update(avatarGalleryNew)
      .set({
        isActive: true
      })
      .where(and(eq(avatarGalleryNew.id, avatarId), eq(avatarGalleryNew.userId, userId)))
      .returning();

    if (activated.length === 0) {
      return NextResponse.json(
        { error: 'Failed to activate avatar', code: 'ACTIVATION_FAILED' },
        { status: 500 }
      );
    }

    return NextResponse.json(activated[0], { status: 200 });
  } catch (error) {
    console.error('PUT /api/avatar-gallery-new/:id/activate error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}