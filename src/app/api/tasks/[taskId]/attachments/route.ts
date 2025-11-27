import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { tasks, taskAttachments, session } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { createClient } from '@supabase/supabase-js';

const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
  'application/zip'
];

const MAX_FILE_SIZE = 10485760; // 10MB in bytes

async function validateSession(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7);
  
  try {
    const sessionData = await db.select()
      .from(session)
      .where(eq(session.token, token))
      .limit(1);

    if (sessionData.length === 0) {
      return null;
    }

    const userSession = sessionData[0];
    
    // Check if session is expired
    if (new Date(userSession.expiresAt) < new Date()) {
      return null;
    }

    return { userId: userSession.userId };
  } catch (error) {
    console.error('Session validation error:', error);
    return null;
  }
}

async function verifyTaskOwnership(taskId: number, userId: string) {
  try {
    const task = await db.select()
      .from(tasks)
      .where(and(eq(tasks.id, taskId), eq(tasks.userId, userId)))
      .limit(1);

    return task.length > 0 ? task[0] : null;
  } catch (error) {
    console.error('Task verification error:', error);
    return null;
  }
}

function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[^a-zA-Z0-9.-]/g, '_')
    .replace(/_{2,}/g, '_')
    .toLowerCase();
}

interface RouteContext {
  params: Promise<{
    taskId: string;
  }>;
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    // Validate session
    const user = await validateSession(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    // Parse taskId from route params
    const { taskId: taskIdParam } = await context.params;
    
    if (!taskIdParam || isNaN(parseInt(taskIdParam))) {
      return NextResponse.json(
        { error: 'Valid task ID is required', code: 'INVALID_TASK_ID' },
        { status: 400 }
      );
    }

    const taskId = parseInt(taskIdParam);

    // Verify task exists and belongs to user
    const task = await verifyTaskOwnership(taskId, user.userId);
    if (!task) {
      return NextResponse.json(
        { error: 'Task not found or access denied', code: 'TASK_NOT_FOUND' },
        { status: 404 }
      );
    }

    // Parse multipart form data
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        { error: 'File is required', code: 'FILE_REQUIRED' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        {
          error: 'Invalid file type. Allowed types: images (JPEG, PNG, GIF, WebP), PDF, Word documents, text files, and ZIP archives',
          code: 'INVALID_FILE_TYPE'
        },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          error: 'File size exceeds maximum limit of 10MB',
          code: 'FILE_TOO_LARGE'
        },
        { status: 400 }
      );
    }

    // Generate unique storage path
    const timestamp = Date.now();
    const sanitizedFilename = sanitizeFilename(file.name);
    const storagePath = `${user.userId}/${taskId}/${timestamp}_${sanitizedFilename}`;

    // Initialize Supabase client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Convert file to buffer
    const fileBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(fileBuffer);

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('task-attachments')
      .upload(storagePath, buffer, {
        contentType: file.type,
        upsert: false
      });

    if (uploadError) {
      console.error('Supabase upload error:', uploadError);
      return NextResponse.json(
        {
          error: 'Failed to upload file to storage',
          code: 'STORAGE_UPLOAD_FAILED',
          details: uploadError.message
        },
        { status: 500 }
      );
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('task-attachments')
      .getPublicUrl(storagePath);

    const downloadUrl = urlData.publicUrl;

    // Insert record into database
    const now = new Date();
    const newAttachment = await db.insert(taskAttachments)
      .values({
        taskId,
        userId: user.userId,
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        storagePath,
        storageBucket: 'task-attachments',
        downloadUrl,
        uploadedAt: now,
        createdAt: now,
        updatedAt: now
      })
      .returning();

    return NextResponse.json(newAttachment[0], { status: 201 });

  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error'),
        code: 'INTERNAL_ERROR'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    // Validate session
    const user = await validateSession(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    // Parse taskId from route params
    const { taskId: taskIdParam } = await context.params;
    
    if (!taskIdParam || isNaN(parseInt(taskIdParam))) {
      return NextResponse.json(
        { error: 'Valid task ID is required', code: 'INVALID_TASK_ID' },
        { status: 400 }
      );
    }

    const taskId = parseInt(taskIdParam);

    // Verify task exists and belongs to user
    const task = await verifyTaskOwnership(taskId, user.userId);
    if (!task) {
      return NextResponse.json(
        { error: 'Task not found or access denied', code: 'TASK_NOT_FOUND' },
        { status: 404 }
      );
    }

    // Parse pagination parameters
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '50'), 100);
    const offset = parseInt(searchParams.get('offset') ?? '0');

    // Query attachments
    const attachments = await db.select()
      .from(taskAttachments)
      .where(eq(taskAttachments.taskId, taskId))
      .orderBy(desc(taskAttachments.uploadedAt))
      .limit(limit)
      .offset(offset);

    return NextResponse.json(attachments, { status: 200 });

  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error'),
        code: 'INTERNAL_ERROR'
      },
      { status: 500 }
    );
  }
}