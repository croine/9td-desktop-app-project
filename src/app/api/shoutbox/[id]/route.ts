import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { shouts, session } from '@/db/schema';
import { eq, and, gt } from 'drizzle-orm';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const token = authHeader.substring(7);

    // Query session table to validate token
    const sessionRecord = await db
      .select()
      .from(session)
      .where(eq(session.token, token))
      .limit(1);

    if (sessionRecord.length === 0) {
      return NextResponse.json(
        { 
          error: 'Invalid authentication token',
          code: 'UNAUTHORIZED'
        },
        { status: 401 }
      );
    }

    // Check if session is expired
    const now = new Date();
    if (sessionRecord[0].expiresAt <= now) {
      return NextResponse.json(
        { 
          error: 'Session expired',
          code: 'UNAUTHORIZED'
        },
        { status: 401 }
      );
    }

    const authenticatedUserId = sessionRecord[0].userId;

    // Parse and validate ID from route params
    const { id: idParam } = await params;
    const id = parseInt(idParam);

    if (isNaN(id) || id <= 0) {
      return NextResponse.json(
        { 
          error: 'Valid shout ID is required',
          code: 'INVALID_ID'
        },
        { status: 400 }
      );
    }

    // Query shout by ID
    const shout = await db
      .select()
      .from(shouts)
      .where(eq(shouts.id, id))
      .limit(1);

    if (shout.length === 0) {
      return NextResponse.json(
        { 
          error: 'Shout not found',
          code: 'NOT_FOUND'
        },
        { status: 404 }
      );
    }

    // Verify ownership
    if (shout[0].userId !== authenticatedUserId) {
      return NextResponse.json(
        { 
          error: 'You do not have permission to delete this shout',
          code: 'FORBIDDEN'
        },
        { status: 403 }
      );
    }

    // Check if already deleted
    if (shout[0].isDeleted) {
      return NextResponse.json(
        { 
          error: 'Shout is already deleted',
          code: 'ALREADY_DELETED'
        },
        { status: 400 }
      );
    }

    // Soft delete: update isDeleted to true and updatedAt
    const updated = await db
      .update(shouts)
      .set({
        isDeleted: true,
        updatedAt: new Date()
      })
      .where(
        and(
          eq(shouts.id, id),
          eq(shouts.userId, authenticatedUserId)
        )
      )
      .returning();

    if (updated.length === 0) {
      return NextResponse.json(
        { 
          error: 'Failed to delete shout',
          code: 'DELETE_FAILED'
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { 
        message: 'Shout deleted successfully',
        shoutId: id
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('DELETE /api/shoutbox/[id] error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error'),
        code: 'INTERNAL_ERROR'
      },
      { status: 500 }
    );
  }
}