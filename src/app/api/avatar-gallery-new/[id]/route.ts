import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { avatarGalleryNew, session } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

async function getUserFromToken(request: NextRequest): Promise<string | null> {
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

    const sessionData = sessionRecord[0];
    
    if (new Date(sessionData.expiresAt) < new Date()) {
      return null;
    }

    return sessionData.userId;
  } catch (error) {
    console.error('Token validation error:', error);
    return null;
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getUserFromToken(request);
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const { id } = await params;

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    const recordId = parseInt(id);

    const existingRecord = await db
      .select()
      .from(avatarGalleryNew)
      .where(and(eq(avatarGalleryNew.id, recordId), eq(avatarGalleryNew.userId, userId)))
      .limit(1);

    if (existingRecord.length === 0) {
      return NextResponse.json(
        { error: 'Record not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    const body = await request.json();

    if ('userId' in body || 'user_id' in body) {
      return NextResponse.json(
        {
          error: 'User ID cannot be provided in request body',
          code: 'USER_ID_NOT_ALLOWED',
        },
        { status: 400 }
      );
    }

    const updates: any = {};

    if (body.name !== undefined) {
      if (typeof body.name !== 'string' || body.name.trim().length === 0) {
        return NextResponse.json(
          { error: 'Name must be a non-empty string', code: 'INVALID_FIELDS' },
          { status: 400 }
        );
      }
      if (body.name.length > 100) {
        return NextResponse.json(
          { error: 'Name must not exceed 100 characters', code: 'INVALID_FIELDS' },
          { status: 400 }
        );
      }
      updates.name = body.name.trim();
    }

    if (body.imageUrl !== undefined) {
      if (typeof body.imageUrl !== 'string' || body.imageUrl.trim().length === 0) {
        return NextResponse.json(
          { error: 'Image URL must be a non-empty string', code: 'INVALID_FIELDS' },
          { status: 400 }
        );
      }
      updates.imageUrl = body.imageUrl.trim();
    }

    if (body.avatarType !== undefined) {
      const validTypes = ['upload', 'generated', 'preset'];
      if (!validTypes.includes(body.avatarType)) {
        return NextResponse.json(
          {
            error: 'Avatar type must be "upload", "generated", or "preset"',
            code: 'INVALID_FIELDS',
          },
          { status: 400 }
        );
      }
      updates.avatarType = body.avatarType;
    }

    if (body.settings !== undefined) {
      if (typeof body.settings !== 'object' || Array.isArray(body.settings)) {
        return NextResponse.json(
          { error: 'Settings must be a valid JSON object', code: 'INVALID_FIELDS' },
          { status: 400 }
        );
      }
      updates.settings = body.settings;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(existingRecord[0], { status: 200 });
    }

    const updated = await db
      .update(avatarGalleryNew)
      .set(updates)
      .where(and(eq(avatarGalleryNew.id, recordId), eq(avatarGalleryNew.userId, userId)))
      .returning();

    if (updated.length === 0) {
      return NextResponse.json(
        { error: 'Failed to update record', code: 'UPDATE_FAILED' },
        { status: 500 }
      );
    }

    return NextResponse.json(updated[0], { status: 200 });
  } catch (error) {
    console.error('PUT error:', error);
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
    const userId = await getUserFromToken(request);
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const { id } = await params;

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    const recordId = parseInt(id);

    const existingRecord = await db
      .select()
      .from(avatarGalleryNew)
      .where(and(eq(avatarGalleryNew.id, recordId), eq(avatarGalleryNew.userId, userId)))
      .limit(1);

    if (existingRecord.length === 0) {
      return NextResponse.json(
        { error: 'Record not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    const deleted = await db
      .delete(avatarGalleryNew)
      .where(and(eq(avatarGalleryNew.id, recordId), eq(avatarGalleryNew.userId, userId)))
      .returning();

    if (deleted.length === 0) {
      return NextResponse.json(
        { error: 'Failed to delete record', code: 'DELETE_FAILED' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        message: 'Avatar deleted successfully',
        deleted: deleted[0],
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