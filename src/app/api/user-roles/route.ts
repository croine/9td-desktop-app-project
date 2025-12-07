import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { userRoles, user, session } from '@/db/schema';
import { eq, and, gt } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    // Extract bearer token from Authorization header
    const authHeader = request.headers.get('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { 
          error: 'Authentication required',
          code: 'MISSING_AUTH_TOKEN' 
        },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Query session table to get userId using token
    const sessionResult = await db
      .select({
        userId: session.userId,
        expiresAt: session.expiresAt,
      })
      .from(session)
      .where(eq(session.token, token))
      .limit(1);

    if (sessionResult.length === 0) {
      return NextResponse.json(
        { 
          error: 'Invalid session',
          code: 'INVALID_SESSION' 
        },
        { status: 401 }
      );
    }

    const userSession = sessionResult[0];

    // Validate session is not expired
    const now = new Date();
    if (userSession.expiresAt <= now) {
      return NextResponse.json(
        { 
          error: 'Session expired',
          code: 'SESSION_EXPIRED' 
        },
        { status: 401 }
      );
    }

    const userId = userSession.userId;

    // Query userRoles table filtering by userId
    const roleResult = await db
      .select({
        role: userRoles.role,
        badgeColor: userRoles.badgeColor,
        assignedAt: userRoles.assignedAt,
        assignedById: userRoles.assignedBy,
      })
      .from(userRoles)
      .where(eq(userRoles.userId, userId))
      .limit(1);

    // If no role found, return default
    if (roleResult.length === 0) {
      return NextResponse.json(
        {
          role: 'member',
          badgeColor: null,
          assignedAt: null,
          assignedBy: null,
        },
        { status: 200 }
      );
    }

    const userRole = roleResult[0];

    // If role found and has assignedBy, join with user table to get assignedBy user details
    if (userRole.assignedById) {
      const assignedByUser = await db
        .select({
          id: user.id,
          name: user.name,
          email: user.email,
        })
        .from(user)
        .where(eq(user.id, userRole.assignedById))
        .limit(1);

      if (assignedByUser.length > 0) {
        return NextResponse.json(
          {
            role: userRole.role,
            badgeColor: userRole.badgeColor,
            assignedAt: userRole.assignedAt,
            assignedBy: {
              id: assignedByUser[0].id,
              name: assignedByUser[0].name,
              email: assignedByUser[0].email,
            },
          },
          { status: 200 }
        );
      }
    }

    // If no assignedBy user found or assignedBy is null
    return NextResponse.json(
      {
        role: userRole.role,
        badgeColor: userRole.badgeColor,
        assignedAt: userRole.assignedAt,
        assignedBy: null,
      },
      { status: 200 }
    );

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