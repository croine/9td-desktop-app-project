import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { tasks, taskDependencies, session } from '@/db/schema';
import { eq, and, or } from 'drizzle-orm';

async function validateSession(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7);
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
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await validateSession(request);
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const id = params.id;
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    const taskId = parseInt(id);

    const taskResult = await db.select()
      .from(tasks)
      .where(and(eq(tasks.id, taskId), eq(tasks.userId, userId)))
      .limit(1);

    if (taskResult.length === 0) {
      return NextResponse.json(
        { error: 'Task not found', code: 'TASK_NOT_FOUND' },
        { status: 404 }
      );
    }

    const task = taskResult[0];

    const blockedByDeps = await db.select()
      .from(taskDependencies)
      .where(
        and(
          eq(taskDependencies.taskId, taskId),
          eq(taskDependencies.dependencyType, 'blocked_by')
        )
      );

    const blocksDeps = await db.select()
      .from(taskDependencies)
      .where(
        and(
          eq(taskDependencies.dependsOnTaskId, taskId),
          eq(taskDependencies.dependencyType, 'blocks')
        )
      );

    const relatesToDeps = await db.select()
      .from(taskDependencies)
      .where(
        and(
          or(
            eq(taskDependencies.taskId, taskId),
            eq(taskDependencies.dependsOnTaskId, taskId)
          ),
          eq(taskDependencies.dependencyType, 'relates_to')
        )
      );

    const taskWithDependencies = {
      ...task,
      dependencies: {
        blockedBy: blockedByDeps,
        blocks: blocksDeps,
        relatesTo: relatesToDeps,
      },
    };

    return NextResponse.json(taskWithDependencies, { status: 200 });
  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await validateSession(request);
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const id = params.id;
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    const taskId = parseInt(id);

    const existingTask = await db.select()
      .from(tasks)
      .where(and(eq(tasks.id, taskId), eq(tasks.userId, userId)))
      .limit(1);

    if (existingTask.length === 0) {
      return NextResponse.json(
        { error: 'Task not found', code: 'TASK_NOT_FOUND' },
        { status: 404 }
      );
    }

    const body = await request.json();

    if ('userId' in body || 'user_id' in body) {
      return NextResponse.json(
        {
          error: 'User ID cannot be provided in request body',
          code: 'USER_ID_NOT_ALLOWED',
        },
        { status: 400 }
      );
    }

    const {
      title,
      description,
      priority,
      status,
      dueDate,
      tags,
      categories,
      subtasks,
      timeTracking,
      archived,
    } = body;

    if (priority && !['low', 'medium', 'high', 'urgent'].includes(priority)) {
      return NextResponse.json(
        {
          error: 'Invalid priority. Must be one of: low, medium, high, urgent',
          code: 'INVALID_PRIORITY',
        },
        { status: 400 }
      );
    }

    if (
      status &&
      !['todo', 'in-progress', 'in-review', 'completed'].includes(status)
    ) {
      return NextResponse.json(
        {
          error:
            'Invalid status. Must be one of: todo, in-progress, in-review, completed',
          code: 'INVALID_STATUS',
        },
        { status: 400 }
      );
    }

    if (title !== undefined && (!title || title.trim() === '')) {
      return NextResponse.json(
        { error: 'Title cannot be empty', code: 'INVALID_TITLE' },
        { status: 400 }
      );
    }

    const updateData: Record<string, any> = {
      updatedAt: new Date(),
    };

    if (title !== undefined) updateData.title = title.trim();
    if (description !== undefined) updateData.description = description;
    if (priority !== undefined) updateData.priority = priority;
    if (status !== undefined) updateData.status = status;
    if (dueDate !== undefined) updateData.dueDate = dueDate ? new Date(dueDate) : null;
    if (tags !== undefined) updateData.tags = JSON.stringify(tags);
    if (categories !== undefined) updateData.categories = JSON.stringify(categories);
    if (subtasks !== undefined) updateData.subtasks = JSON.stringify(subtasks);
    if (timeTracking !== undefined) updateData.timeTracking = JSON.stringify(timeTracking);
    if (archived !== undefined) updateData.archived = archived;

    const updated = await db
      .update(tasks)
      .set(updateData)
      .where(and(eq(tasks.id, taskId), eq(tasks.userId, userId)))
      .returning();

    if (updated.length === 0) {
      return NextResponse.json(
        { error: 'Task not found', code: 'TASK_NOT_FOUND' },
        { status: 404 }
      );
    }

    return NextResponse.json(updated[0], { status: 200 });
  } catch (error) {
    console.error('PUT error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await validateSession(request);
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const id = params.id;
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    const taskId = parseInt(id);

    const existingTask = await db.select()
      .from(tasks)
      .where(and(eq(tasks.id, taskId), eq(tasks.userId, userId)))
      .limit(1);

    if (existingTask.length === 0) {
      return NextResponse.json(
        { error: 'Task not found', code: 'TASK_NOT_FOUND' },
        { status: 404 }
      );
    }

    const deleted = await db
      .delete(tasks)
      .where(and(eq(tasks.id, taskId), eq(tasks.userId, userId)))
      .returning();

    if (deleted.length === 0) {
      return NextResponse.json(
        { error: 'Task not found', code: 'TASK_NOT_FOUND' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        message: 'Task deleted successfully',
        task: deleted[0],
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}