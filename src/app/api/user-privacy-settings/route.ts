import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { userPrivacySettings, session } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

async function validateSession(request: NextRequest) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7);
  
  try {
    const sessionRecord = await db.select()
      .from(session)
      .where(eq(session.token, token))
      .limit(1);

    if (sessionRecord.length === 0) {
      return null;
    }

    const currentSession = sessionRecord[0];
    
    if (new Date(currentSession.expiresAt) < new Date()) {
      return null;
    }

    return currentSession;
  } catch (error) {
    console.error('Session validation error:', error);
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    const currentSession = await validateSession(request);
    if (!currentSession) {
      return NextResponse.json(
        { error: 'Authentication required', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const userId = currentSession.userId;

    const settings = await db.select()
      .from(userPrivacySettings)
      .where(eq(userPrivacySettings.userId, userId))
      .limit(1);

    if (settings.length === 0) {
      return NextResponse.json({
        showReadReceipts: true
      });
    }

    return NextResponse.json(settings[0]);
  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const currentSession = await validateSession(request);
    if (!currentSession) {
      return NextResponse.json(
        { error: 'Authentication required', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const userId = currentSession.userId;

    const body = await request.json();
    const { showReadReceipts } = body;

    if (showReadReceipts !== undefined && typeof showReadReceipts !== 'boolean') {
      return NextResponse.json(
        { error: 'showReadReceipts must be a boolean', code: 'INVALID_TYPE' },
        { status: 400 }
      );
    }

    const existingSettings = await db.select()
      .from(userPrivacySettings)
      .where(eq(userPrivacySettings.userId, userId))
      .limit(1);

    // Fix: Use text timestamp as per schema
    const nowIso = new Date().toISOString();

    if (existingSettings.length > 0) {
      const updateData: { showReadReceipts?: boolean; updatedAt: string } = {
        updatedAt: nowIso
      };

      if (showReadReceipts !== undefined) {
        updateData.showReadReceipts = showReadReceipts;
      }

      const updated = await db.update(userPrivacySettings)
        .set(updateData)
        .where(eq(userPrivacySettings.userId, userId))
        .returning();

      return NextResponse.json(updated[0], { status: 200 });
    } else {
      const newSettings = await db.insert(userPrivacySettings)
        .values({
          userId: userId,
          showReadReceipts: showReadReceipts !== undefined ? showReadReceipts : true,
          createdAt: nowIso,
          updatedAt: nowIso
        })
        .returning();

      return NextResponse.json(newSettings[0], { status: 201 });
    }
  } catch (error) {
    console.error('PUT error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}