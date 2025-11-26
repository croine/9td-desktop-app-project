import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { avatarFramesNew, userFrames, session } from '@/db/schema';
import { eq, and, leftJoin, asc, sql } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    // Extract bearer token from Authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ 
        error: 'Authentication required',
        code: 'MISSING_AUTH_TOKEN' 
      }, { status: 401 });
    }

    const token = authHeader.substring(7);

    // Validate session and get userId
    const sessionRecord = await db.select()
      .from(session)
      .where(eq(session.token, token))
      .limit(1);

    if (sessionRecord.length === 0) {
      return NextResponse.json({ 
        error: 'Invalid or expired session',
        code: 'INVALID_SESSION' 
      }, { status: 401 });
    }

    const currentSession = sessionRecord[0];
    
    // Check if session is expired
    if (new Date(currentSession.expiresAt) < new Date()) {
      return NextResponse.json({ 
        error: 'Session expired',
        code: 'SESSION_EXPIRED' 
      }, { status: 401 });
    }

    const userId = currentSession.userId;

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const frameType = searchParams.get('frameType');
    const season = searchParams.get('season');
    const unlockedFilter = searchParams.get('unlocked');

    // Build the query with left join to get unlock status
    let query = db.select({
      id: avatarFramesNew.id,
      name: avatarFramesNew.name,
      frameType: avatarFramesNew.frameType,
      styleConfig: avatarFramesNew.styleConfig,
      unlockRequirement: avatarFramesNew.unlockRequirement,
      isAnimated: avatarFramesNew.isAnimated,
      previewUrl: avatarFramesNew.previewUrl,
      season: avatarFramesNew.season,
      userFrameId: userFrames.id,
      userFrameIsActive: userFrames.isActive,
      userFrameUnlockedAt: userFrames.unlockedAt,
    })
    .from(avatarFramesNew)
    .leftJoin(
      userFrames,
      and(
        eq(userFrames.frameId, avatarFramesNew.id),
        eq(userFrames.userId, userId)
      )
    );

    // Apply filters
    const conditions = [];

    if (frameType) {
      conditions.push(eq(avatarFramesNew.frameType, frameType));
    }

    if (season) {
      conditions.push(eq(avatarFramesNew.season, season));
    }

    // Execute query
    let results = await query.orderBy(
      asc(avatarFramesNew.frameType),
      asc(avatarFramesNew.name)
    );

    // Transform results to include unlock status
    let frames = results.map(row => ({
      id: row.id,
      name: row.name,
      frameType: row.frameType,
      styleConfig: row.styleConfig,
      unlockRequirement: row.unlockRequirement,
      isAnimated: row.isAnimated,
      previewUrl: row.previewUrl,
      season: row.season,
      isUnlocked: row.userFrameId !== null,
      isActive: row.userFrameIsActive !== null ? row.userFrameIsActive : false,
      unlockedAt: row.userFrameUnlockedAt !== null ? row.userFrameUnlockedAt : null,
    }));

    // Apply unlocked filter after transformation
    if (unlockedFilter !== null) {
      const isUnlockedFilter = unlockedFilter === 'true';
      frames = frames.filter(frame => frame.isUnlocked === isUnlockedFilter);
    }

    return NextResponse.json(frames, { status: 200 });

  } catch (error) {
    console.error('GET avatar-frames-new error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error')
    }, { status: 500 });
  }
}