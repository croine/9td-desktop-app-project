import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { session, account } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    // Extract bearer token from Authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authentication required', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Look up userId from session table using the token
    const sessionRecord = await db
      .select()
      .from(session)
      .where(eq(session.token, token))
      .limit(1);

    if (sessionRecord.length === 0) {
      return NextResponse.json(
        { error: 'Authentication required', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const userId = sessionRecord[0].userId;

    // Parse request body
    const body = await request.json();
    const { currentPassword, newPassword } = body;

    // Validate inputs
    if (!currentPassword || typeof currentPassword !== 'string' || currentPassword.trim() === '') {
      return NextResponse.json(
        { error: 'Current password is required', code: 'MISSING_CURRENT_PASSWORD' },
        { status: 400 }
      );
    }

    if (!newPassword || typeof newPassword !== 'string' || newPassword.trim() === '') {
      return NextResponse.json(
        { error: 'New password is required', code: 'MISSING_NEW_PASSWORD' },
        { status: 400 }
      );
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: 'New password must be at least 8 characters long', code: 'PASSWORD_TOO_SHORT' },
        { status: 400 }
      );
    }

    // Find account record for this userId where providerId is 'credential'
    const accountRecord = await db
      .select()
      .from(account)
      .where(
        and(
          eq(account.userId, userId),
          eq(account.providerId, 'credential')
        )
      )
      .limit(1);

    if (accountRecord.length === 0) {
      return NextResponse.json(
        { error: 'Password account not found', code: 'NO_PASSWORD_ACCOUNT' },
        { status: 404 }
      );
    }

    // Verify currentPassword matches stored password
    if (accountRecord[0].password !== currentPassword) {
      return NextResponse.json(
        { error: 'Current password is incorrect', code: 'INCORRECT_PASSWORD' },
        { status: 401 }
      );
    }

    // Update account table with new password
    await db
      .update(account)
      .set({
        password: newPassword,
        updatedAt: new Date()
      })
      .where(eq(account.id, accountRecord[0].id))
      .returning();

    return NextResponse.json(
      { message: 'Password changed successfully' },
      { status: 200 }
    );

  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    );
  }
}