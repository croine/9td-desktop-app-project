import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { licenseKeys, session } from '@/db/schema';
import { eq, and, gt } from 'drizzle-orm';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Extract Bearer token from Authorization header
    const authHeader = request.headers.get('Authorization');
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

    // Validate token and get userId from session
    const sessions = await db
      .select()
      .from(session)
      .where(
        and(
          eq(session.token, token),
          gt(session.expiresAt, new Date())
        )
      )
      .limit(1);

    if (sessions.length === 0) {
      return NextResponse.json(
        { 
          error: 'Invalid or expired token',
          code: 'UNAUTHORIZED' 
        },
        { status: 401 }
      );
    }

    const userSession = sessions[0];
    const userId = userSession.userId;

    // Validate ID parameter
    const id = params.id;
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { 
          error: 'Valid ID is required',
          code: 'INVALID_ID' 
        },
        { status: 400 }
      );
    }

    const licenseKeyId = parseInt(id);

    // Query license key with user ownership verification
    const keys = await db
      .select()
      .from(licenseKeys)
      .where(
        and(
          eq(licenseKeys.id, licenseKeyId),
          eq(licenseKeys.userId, userId)
        )
      )
      .limit(1);

    if (keys.length === 0) {
      return NextResponse.json(
        { 
          error: 'License key not found or access denied',
          code: 'NOT_FOUND' 
        },
        { status: 404 }
      );
    }

    const licenseKey = keys[0];

    // Check if already revoked
    if (licenseKey.status === 'revoked') {
      return NextResponse.json(
        { 
          error: 'License key is already revoked',
          code: 'ALREADY_REVOKED' 
        },
        { status: 400 }
      );
    }

    // Update license key to revoked status
    const updated = await db
      .update(licenseKeys)
      .set({
        status: 'revoked',
        updatedAt: new Date()
      })
      .where(
        and(
          eq(licenseKeys.id, licenseKeyId),
          eq(licenseKeys.userId, userId)
        )
      )
      .returning();

    if (updated.length === 0) {
      return NextResponse.json(
        { 
          error: 'Failed to revoke license key',
          code: 'UPDATE_FAILED' 
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: 'License key revoked successfully'
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('DELETE license key error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error')
      },
      { status: 500 }
    );
  }
}