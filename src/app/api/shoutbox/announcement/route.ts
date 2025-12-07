import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { shouts, user, session, userRoles, rolePermissions } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authentication required', code: 'MISSING_AUTH_TOKEN' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);

    const sessionRecord = await db.select()
      .from(session)
      .where(eq(session.token, token))
      .limit(1);

    if (sessionRecord.length === 0) {
      return NextResponse.json(
        { error: 'Invalid or expired session', code: 'INVALID_SESSION' },
        { status: 401 }
      );
    }

    const userSession = sessionRecord[0];

    if (new Date(userSession.expiresAt) < new Date()) {
      return NextResponse.json(
        { error: 'Session has expired', code: 'SESSION_EXPIRED' },
        { status: 401 }
      );
    }

    const authenticatedUserId = userSession.userId;

    const userRoleRecord = await db.select()
      .from(userRoles)
      .where(eq(userRoles.userId, authenticatedUserId))
      .limit(1);

    const userRole = userRoleRecord.length > 0 ? userRoleRecord[0].role : 'member';

    const permissionRecord = await db.select()
      .from(rolePermissions)
      .where(
        and(
          eq(rolePermissions.role, userRole),
          eq(rolePermissions.permission, 'send_announcements')
        )
      )
      .limit(1);

    if (permissionRecord.length === 0) {
      return NextResponse.json(
        { 
          error: 'Insufficient permissions to send announcements',
          code: 'INSUFFICIENT_PERMISSIONS'
        },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { message, priority } = body;

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Message is required', code: 'MISSING_MESSAGE' },
        { status: 400 }
      );
    }

    const trimmedMessage = message.trim();

    if (trimmedMessage.length === 0) {
      return NextResponse.json(
        { error: 'Message cannot be empty', code: 'EMPTY_MESSAGE' },
        { status: 400 }
      );
    }

    if (trimmedMessage.length > 500) {
      return NextResponse.json(
        { 
          error: 'Message exceeds maximum length of 500 characters',
          code: 'MESSAGE_TOO_LONG'
        },
        { status: 400 }
      );
    }

    const validPriorities = ['low', 'medium', 'high'];
    const announcementPriority = priority || 'medium';

    if (!validPriorities.includes(announcementPriority)) {
      return NextResponse.json(
        { 
          error: `Invalid priority. Must be one of: ${validPriorities.join(', ')}`,
          code: 'INVALID_PRIORITY'
        },
        { status: 400 }
      );
    }

    const now = new Date();
    const newAnnouncement = await db.insert(shouts)
      .values({
        userId: authenticatedUserId,
        message: trimmedMessage,
        isAnnouncement: true,
        announcementPriority: announcementPriority,
        replyToId: null,
        editedAt: null,
        attachmentUrl: null,
        attachmentType: null,
        attachmentName: null,
        gifUrl: null,
        gifTitle: null,
        gifProvider: null,
        voiceMessageUrl: null,
        voiceMessageDuration: null,
        voiceMessageWaveform: null,
        createdAt: now,
        updatedAt: now,
        isDeleted: false
      })
      .returning();

    if (newAnnouncement.length === 0) {
      return NextResponse.json(
        { error: 'Failed to create announcement', code: 'CREATE_FAILED' },
        { status: 500 }
      );
    }

    const userData = await db.select()
      .from(user)
      .where(eq(user.id, authenticatedUserId))
      .limit(1);

    return NextResponse.json({
      id: newAnnouncement[0].id,
      message: newAnnouncement[0].message,
      isAnnouncement: newAnnouncement[0].isAnnouncement,
      announcementPriority: newAnnouncement[0].announcementPriority,
      createdAt: newAnnouncement[0].createdAt,
      updatedAt: newAnnouncement[0].updatedAt,
      user: {
        id: userData[0].id,
        name: userData[0].name,
        email: userData[0].email
      }
    }, { status: 201 });

  } catch (error) {
    console.error('POST announcement error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    );
  }
}