import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { tasks, taskDependencies, session } from '@/db/schema';
import { eq, and, or, inArray } from 'drizzle-orm';

interface TaskWithDependencies {
  id: number;
  title: string;
  status: string;
  priority: string;
  dueDate: Date | null;
  level: number;
  dependencies: Array<{ taskId: number; dependencyType: string }>;
  blockedBy?: number[];
  blocks?: number[];
}

interface DependencyChainResponse {
  rootTask: TaskWithDependencies;
  upstreamDependencies: TaskWithDependencies[];
  downstreamDependencies: TaskWithDependencies[];
  allTasksInChain: TaskWithDependencies[];
  criticalPath: number[];
  maxDepth: number;
}

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

    const taskId = params.id;
    if (!taskId || isNaN(parseInt(taskId))) {
      return NextResponse.json(
        { error: 'Valid task ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    const rootTaskId = parseInt(taskId);

    const rootTaskResult = await db.select()
      .from(tasks)
      .where(and(
        eq(tasks.id, rootTaskId),
        eq(tasks.userId, userId)
      ))
      .limit(1);

    if (rootTaskResult.length === 0) {
      return NextResponse.json(
        { error: 'Task not found', code: 'TASK_NOT_FOUND' },
        { status: 404 }
      );
    }

    const rootTask = rootTaskResult[0];

    const allDependencies = await db.select()
      .from(taskDependencies)
      .where(or(
        eq(taskDependencies.taskId, rootTaskId),
        eq(taskDependencies.dependsOnTaskId, rootTaskId)
      ));

    const taskIdsInChain = new Set<number>([rootTaskId]);
    const visited = new Set<number>();
    const queue: Array<{ id: number; direction: 'upstream' | 'downstream' }> = [
      { id: rootTaskId, direction: 'upstream' },
      { id: rootTaskId, direction: 'downstream' }
    ];

    while (queue.length > 0) {
      const current = queue.shift()!;
      const visitKey = `${current.id}-${current.direction}`;
      
      if (visited.has(current.id) && visited.size > 1) {
        continue;
      }
      visited.add(current.id);

      if (current.direction === 'upstream') {
        const upstreamDeps = await db.select()
          .from(taskDependencies)
          .where(eq(taskDependencies.taskId, current.id));

        for (const dep of upstreamDeps) {
          if (!taskIdsInChain.has(dep.dependsOnTaskId)) {
            taskIdsInChain.add(dep.dependsOnTaskId);
            queue.push({ id: dep.dependsOnTaskId, direction: 'upstream' });
          }
        }
      } else {
        const downstreamDeps = await db.select()
          .from(taskDependencies)
          .where(eq(taskDependencies.dependsOnTaskId, current.id));

        for (const dep of downstreamDeps) {
          if (!taskIdsInChain.has(dep.taskId)) {
            taskIdsInChain.add(dep.taskId);
            queue.push({ id: dep.taskId, direction: 'downstream' });
          }
        }
      }
    }

    const allTasksData = await db.select()
      .from(tasks)
      .where(and(
        inArray(tasks.id, Array.from(taskIdsInChain)),
        eq(tasks.userId, userId)
      ));

    const allChainDependencies = await db.select()
      .from(taskDependencies)
      .where(or(
        inArray(taskDependencies.taskId, Array.from(taskIdsInChain)),
        inArray(taskDependencies.dependsOnTaskId, Array.from(taskIdsInChain))
      ));

    const dependencyMap = new Map<number, Array<{ taskId: number; dependsOn: number; type: string }>>();
    const blockersMap = new Map<number, number[]>();
    const blocksMap = new Map<number, number[]>();

    for (const dep of allChainDependencies) {
      if (!dependencyMap.has(dep.taskId)) {
        dependencyMap.set(dep.taskId, []);
      }
      dependencyMap.get(dep.taskId)!.push({
        taskId: dep.taskId,
        dependsOn: dep.dependsOnTaskId,
        type: dep.dependencyType
      });

      if (!blockersMap.has(dep.taskId)) {
        blockersMap.set(dep.taskId, []);
      }
      blockersMap.get(dep.taskId)!.push(dep.dependsOnTaskId);

      if (!blocksMap.has(dep.dependsOnTaskId)) {
        blocksMap.set(dep.dependsOnTaskId, []);
      }
      blocksMap.get(dep.dependsOnTaskId)!.push(dep.taskId);
    }

    const taskLevels = new Map<number, number>();
    taskLevels.set(rootTaskId, 0);

    const calculateLevels = () => {
      const levelQueue: number[] = [rootTaskId];
      const levelVisited = new Set<number>();

      while (levelQueue.length > 0) {
        const currentId = levelQueue.shift()!;
        if (levelVisited.has(currentId)) continue;
        levelVisited.add(currentId);

        const currentLevel = taskLevels.get(currentId) || 0;

        const upstream = dependencyMap.get(currentId) || [];
        for (const dep of upstream) {
          if (taskIdsInChain.has(dep.dependsOn)) {
            const existingLevel = taskLevels.get(dep.dependsOn);
            const newLevel = currentLevel - 1;
            if (existingLevel === undefined || newLevel < existingLevel) {
              taskLevels.set(dep.dependsOn, newLevel);
            }
            levelQueue.push(dep.dependsOn);
          }
        }

        const downstream = blocksMap.get(currentId) || [];
        for (const depId of downstream) {
          if (taskIdsInChain.has(depId)) {
            const existingLevel = taskLevels.get(depId);
            const newLevel = currentLevel + 1;
            if (existingLevel === undefined || newLevel > existingLevel) {
              taskLevels.set(depId, newLevel);
            }
            levelQueue.push(depId);
          }
        }
      }
    };

    calculateLevels();

    const tasksWithLevels: TaskWithDependencies[] = allTasksData.map(task => ({
      id: task.id,
      title: task.title,
      status: task.status,
      priority: task.priority,
      dueDate: task.dueDate,
      level: taskLevels.get(task.id) || 0,
      dependencies: (dependencyMap.get(task.id) || []).map(d => ({
        taskId: d.dependsOn,
        dependencyType: d.type
      })),
      blockedBy: blockersMap.get(task.id) || [],
      blocks: blocksMap.get(task.id) || []
    }));

    const rootTaskWithLevel = tasksWithLevels.find(t => t.id === rootTaskId)!;
    const upstreamTasks = tasksWithLevels.filter(t => t.level < 0);
    const downstreamTasks = tasksWithLevels.filter(t => t.level > 0);

    const findCriticalPath = (): number[] => {
      const paths: number[][] = [];
      
      const dfs = (currentId: number, path: number[]) => {
        path.push(currentId);
        
        const nextTasks = blocksMap.get(currentId) || [];
        if (nextTasks.length === 0) {
          paths.push([...path]);
        } else {
          for (const nextId of nextTasks) {
            if (!path.includes(nextId) && taskIdsInChain.has(nextId)) {
              dfs(nextId, path);
            }
          }
        }
        
        path.pop();
      };

      const startTasks = Array.from(taskIdsInChain).filter(id => {
        const blockers = blockersMap.get(id) || [];
        return blockers.length === 0;
      });

      for (const startId of startTasks) {
        dfs(startId, []);
      }

      if (paths.length === 0) {
        return [rootTaskId];
      }

      const longestPath = paths.reduce((longest, current) => 
        current.length > longest.length ? current : longest
      );

      return longestPath;
    };

    const criticalPath = findCriticalPath();

    const levels = Array.from(taskLevels.values());
    const maxDepth = Math.max(...levels.map(Math.abs));

    const response: DependencyChainResponse = {
      rootTask: rootTaskWithLevel,
      upstreamDependencies: upstreamTasks,
      downstreamDependencies: downstreamTasks,
      allTasksInChain: tasksWithLevels,
      criticalPath,
      maxDepth
    };

    return NextResponse.json(response, { status: 200 });

  } catch (error) {
    console.error('GET dependency chain error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error'),
        code: 'INTERNAL_ERROR'
      },
      { status: 500 }
    );
  }
}