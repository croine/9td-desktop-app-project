import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { avatarCustomization, session } from '@/db/schema';
import { eq } from 'drizzle-orm';

const DEFAULT_VALUES = {
  cropSettings: { zoom: 1, x: 0, y: 0, rotation: 0 },
  filters: { brightness: 100, contrast: 100, saturate: 100, blur: 0 },
  borderEffect: 'none',
  borderColors: ['#6366f1'],
  effect3d: { shadow: false, depth: 0, float: false }
};

const VALID_BORDER_EFFECTS = ['none', 'pulse', 'rotate', 'gradient', 'glow'];

async function getUserFromBearerToken(request: NextRequest): Promise<string | null> {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.substring(7);
    const sessionRecord = await db.select()
      .from(session)
      .where(eq(session.token, token))
      .limit(1);

    if (sessionRecord.length === 0) {
      return null;
    }

    const now = new Date();
    if (sessionRecord[0].expiresAt < now) {
      return null;
    }

    return sessionRecord[0].userId;
  } catch (error) {
    console.error('Auth error:', error);
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    const userId = await getUserFromBearerToken(request);
    if (!userId) {
      return NextResponse.json({ 
        error: 'Authentication required',
        code: 'UNAUTHORIZED' 
      }, { status: 401 });
    }

    const customization = await db.select()
      .from(avatarCustomization)
      .where(eq(avatarCustomization.userId, userId))
      .limit(1);

    if (customization.length === 0) {
      return NextResponse.json(DEFAULT_VALUES, { status: 200 });
    }

    const record = customization[0];
    return NextResponse.json({
      id: record.id,
      userId: record.userId,
      cropSettings: record.cropSettings || DEFAULT_VALUES.cropSettings,
      filters: record.filters || DEFAULT_VALUES.filters,
      borderEffect: record.borderEffect || DEFAULT_VALUES.borderEffect,
      borderColors: record.borderColors || DEFAULT_VALUES.borderColors,
      effect3d: record.effect3d || DEFAULT_VALUES.effect3d,
      updatedAt: record.updatedAt
    }, { status: 200 });
  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error as Error).message 
    }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const userId = await getUserFromBearerToken(request);
    if (!userId) {
      return NextResponse.json({ 
        error: 'Authentication required',
        code: 'UNAUTHORIZED' 
      }, { status: 401 });
    }

    const body = await request.json();
    const { cropSettings, filters, borderEffect, borderColors, effect3d } = body;

    // Validate borderEffect if provided
    if (borderEffect !== undefined && !VALID_BORDER_EFFECTS.includes(borderEffect)) {
      return NextResponse.json({ 
        error: `Invalid border effect. Must be one of: ${VALID_BORDER_EFFECTS.join(', ')}`,
        code: 'INVALID_BORDER_EFFECT' 
      }, { status: 400 });
    }

    // Validate JSON fields if provided
    if (cropSettings !== undefined && (typeof cropSettings !== 'object' || Array.isArray(cropSettings))) {
      return NextResponse.json({ 
        error: 'cropSettings must be a valid object',
        code: 'INVALID_CROP_SETTINGS' 
      }, { status: 400 });
    }

    if (filters !== undefined && (typeof filters !== 'object' || Array.isArray(filters))) {
      return NextResponse.json({ 
        error: 'filters must be a valid object',
        code: 'INVALID_FILTERS' 
      }, { status: 400 });
    }

    if (borderColors !== undefined && !Array.isArray(borderColors)) {
      return NextResponse.json({ 
        error: 'borderColors must be a valid array',
        code: 'INVALID_BORDER_COLORS' 
      }, { status: 400 });
    }

    if (effect3d !== undefined && (typeof effect3d !== 'object' || Array.isArray(effect3d))) {
      return NextResponse.json({ 
        error: 'effect3d must be a valid object',
        code: 'INVALID_EFFECT_3D' 
      }, { status: 400 });
    }

    // Check if record exists
    const existing = await db.select()
      .from(avatarCustomization)
      .where(eq(avatarCustomization.userId, userId))
      .limit(1);

    const updateData: any = {
      updatedAt: new Date()
    };

    if (cropSettings !== undefined) updateData.cropSettings = cropSettings;
    if (filters !== undefined) updateData.filters = filters;
    if (borderEffect !== undefined) updateData.borderEffect = borderEffect;
    if (borderColors !== undefined) updateData.borderColors = borderColors;
    if (effect3d !== undefined) updateData.effect3d = effect3d;

    if (existing.length > 0) {
      // Update existing record
      const updated = await db.update(avatarCustomization)
        .set(updateData)
        .where(eq(avatarCustomization.userId, userId))
        .returning();

      return NextResponse.json(updated[0], { status: 200 });
    } else {
      // Insert new record with defaults for missing fields
      const insertData = {
        userId,
        cropSettings: cropSettings || DEFAULT_VALUES.cropSettings,
        filters: filters || DEFAULT_VALUES.filters,
        borderEffect: borderEffect || DEFAULT_VALUES.borderEffect,
        borderColors: borderColors || DEFAULT_VALUES.borderColors,
        effect3d: effect3d || DEFAULT_VALUES.effect3d,
        updatedAt: new Date()
      };

      const created = await db.insert(avatarCustomization)
        .values(insertData)
        .returning();

      return NextResponse.json(created[0], { status: 200 });
    }
  } catch (error) {
    console.error('PUT error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error as Error).message 
    }, { status: 500 });
  }
}