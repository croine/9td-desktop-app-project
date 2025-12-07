import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { userRoles, rolePermissions, session, user } from '@/db/schema';
import { eq, and, lt } from 'drizzle-orm';

const VALID_ROLES = ['member', 'moderator', 'admin'] as const;

export async function PUT(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    // 1. Extract bearer token from Authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authentication required', code: 'MISSING_AUTH_TOKEN' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);

    // 2. Query session table to validate token and get authenticated userId
    const sessionRecord = await db
      .select()
      .from(session)
      .where(eq(session.token, token))
      .limit(1);

    if (sessionRecord.length === 0) {
      return NextResponse.json(
        { error: 'Invalid session token', code: 'INVALID_SESSION' },
        { status: 401 }
      );
    }

    const userSession = sessionRecord[0];

    // 3. Validate session is not expired
    const now = new Date();
    if (userSession.expiresAt < now) {
      return NextResponse.json(
        { error: 'Session expired', code: 'SESSION_EXPIRED' },
        { status: 401 }
      );
    }

    const authenticatedUserId = userSession.userId;

    // 4. Query userRoles table to get authenticated user's role
    const authenticatedUserRole = await db
      .select()
      .from(userRoles)
      .where(eq(userRoles.userId, authenticatedUserId))
      .limit(1);

    if (authenticatedUserRole.length === 0) {
      return NextResponse.json(
        { error: 'User role not found', code: 'NO_ROLE_ASSIGNED' },
        { status: 403 }
      );
    }

    // 5. Check authenticated user has 'admin' role
    if (authenticatedUserRole[0].role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden: Admin role required', code: 'INSUFFICIENT_ROLE' },
        { status: 403 }
      );
    }

    // 6. Check authenticated user has 'manage_roles' permission
    const permission = await db
      .select()
      .from(rolePermissions)
      .where(
        and(
          eq(rolePermissions.role, 'admin'),
          eq(rolePermissions.permission, 'manage_roles')
        )
      )
      .limit(1);

    if (permission.length === 0) {
      return NextResponse.json(
        {
          error: 'Forbidden: manage_roles permission required',
          code: 'MISSING_PERMISSION',
        },
        { status: 403 }
      );
    }

    // 7. Parse request body
    const body = await request.json();
    const { role, badgeColor } = body;

    // 8. Validate role is valid value
    if (!role) {
      return NextResponse.json(
        { error: 'Role is required', code: 'MISSING_ROLE' },
        { status: 400 }
      );
    }

    if (!VALID_ROLES.includes(role)) {
      return NextResponse.json(
        {
          error: `Invalid role. Must be one of: ${VALID_ROLES.join(', ')}`,
          code: 'INVALID_ROLE',
        },
        { status: 400 }
      );
    }

    // 9. Extract userId from route params
    const targetUserId = params.userId;

    if (!targetUserId) {
      return NextResponse.json(
        { error: 'Target user ID is required', code: 'MISSING_USER_ID' },
        { status: 400 }
      );
    }

    // Check if target user exists
    const targetUser = await db
      .select()
      .from(user)
      .where(eq(user.id, targetUserId))
      .limit(1);

    if (targetUser.length === 0) {
      return NextResponse.json(
        { error: 'Target user not found', code: 'USER_NOT_FOUND' },
        { status: 404 }
      );
    }

    // 10. Check if userRoles record exists for target userId
    const existingRole = await db
      .select()
      .from(userRoles)
      .where(eq(userRoles.userId, targetUserId))
      .limit(1);

    const now_timestamp = new Date();

    if (existingRole.length > 0) {
      // 11. If exists, update role, badgeColor, assignedAt, assignedBy
      const updated = await db
        .update(userRoles)
        .set({
          role,
          badgeColor: badgeColor || existingRole[0].badgeColor,
          assignedAt: now_timestamp,
          assignedBy: authenticatedUserId,
        })
        .where(eq(userRoles.userId, targetUserId))
        .returning();

      // 13. Return updated role record with 200 status
      return NextResponse.json(updated[0], { status: 200 });
    } else {
      // 12. If not exists, insert new record
      const inserted = await db
        .insert(userRoles)
        .values({
          userId: targetUserId,
          role,
          badgeColor: badgeColor || null,
          assignedAt: now_timestamp,
          assignedBy: authenticatedUserId,
        })
        .returning();

      // 13. Return created role record with 200 status
      return NextResponse.json(inserted[0], { status: 200 });
    }
  } catch (error) {
    console.error('PUT /api/users/[userId]/role error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error: ' + (error as Error).message,
        code: 'INTERNAL_ERROR',
      },
      { status: 500 }
    );
  }
}