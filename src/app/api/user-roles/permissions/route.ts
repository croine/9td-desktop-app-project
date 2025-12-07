import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { session, userRoles, rolePermissions } from '@/db/schema';
import { eq, and, gt } from 'drizzle-orm';

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
    if (!token) {
      return NextResponse.json({ 
        error: 'Invalid authentication token',
        code: 'INVALID_AUTH_TOKEN' 
      }, { status: 401 });
    }

    // Query session table to validate token and get userId
    const sessionResult = await db.select()
      .from(session)
      .where(eq(session.token, token))
      .limit(1);

    if (sessionResult.length === 0) {
      return NextResponse.json({ 
        error: 'Invalid or expired session',
        code: 'INVALID_SESSION' 
      }, { status: 401 });
    }

    const userSession = sessionResult[0];

    // Validate session is not expired
    const now = new Date();
    if (userSession.expiresAt < now) {
      return NextResponse.json({ 
        error: 'Session has expired',
        code: 'SESSION_EXPIRED' 
      }, { status: 401 });
    }

    const userId = userSession.userId;

    // Query userRoles table to get user's role (default to 'member' if not found)
    const userRoleResult = await db.select()
      .from(userRoles)
      .where(eq(userRoles.userId, userId))
      .limit(1);

    const role = userRoleResult.length > 0 ? userRoleResult[0].role : 'member';

    // Query rolePermissions table filtering by role to get all permissions
    const permissionsResult = await db.select()
      .from(rolePermissions)
      .where(eq(rolePermissions.role, role));

    const permissions = permissionsResult.map(p => p.permission);

    // Return object with role and permissions
    return NextResponse.json({
      role,
      permissions
    }, { status: 200 });

  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error'),
      code: 'INTERNAL_SERVER_ERROR'
    }, { status: 500 });
  }
}