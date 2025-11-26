import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { avatarPresets } from '@/db/schema';
import { eq, and, asc } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Parse query parameters
    const category = searchParams.get('category');
    const presetType = searchParams.get('presetType');
    const isPremiumParam = searchParams.get('isPremium');
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '50'), 100);
    const offset = parseInt(searchParams.get('offset') ?? '0');

    // Build query conditions
    const conditions = [];

    if (category) {
      conditions.push(eq(avatarPresets.category, category));
    }

    if (presetType) {
      conditions.push(eq(avatarPresets.presetType, presetType));
    }

    if (isPremiumParam !== null) {
      const isPremium = isPremiumParam === 'true';
      conditions.push(eq(avatarPresets.isPremium, isPremium));
    }

    // Build and execute query
    let query = db.select().from(avatarPresets);

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const results = await query
      .orderBy(asc(avatarPresets.category), asc(avatarPresets.name))
      .limit(limit)
      .offset(offset);

    return NextResponse.json(results, { status: 200 });
  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error'),
        code: 'INTERNAL_ERROR'
      },
      { status: 500 }
    );
  }
}