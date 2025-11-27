import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { tasks, taskDependencies, session } from '@/db/schema';
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

export async function DELETE(
  request: NextRequest,
  { params }: { params: { dependencyId: string } }
) {
  try {
    const userId = await validateSession(request);
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required', code: 'AUTHENTICATION_REQUIRED' },
        { status: 401 }
      );
    }

    const { dependencyId } = params;

    if (!dependencyId || isNaN(parseInt(dependencyId))) {
      return NextResponse.json(
        { error: 'Valid dependency ID is required', code: 'INVALID_DEPENDENCY_ID' },
        { status: 400 }
      );
    }

    const dependencyIdInt = parseInt(dependencyId);

    const dependency = await db
      .select()
      .from(taskDependencies)
      .where(eq(taskDependencies.id, dependencyIdInt))
      .limit(1);

    if (dependency.length === 0) {
      return NextResponse.json(
        { error: 'Task dependency not found', code: 'DEPENDENCY_NOT_FOUND' },
        { status: 404 }
      );
    }

    const dependencyRecord = dependency[0];

    const task = await db
      .select()
      .from(tasks)
      .where(
        and(
          eq(tasks.id, dependencyRecord.taskId),
          eq(tasks.userId, userId)
        )
      )
      .limit(1);

    if (task.length === 0) {
      return NextResponse.json(
        { 
          error: 'You do not have permission to delete this dependency', 
          code: 'FORBIDDEN' 
        },
        { status: 403 }
      );
    }

    const deleted = await db
      .delete(taskDependencies)
      .where(eq(taskDependencies.id, dependencyIdInt))
      .returning();

    if (deleted.length === 0) {
      return NextResponse.json(
        { error: 'Failed to delete dependency', code: 'DELETE_FAILED' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        message: 'Task dependency deleted successfully',
        dependency: deleted[0]
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('DELETE dependency error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error'),
        code: 'INTERNAL_SERVER_ERROR'
      },
      { status: 500 }
    );
  }
}