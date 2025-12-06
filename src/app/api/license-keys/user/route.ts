import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { licenseKeys, session } from '@/db/schema';
import { eq, and, gt, desc } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    // Extract Bearer token from Authorization header
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { 
          error: 'Authentication required',
          code: 'UNAUTHORIZED' 
        },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    if (!token) {
      return NextResponse.json(
        { 
          error: 'Authentication required',
          code: 'UNAUTHORIZED' 
        },
        { status: 401 }
      );
    }

    // Query session table to validate token and get userId
    const userSession = await db.select()
      .from(session)
      .where(eq(session.token, token))
      .limit(1);

    if (userSession.length === 0) {
      return NextResponse.json(
        { 
          error: 'Authentication required',
          code: 'UNAUTHORIZED' 
        },
        { status: 401 }
      );
    }

    const currentSession = userSession[0];
    const now = new Date();

    // Check if session is expired
    if (currentSession.expiresAt <= now) {
      return NextResponse.json(
        { 
          error: 'Authentication required',
          code: 'UNAUTHORIZED' 
        },
        { status: 401 }
      );
    }

    // Query licenseKeys table for all keys where userId matches authenticated user
    const userLicenseKeys = await db.select()
      .from(licenseKeys)
      .where(eq(licenseKeys.userId, currentSession.userId))
      .orderBy(desc(licenseKeys.createdAt));

    return NextResponse.json(
      { keys: userLicenseKeys },
      { status: 200 }
    );

  } catch (error) {
    console.error('GET license keys error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error')
      },
      { status: 500 }
    );
  }
}