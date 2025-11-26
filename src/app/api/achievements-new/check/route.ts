import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { achievements, userAchievementsNew, userStats, session } from '@/db/schema';
import { eq, and, lt } from 'drizzle-orm';

interface UnlockCriteria {
  type: 'tasks_completed' | 'streak' | 'tasks_today' | 'tasks_week';
  value: number;
}

interface Achievement {
  id: number;
  name: string;
  description: string | null;
  icon: string | null;
  badgeType: string;
  unlockCriteria: UnlockCriteria;
  points: number;
  tier: string;
  createdAt: Date;
}

export async function POST(request: NextRequest) {
  try {
    // Extract bearer token from Authorization header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authorization token required', code: 'MISSING_TOKEN' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Query session table to validate token and get userId
    const sessionResult = await db
      .select()
      .from(session)
      .where(eq(session.token, token))
      .limit(1);

    if (sessionResult.length === 0) {
      return NextResponse.json(
        { error: 'Invalid or expired token', code: 'INVALID_TOKEN' },
        { status: 401 }
      );
    }

    const userSession = sessionResult[0];

    // Check if session is expired
    if (new Date(userSession.expiresAt) < new Date()) {
      return NextResponse.json(
        { error: 'Session expired', code: 'SESSION_EXPIRED' },
        { status: 401 }
      );
    }

    const userId = userSession.userId;

    // Query user stats for the current user
    const userStatsResult = await db
      .select()
      .from(userStats)
      .where(eq(userStats.userId, userId))
      .limit(1);

    if (userStatsResult.length === 0) {
      return NextResponse.json(
        { error: 'User stats not found', code: 'STATS_NOT_FOUND' },
        { status: 404 }
      );
    }

    const stats = userStatsResult[0];

    // Query all achievements
    const allAchievements = await db.select().from(achievements);

    // Query already unlocked achievements for this user
    const unlockedAchievements = await db
      .select()
      .from(userAchievementsNew)
      .where(eq(userAchievementsNew.userId, userId));

    const unlockedAchievementIds = new Set(
      unlockedAchievements.map((ua) => ua.achievementId)
    );

    const newlyUnlocked: Achievement[] = [];
    const alreadyUnlocked: number[] = Array.from(unlockedAchievementIds);

    // Check each achievement
    for (const achievement of allAchievements) {
      // Skip if already unlocked
      if (unlockedAchievementIds.has(achievement.id)) {
        continue;
      }

      // Parse unlock criteria
      let criteria: UnlockCriteria;
      try {
        criteria =
          typeof achievement.unlockCriteria === 'string'
            ? JSON.parse(achievement.unlockCriteria)
            : achievement.unlockCriteria;
      } catch (error) {
        console.error(
          `Failed to parse unlock criteria for achievement ${achievement.id}:`,
          error
        );
        continue;
      }

      // Check if user meets criteria
      let criteriaMetCondition = false;

      switch (criteria.type) {
        case 'tasks_completed':
          criteriaMetCondition = stats.tasksCompletedAllTime >= criteria.value;
          break;
        case 'streak':
          criteriaMetCondition = stats.currentStreakDays >= criteria.value;
          break;
        case 'tasks_today':
          criteriaMetCondition = stats.tasksCompletedToday >= criteria.value;
          break;
        case 'tasks_week':
          criteriaMetCondition = stats.tasksCompletedThisWeek >= criteria.value;
          break;
        default:
          console.warn(`Unknown criteria type: ${criteria.type}`);
          continue;
      }

      // If criteria met, unlock the achievement
      if (criteriaMetCondition) {
        await db.insert(userAchievementsNew).values({
          userId,
          achievementId: achievement.id,
          unlockedAt: new Date(),
          displayed: true,
          notified: false,
        });

        newlyUnlocked.push(achievement as Achievement);
      }
    }

    return NextResponse.json(
      {
        newlyUnlocked,
        alreadyUnlocked,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('POST /api/achievements-new/check error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error'),
      },
      { status: 500 }
    );
  }
}