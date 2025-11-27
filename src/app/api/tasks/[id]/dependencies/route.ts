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
  const sessions = await db.select()
    .from(session)
    .where(eq(session.token, token))
    .limit(1);

  if (sessions.length === 0) {
    return null;
  }

  const userSession = sessions[0];
  if (new Date(userSession.expiresAt) < new Date()) {
    return null;
  }

  return userSession;
}

async function checkCircularDependency(
  taskId: number,
  dependsOnTaskId: number,
  dependencyType: string
): Promise<boolean> {
  // Only check for circular dependencies on blocking relationships
  if (dependencyType === 'relates_to') {
    return false;
  }

  // Check if adding this dependency would create a cycle
  const visited = new Set<number>();
  const queue: number[] = [dependsOnTaskId];

  while (queue.length > 0) {
    const currentTaskId = queue.shift()!;
    
    if (currentTaskId === taskId) {
      return true; // Circular dependency detected
    }

    if (visited.has(currentTaskId)) {
      continue;
    }
    visited.add(currentTaskId);

    // Find all tasks that the current task depends on
    const dependencies = await db.select()
      .from(taskDependencies)
      .where(
        and(
          eq(taskDependencies.taskId, currentTaskId),
          or(
            eq(taskDependencies.dependencyType, 'blocks'),
            eq(taskDependencies.dependencyType, 'blocked_by')
          )
        )
      );

    for (const dep of dependencies) {
      queue.push(dep.dependsOnTaskId);
    }
  }

  return false;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userSession = await validateSession(request);
    if (!userSession) {
      return NextResponse.json(
        { error: 'Authentication required', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const taskId = parseInt(id);

    if (!taskId || isNaN(taskId)) {
      return NextResponse.json(
        { error: 'Valid task ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    // Verify task exists and belongs to user
    const task = await db.select()
      .from(tasks)
      .where(and(eq(tasks.id, taskId), eq(tasks.userId, userSession.userId)))
      .limit(1);

    if (task.length === 0) {
      return NextResponse.json(
        { error: 'Task not found', code: 'TASK_NOT_FOUND' },
        { status: 404 }
      );
    }

    // Query all dependencies where this task is involved
    const dependencies = await db.select({
      id: taskDependencies.id,
      taskId: taskDependencies.taskId,
      dependsOnTaskId: taskDependencies.dependsOnTaskId,
      dependencyType: taskDependencies.dependencyType,
      createdAt: taskDependencies.createdAt,
    })
      .from(taskDependencies)
      .where(
        and(
          or(
            eq(taskDependencies.taskId, taskId),
            eq(taskDependencies.dependsOnTaskId, taskId)
          )
        )
      );

    // Get all related task IDs
    const relatedTaskIds = new Set<number>();
    for (const dep of dependencies) {
      if (dep.taskId !== taskId) relatedTaskIds.add(dep.taskId);
      if (dep.dependsOnTaskId !== taskId) relatedTaskIds.add(dep.dependsOnTaskId);
    }

    // Fetch all related tasks that belong to the user
    const relatedTasks = relatedTaskIds.size > 0
      ? await db.select({
          id: tasks.id,
          title: tasks.title,
          status: tasks.status,
          priority: tasks.priority,
        })
        .from(tasks)
        .where(
          and(
            eq(tasks.userId, userSession.userId),
            or(...Array.from(relatedTaskIds).map(id => eq(tasks.id, id)))
          )
        )
      : [];

    const tasksMap = new Map(relatedTasks.map(t => [t.id, t]));

    // Group dependencies by type
    const blockedBy: any[] = [];
    const blocks: any[] = [];
    const relatesTo: any[] = [];

    for (const dep of dependencies) {
      let dependencyTask;
      let isOutgoing = dep.taskId === taskId;

      if (isOutgoing) {
        dependencyTask = tasksMap.get(dep.dependsOnTaskId);
      } else {
        dependencyTask = tasksMap.get(dep.taskId);
      }

      if (!dependencyTask) continue;

      const dependencyInfo = {
        id: dep.id,
        dependencyType: dep.dependencyType,
        taskId: dep.taskId,
        dependsOnTaskId: dep.dependsOnTaskId,
        createdAt: dep.createdAt,
        dependencyTask,
      };

      if (dep.dependencyType === 'blocked_by') {
        if (isOutgoing) {
          blockedBy.push(dependencyInfo);
        } else {
          blocks.push(dependencyInfo);
        }
      } else if (dep.dependencyType === 'blocks') {
        if (isOutgoing) {
          blocks.push(dependencyInfo);
        } else {
          blockedBy.push(dependencyInfo);
        }
      } else if (dep.dependencyType === 'relates_to') {
        relatesTo.push(dependencyInfo);
      }
    }

    return NextResponse.json({
      blockedBy,
      blocks,
      relatesTo,
    });
  } catch (error) {
    console.error('GET dependencies error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userSession = await validateSession(request);
    if (!userSession) {
      return NextResponse.json(
        { error: 'Authentication required', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const taskId = parseInt(id);

    if (!taskId || isNaN(taskId)) {
      return NextResponse.json(
        { error: 'Valid task ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { dependsOnTaskId, dependencyType } = body;

    // Validate required fields
    if (!dependsOnTaskId || typeof dependsOnTaskId !== 'number') {
      return NextResponse.json(
        { error: 'dependsOnTaskId is required and must be a number', code: 'MISSING_DEPENDS_ON_TASK_ID' },
        { status: 400 }
      );
    }

    if (!dependencyType || typeof dependencyType !== 'string') {
      return NextResponse.json(
        { error: 'dependencyType is required and must be a string', code: 'MISSING_DEPENDENCY_TYPE' },
        { status: 400 }
      );
    }

    // Validate dependency type
    const validTypes = ['blocks', 'blocked_by', 'relates_to'];
    if (!validTypes.includes(dependencyType)) {
      return NextResponse.json(
        { error: 'dependencyType must be one of: blocks, blocked_by, relates_to', code: 'INVALID_DEPENDENCY_TYPE' },
        { status: 400 }
      );
    }

    // Validate tasks are not the same
    if (taskId === dependsOnTaskId) {
      return NextResponse.json(
        { error: 'A task cannot depend on itself', code: 'SELF_DEPENDENCY' },
        { status: 400 }
      );
    }

    // Verify both tasks exist and belong to user
    const [mainTask, dependencyTask] = await Promise.all([
      db.select()
        .from(tasks)
        .where(and(eq(tasks.id, taskId), eq(tasks.userId, userSession.userId)))
        .limit(1),
      db.select()
        .from(tasks)
        .where(and(eq(tasks.id, dependsOnTaskId), eq(tasks.userId, userSession.userId)))
        .limit(1),
    ]);

    if (mainTask.length === 0) {
      return NextResponse.json(
        { error: 'Main task not found', code: 'TASK_NOT_FOUND' },
        { status: 404 }
      );
    }

    if (dependencyTask.length === 0) {
      return NextResponse.json(
        { error: 'Dependency task not found', code: 'DEPENDENCY_TASK_NOT_FOUND' },
        { status: 404 }
      );
    }

    // Check for circular dependencies
    const hasCircular = await checkCircularDependency(taskId, dependsOnTaskId, dependencyType);
    if (hasCircular) {
      return NextResponse.json(
        { error: 'Cannot create dependency: would create circular dependency', code: 'CIRCULAR_DEPENDENCY' },
        { status: 400 }
      );
    }

    // Check if dependency already exists
    const existingDependency = await db.select()
      .from(taskDependencies)
      .where(
        and(
          eq(taskDependencies.taskId, taskId),
          eq(taskDependencies.dependsOnTaskId, dependsOnTaskId),
          eq(taskDependencies.dependencyType, dependencyType)
        )
      )
      .limit(1);

    if (existingDependency.length > 0) {
      return NextResponse.json(
        { error: 'Dependency already exists', code: 'DEPENDENCY_EXISTS' },
        { status: 409 }
      );
    }

    // Create the dependency
    const newDependency = await db.insert(taskDependencies)
      .values({
        taskId,
        dependsOnTaskId,
        dependencyType,
        createdAt: new Date(),
      })
      .returning();

    return NextResponse.json(newDependency[0], { status: 201 });
  } catch (error) {
    console.error('POST dependencies error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}