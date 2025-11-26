import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { achievements } from '@/db/schema';
import { eq, and, desc, asc } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    
    // Parse query parameters
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '50'), 100);
    const offset = parseInt(searchParams.get('offset') ?? '0');
    const tier = searchParams.get('tier');
    const badgeType = searchParams.get('badgeType');

    // Build query
    let query = db.select().from(achievements);

    // Apply filters
    const filters = [];
    
    if (tier) {
      filters.push(eq(achievements.tier, tier));
    }
    
    if (badgeType) {
      filters.push(eq(achievements.badgeType, badgeType));
    }

    if (filters.length > 0) {
      query = query.where(and(...filters));
    }

    // Apply ordering: points descending, then tier
    // Tier ordering: platinum > gold > silver > bronze
    const results = await query
      .orderBy(desc(achievements.points))
      .limit(limit)
      .offset(offset);

    // Sort by tier as secondary sort (in-memory since SQLite doesn't have CASE for ordering easily)
    const tierOrder: Record<string, number> = {
      'platinum': 1,
      'gold': 2,
      'silver': 3,
      'bronze': 4
    };

    const sortedResults = results.sort((a, b) => {
      if (a.points === b.points) {
        return (tierOrder[a.tier] || 999) - (tierOrder[b.tier] || 999);
      }
      return 0; // Already sorted by points via SQL
    });

    return NextResponse.json(sortedResults, { status: 200 });

  } catch (error) {
    console.error('GET achievements error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error'),
        code: 'INTERNAL_SERVER_ERROR'
      },
      { status: 500 }
    );
  }
}