import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { avatarGalleryNew, session } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';

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

export async function GET(request: NextRequest) {
  try {
    const userId = await getUserFromToken(request);
    if (!userId) {
      return NextResponse.json({ 
        error: 'Authentication required',
        code: 'UNAUTHORIZED' 
      }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const avatarType = searchParams.get('avatarType');

    let query = db.select()
      .from(avatarGalleryNew)
      .where(eq(avatarGalleryNew.userId, userId))
      .orderBy(desc(avatarGalleryNew.createdAt));

    if (avatarType) {
      if (!['upload', 'generated', 'preset'].includes(avatarType)) {
        return NextResponse.json({ 
          error: 'Invalid avatar type. Must be one of: upload, generated, preset',
          code: 'INVALID_AVATAR_TYPE' 
        }, { status: 400 });
      }

      query = db.select()
        .from(avatarGalleryNew)
        .where(
          and(
            eq(avatarGalleryNew.userId, userId),
            eq(avatarGalleryNew.avatarType, avatarType)
          )
        )
        .orderBy(desc(avatarGalleryNew.createdAt));
    }

    const results = await query;

    return NextResponse.json(results, { status: 200 });
  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error as Error).message 
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserFromToken(request);
    if (!userId) {
      return NextResponse.json({ 
        error: 'Authentication required',
        code: 'UNAUTHORIZED' 
      }, { status: 401 });
    }

    const body = await request.json();
    const { name, imageUrl, avatarType, isActive, settings } = body;

    if ('userId' in body || 'user_id' in body) {
      return NextResponse.json({ 
        error: "User ID cannot be provided in request body",
        code: "USER_ID_NOT_ALLOWED" 
      }, { status: 400 });
    }

    if (!name || !imageUrl || !avatarType) {
      return NextResponse.json({ 
        error: 'Missing required fields: name, imageUrl, avatarType',
        code: 'MISSING_REQUIRED_FIELDS' 
      }, { status: 400 });
    }

    const trimmedName = name.trim();
    if (!trimmedName || trimmedName.length === 0) {
      return NextResponse.json({ 
        error: 'Name must be a non-empty string',
        code: 'INVALID_NAME' 
      }, { status: 400 });
    }

    if (trimmedName.length > 100) {
      return NextResponse.json({ 
        error: 'Name must not exceed 100 characters',
        code: 'INVALID_NAME' 
      }, { status: 400 });
    }

    const trimmedImageUrl = imageUrl.trim();
    if (!trimmedImageUrl || trimmedImageUrl.length === 0) {
      return NextResponse.json({ 
        error: 'Image URL must be a non-empty string',
        code: 'MISSING_REQUIRED_FIELDS' 
      }, { status: 400 });
    }

    if (!['upload', 'generated', 'preset'].includes(avatarType)) {
      return NextResponse.json({ 
        error: 'Avatar type must be one of: upload, generated, preset',
        code: 'INVALID_AVATAR_TYPE' 
      }, { status: 400 });
    }

    const activeStatus = typeof isActive === 'boolean' ? isActive : false;
    const avatarSettings = settings !== undefined ? settings : null;

    if (activeStatus === true) {
      await db.update(avatarGalleryNew)
        .set({ isActive: false })
        .where(eq(avatarGalleryNew.userId, userId));
    }

    const newAvatar = await db.insert(avatarGalleryNew)
      .values({
        userId,
        name: trimmedName,
        imageUrl: trimmedImageUrl,
        avatarType,
        isActive: activeStatus,
        settings: avatarSettings,
        createdAt: new Date()
      })
      .returning();

    return NextResponse.json(newAvatar[0], { status: 201 });
  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error as Error).message 
    }, { status: 500 });
  }
}