import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { tasks, session } from '@/db/schema';
import { eq, and, or, like, desc, asc, isNull, sql, lt } from 'drizzle-orm';

// Helper function to validate session and get userId
async function validateSession(request: NextRequest): Promise<{ userId: string } | null> {
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

    // Check if session is expired
    const now = new Date();
    if (userSession.expiresAt < now) {
      return null;
    }

    return { userId: userSession.userId };
  } catch (error) {
    console.error('Session validation error:', error);
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    // Validate session
    const authResult = await validateSession(request);
    if (!authResult) {
      return NextResponse.json(
        { error: 'Authentication required', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const { userId } = authResult;
    const { searchParams } = new URL(request.url);

    // Parse query parameters
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');
    const archivedParam = searchParams.get('archived');
    const search = searchParams.get('search');
    const tagsParam = searchParams.get('tags');
    const categoriesParam = searchParams.get('categories');
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '50'), 100);
    const offset = parseInt(searchParams.get('offset') ?? '0');

    // Build query conditions
    const conditions = [eq(tasks.userId, userId)];

    // Filter by status
    if (status) {
      conditions.push(eq(tasks.status, status));
    }

    // Filter by priority
    if (priority) {
      conditions.push(eq(tasks.priority, priority));
    }

    // Filter by archived
    if (archivedParam !== null) {
      const archived = archivedParam === 'true';
      conditions.push(eq(tasks.archived, archived));
    }

    // Search in title and description
    if (search) {
      conditions.push(
        or(
          like(tasks.title, `%${search}%`),
          like(tasks.description, `%${search}%`)
        )!
      );
    }

    // Filter by tags (JSON contains check)
    if (tagsParam) {
      const tagsList = tagsParam.split(',').map(t => t.trim());
      const tagConditions = tagsList.map(tag => 
        sql`json_array_length(json_extract(${tasks.tags}, '$')) > 0 AND EXISTS (
          SELECT 1 FROM json_each(${tasks.tags}) 
          WHERE json_each.value = ${tag}
        )`
      );
      conditions.push(or(...tagConditions)!);
    }

    // Filter by categories (JSON contains check)
    if (categoriesParam) {
      const categoriesList = categoriesParam.split(',').map(c => c.trim());
      const categoryConditions = categoriesList.map(category => 
        sql`json_array_length(json_extract(${tasks.categories}, '$')) > 0 AND EXISTS (
          SELECT 1 FROM json_each(${tasks.categories}) 
          WHERE json_each.value = ${category}
        )`
      );
      conditions.push(or(...categoryConditions)!);
    }

    // Execute query with ordering
    const results = await db.select()
      .from(tasks)
      .where(and(...conditions))
      .orderBy(
        asc(tasks.archived),
        sql`CASE WHEN ${tasks.dueDate} IS NULL THEN 1 ELSE 0 END`,
        asc(tasks.dueDate),
        sql`CASE ${tasks.priority} 
          WHEN 'urgent' THEN 4 
          WHEN 'high' THEN 3 
          WHEN 'medium' THEN 2 
          ELSE 1 END DESC`,
        desc(tasks.createdAt)
      )
      .limit(limit)
      .offset(offset);

    return NextResponse.json(results, { status: 200 });
  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Validate session
    const authResult = await validateSession(request);
    if (!authResult) {
      return NextResponse.json(
        { error: 'Authentication required', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const { userId } = authResult;
    const body = await request.json();

    // Security check: reject if userId provided in body
    if ('userId' in body || 'user_id' in body) {
      return NextResponse.json(
        { 
          error: "User ID cannot be provided in request body",
          code: "USER_ID_NOT_ALLOWED" 
        },
        { status: 400 }
      );
    }

    // Extract and validate fields
    const {
      title,
      description,
      priority = 'medium',
      status = 'todo',
      dueDate,
      tags,
      categories,
      subtasks,
      timeTracking
    } = body;

    // Validate required field: title
    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return NextResponse.json(
        { error: 'Title is required and must be a non-empty string', code: 'INVALID_TITLE' },
        { status: 400 }
      );
    }

    // Validate title length
    if (title.length > 200) {
      return NextResponse.json(
        { error: 'Title must not exceed 200 characters', code: 'TITLE_TOO_LONG' },
        { status: 400 }
      );
    }

    // Validate priority
    const validPriorities = ['low', 'medium', 'high', 'urgent'];
    if (!validPriorities.includes(priority)) {
      return NextResponse.json(
        { 
          error: `Priority must be one of: ${validPriorities.join(', ')}`, 
          code: 'INVALID_PRIORITY' 
        },
        { status: 400 }
      );
    }

    // Validate status
    const validStatuses = ['todo', 'in-progress', 'in-review', 'completed'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { 
          error: `Status must be one of: ${validStatuses.join(', ')}`, 
          code: 'INVALID_STATUS' 
        },
        { status: 400 }
      );
    }

    // Validate tags if provided
    if (tags !== undefined && tags !== null) {
      if (!Array.isArray(tags)) {
        return NextResponse.json(
          { error: 'Tags must be an array', code: 'INVALID_TAGS' },
          { status: 400 }
        );
      }
      if (!tags.every(tag => typeof tag === 'string')) {
        return NextResponse.json(
          { error: 'All tags must be strings', code: 'INVALID_TAGS' },
          { status: 400 }
        );
      }
    }

    // Validate categories if provided
    if (categories !== undefined && categories !== null) {
      if (!Array.isArray(categories)) {
        return NextResponse.json(
          { error: 'Categories must be an array', code: 'INVALID_CATEGORIES' },
          { status: 400 }
        );
      }
      if (!categories.every(cat => typeof cat === 'string')) {
        return NextResponse.json(
          { error: 'All categories must be strings', code: 'INVALID_CATEGORIES' },
          { status: 400 }
        );
      }
    }

    // Validate subtasks if provided
    if (subtasks !== undefined && subtasks !== null) {
      if (!Array.isArray(subtasks)) {
        return NextResponse.json(
          { error: 'Subtasks must be an array', code: 'INVALID_SUBTASKS' },
          { status: 400 }
        );
      }
      if (!subtasks.every(st => typeof st === 'object' && st !== null)) {
        return NextResponse.json(
          { error: 'All subtasks must be objects', code: 'INVALID_SUBTASKS' },
          { status: 400 }
        );
      }
    }

    // Validate timeTracking if provided
    if (timeTracking !== undefined && timeTracking !== null) {
      if (typeof timeTracking !== 'object' || Array.isArray(timeTracking)) {
        return NextResponse.json(
          { error: 'Time tracking must be an object', code: 'INVALID_TIME_TRACKING' },
          { status: 400 }
        );
      }
    }

    // Parse dueDate if provided
    let parsedDueDate = null;
    if (dueDate) {
      parsedDueDate = new Date(dueDate);
      if (isNaN(parsedDueDate.getTime())) {
        return NextResponse.json(
          { error: 'Invalid due date format', code: 'INVALID_DUE_DATE' },
          { status: 400 }
        );
      }
    }

    // Prepare insert data
    const now = new Date();
    const insertData = {
      userId,
      title: title.trim(),
      description: description ? description.trim() : null,
      priority,
      status,
      dueDate: parsedDueDate,
      tags: tags ? JSON.stringify(tags) : null,
      categories: categories ? JSON.stringify(categories) : null,
      subtasks: subtasks ? JSON.stringify(subtasks) : null,
      timeTracking: timeTracking ? JSON.stringify(timeTracking) : null,
      archived: false,
      createdAt: now,
      updatedAt: now,
    };

    // Insert into database
    const newTask = await db.insert(tasks)
      .values(insertData)
      .returning();

    return NextResponse.json(newTask[0], { status: 201 });
  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}