import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { userAchievementsNew, achievements, session } from '@/db/schema';
import { eq, and, desc, lte } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    // Extract bearer token from Authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authentication required', code: 'MISSING_TOKEN' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);

    // Validate session and get userId
    const userSession = await db
      .select()
      .from(session)
      .where(eq(session.token, token))
      .limit(1);

    if (userSession.length === 0) {
      return NextResponse.json(
        { error: 'Invalid or expired session', code: 'INVALID_SESSION' },
        { status: 401 }
      );
    }

    const currentSession = userSession[0];

    // Check if session is expired
    if (new Date(currentSession.expiresAt) < new Date()) {
      return NextResponse.json(
        { error: 'Session expired', code: 'SESSION_EXPIRED' },
        { status: 401 }
      );
    }

    const userId = currentSession.userId;

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const displayedParam = searchParams.get('displayed');
    const tierParam = searchParams.get('tier');

    // Build query with join
    let query = db
      .select({
        id: userAchievementsNew.id,
        achievementId: achievements.id,
        name: achievements.name,
        description: achievements.description,
        icon: achievements.icon,
        badgeType: achievements.badgeType,
        points: achievements.points,
        tier: achievements.tier,
        unlockedAt: userAchievementsNew.unlockedAt,
        displayed: userAchievementsNew.displayed,
        notified: userAchievementsNew.notified,
      })
      .from(userAchievementsNew)
      .innerJoin(
        achievements,
        eq(userAchievementsNew.achievementId, achievements.id)
      );

    // Build where conditions
    const whereConditions = [eq(userAchievementsNew.userId, userId)];

    // Add optional filters
    if (displayedParam !== null) {
      const displayedValue = displayedParam === 'true';
      whereConditions.push(eq(userAchievementsNew.displayed, displayedValue));
    }

    if (tierParam) {
      const validTiers = ['bronze', 'silver', 'gold', 'platinum'];
      if (!validTiers.includes(tierParam.toLowerCase())) {
        return NextResponse.json(
          {
            error: 'Invalid tier parameter. Must be one of: bronze, silver, gold, platinum',
            code: 'INVALID_TIER',
          },
          { status: 400 }
        );
      }
      whereConditions.push(eq(achievements.tier, tierParam.toLowerCase()));
    }

    // Apply where conditions
    if (whereConditions.length > 0) {
      query = query.where(and(...whereConditions));
    }

    // Order by unlockedAt descending (most recent first)
    const results = await query.orderBy(desc(userAchievementsNew.unlockedAt));

    return NextResponse.json(results, { status: 200 });
  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}