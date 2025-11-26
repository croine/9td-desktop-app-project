import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { userEffects, session } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

const VALID_MOODS = ['happy', 'focused', 'energetic', 'calm', 'none'] as const;
type MoodIndicator = typeof VALID_MOODS[number];

const DEFAULT_EFFECTS = {
  moodIndicator: 'none',
  focusModeActive: false,
  celebrationActive: false,
  effectSettings: { particles: true, glow_intensity: 50 }
};

async function getUserFromToken(request: NextRequest): Promise<{ userId: string } | null> {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.substring(7);
    if (!token) {
      return null;
    }

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

    return { userId: userSession.userId };
  } catch (error) {
    console.error('Token validation error:', error);
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromToken(request);
    if (!user) {
      return NextResponse.json({ 
        error: 'Authentication required',
        code: 'UNAUTHORIZED' 
      }, { status: 401 });
    }

    const effects = await db.select()
      .from(userEffects)
      .where(eq(userEffects.userId, user.userId))
      .limit(1);

    if (effects.length === 0) {
      return NextResponse.json(DEFAULT_EFFECTS, { status: 200 });
    }

    const record = effects[0];
    return NextResponse.json({
      id: record.id,
      userId: record.userId,
      moodIndicator: record.moodIndicator,
      focusModeActive: record.focusModeActive,
      celebrationActive: record.celebrationActive,
      effectSettings: typeof record.effectSettings === 'string' 
        ? JSON.parse(record.effectSettings) 
        : record.effectSettings,
      updatedAt: record.updatedAt
    }, { status: 200 });

  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error')
    }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await getUserFromToken(request);
    if (!user) {
      return NextResponse.json({ 
        error: 'Authentication required',
        code: 'UNAUTHORIZED' 
      }, { status: 401 });
    }

    const body = await request.json();
    const { moodIndicator, focusModeActive, celebrationActive, effectSettings } = body;

    // Validate moodIndicator if provided
    if (moodIndicator !== undefined) {
      if (!VALID_MOODS.includes(moodIndicator as MoodIndicator)) {
        return NextResponse.json({ 
          error: `Invalid mood indicator. Must be one of: ${VALID_MOODS.join(', ')}`,
          code: 'INVALID_MOOD' 
        }, { status: 400 });
      }
    }

    // Validate boolean fields if provided
    if (focusModeActive !== undefined && typeof focusModeActive !== 'boolean') {
      return NextResponse.json({ 
        error: 'focusModeActive must be a boolean',
        code: 'INVALID_BOOLEAN' 
      }, { status: 400 });
    }

    if (celebrationActive !== undefined && typeof celebrationActive !== 'boolean') {
      return NextResponse.json({ 
        error: 'celebrationActive must be a boolean',
        code: 'INVALID_BOOLEAN' 
      }, { status: 400 });
    }

    // Validate effectSettings if provided
    if (effectSettings !== undefined) {
      if (typeof effectSettings !== 'object' || effectSettings === null || Array.isArray(effectSettings)) {
        return NextResponse.json({ 
          error: 'effectSettings must be a valid JSON object',
          code: 'INVALID_SETTINGS' 
        }, { status: 400 });
      }
    }

    // Check if record exists
    const existing = await db.select()
      .from(userEffects)
      .where(eq(userEffects.userId, user.userId))
      .limit(1);

    const updates: any = {
      updatedAt: new Date()
    };

    if (moodIndicator !== undefined) updates.moodIndicator = moodIndicator;
    if (focusModeActive !== undefined) updates.focusModeActive = focusModeActive;
    if (celebrationActive !== undefined) updates.celebrationActive = celebrationActive;
    if (effectSettings !== undefined) {
      updates.effectSettings = JSON.stringify(effectSettings);
    }

    if (existing.length > 0) {
      // Update existing record
      const updated = await db.update(userEffects)
        .set(updates)
        .where(eq(userEffects.userId, user.userId))
        .returning();

      const record = updated[0];
      return NextResponse.json({
        id: record.id,
        userId: record.userId,
        moodIndicator: record.moodIndicator,
        focusModeActive: record.focusModeActive,
        celebrationActive: record.celebrationActive,
        effectSettings: typeof record.effectSettings === 'string' 
          ? JSON.parse(record.effectSettings) 
          : record.effectSettings,
        updatedAt: record.updatedAt
      }, { status: 200 });
    } else {
      // Insert new record with defaults for missing fields
      const insertData: any = {
        userId: user.userId,
        moodIndicator: moodIndicator ?? 'none',
        focusModeActive: focusModeActive ?? false,
        celebrationActive: celebrationActive ?? false,
        effectSettings: effectSettings 
          ? JSON.stringify(effectSettings) 
          : JSON.stringify({ particles: true, glow_intensity: 50 }),
        updatedAt: new Date()
      };

      const created = await db.insert(userEffects)
        .values(insertData)
        .returning();

      const record = created[0];
      return NextResponse.json({
        id: record.id,
        userId: record.userId,
        moodIndicator: record.moodIndicator,
        focusModeActive: record.focusModeActive,
        celebrationActive: record.celebrationActive,
        effectSettings: typeof record.effectSettings === 'string' 
          ? JSON.parse(record.effectSettings) 
          : record.effectSettings,
        updatedAt: record.updatedAt
      }, { status: 201 });
    }

  } catch (error) {
    console.error('PUT error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error')
    }, { status: 500 });
  }
}