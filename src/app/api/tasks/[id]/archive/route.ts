import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { tasks, session } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

async function validateSession(request: NextRequest): Promise<string | null> {
  const authHeader = request.headers.get('authorization');
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

    const userSession = sessionRecord[0];
    
    if (new Date(userSession.expiresAt) < new Date()) {
      return null;
    }

    return userSession.userId;
  } catch (error) {
    console.error('Session validation error:', error);
    return null;
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await validateSession(request);
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required', code: 'AUTHENTICATION_REQUIRED' },
        { status: 401 }
      );
    }

    const taskId = params.id;
    if (!taskId || isNaN(parseInt(taskId))) {
      return NextResponse.json(
        { error: 'Valid task ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { archived } = body;

    if (archived === undefined || archived === null) {
      return NextResponse.json(
        { error: 'Archived field is required', code: 'MISSING_ARCHIVED_FIELD' },
        { status: 400 }
      );
    }

    if (typeof archived !== 'boolean') {
      return NextResponse.json(
        { error: 'Archived field must be a boolean', code: 'INVALID_ARCHIVED_TYPE' },
        { status: 400 }
      );
    }

    const existingTask = await db
      .select()
      .from(tasks)
      .where(and(eq(tasks.id, parseInt(taskId)), eq(tasks.userId, userId)))
      .limit(1);

    if (existingTask.length === 0) {
      return NextResponse.json(
        { error: 'Task not found or access denied', code: 'TASK_NOT_FOUND' },
        { status: 404 }
      );
    }

    const updatedTask = await db
      .update(tasks)
      .set({
        archived,
        updatedAt: new Date()
      })
      .where(and(eq(tasks.id, parseInt(taskId)), eq(tasks.userId, userId)))
      .returning();

    if (updatedTask.length === 0) {
      return NextResponse.json(
        { error: 'Failed to update task', code: 'UPDATE_FAILED' },
        { status: 500 }
      );
    }

    return NextResponse.json(updatedTask[0], { status: 200 });
  } catch (error) {
    console.error('POST /api/tasks/[id]/archive error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    );
  }
}