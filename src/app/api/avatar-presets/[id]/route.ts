import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { avatarPresets } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Validate ID is valid integer
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { 
          error: "Valid ID is required",
          code: "INVALID_ID" 
        }, 
        { status: 400 }
      );
    }

    // Query avatarPresets table filtering by id
    const preset = await db.select()
      .from(avatarPresets)
      .where(eq(avatarPresets.id, parseInt(id)))
      .limit(1);

    // Return 404 if preset not found
    if (preset.length === 0) {
      return NextResponse.json(
        { 
          error: 'Avatar preset not found',
          code: 'NOT_FOUND' 
        }, 
        { status: 404 }
      );
    }

    // Return single preset object with all fields
    return NextResponse.json(preset[0], { status: 200 });
  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error')
      }, 
      { status: 500 }
    );
  }
}