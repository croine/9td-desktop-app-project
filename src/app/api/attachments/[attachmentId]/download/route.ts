import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { tasks, taskAttachments, session } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { createClient } from '@supabase/supabase-js';

async function validateSession(request: NextRequest) {
  try {
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

    return { id: userSession.userId };
  } catch (error) {
    console.error('Session validation error:', error);
    return null;
  }
}

interface RouteContext {
  params: Promise<{
    attachmentId: string;
  }>;
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    // Authentication
    const user = await validateSession(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required', code: 'AUTHENTICATION_REQUIRED' },
        { status: 401 }
      );
    }

    // Parse and validate attachment ID
    const { attachmentId } = await context.params;

    if (!attachmentId || isNaN(parseInt(attachmentId))) {
      return NextResponse.json(
        { error: 'Valid attachment ID is required', code: 'INVALID_ATTACHMENT_ID' },
        { status: 400 }
      );
    }

    const attachmentIdInt = parseInt(attachmentId);

    // Query attachment with task join to verify ownership
    const attachment = await db
      .select({
        id: taskAttachments.id,
        taskId: taskAttachments.taskId,
        fileName: taskAttachments.fileName,
        fileType: taskAttachments.fileType,
        fileSize: taskAttachments.fileSize,
        storagePath: taskAttachments.storagePath,
        storageBucket: taskAttachments.storageBucket,
        taskUserId: tasks.userId,
      })
      .from(taskAttachments)
      .innerJoin(tasks, eq(taskAttachments.taskId, tasks.id))
      .where(eq(taskAttachments.id, attachmentIdInt))
      .limit(1);

    // Check if attachment exists
    if (attachment.length === 0) {
      return NextResponse.json(
        { error: 'Attachment not found', code: 'ATTACHMENT_NOT_FOUND' },
        { status: 404 }
      );
    }

    const attachmentData = attachment[0];

    // Verify task ownership
    if (attachmentData.taskUserId !== user.id) {
      return NextResponse.json(
        { error: 'Access denied: You do not own this attachment', code: 'ACCESS_DENIED' },
        { status: 403 }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing Supabase configuration');
      return NextResponse.json(
        { error: 'Storage service configuration error', code: 'STORAGE_CONFIG_ERROR' },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Generate signed URL with 24-hour expiry
    const expiresIn = 86400; // 24 hours in seconds
    const { data, error } = await supabase.storage
      .from(attachmentData.storageBucket)
      .createSignedUrl(attachmentData.storagePath, expiresIn);

    if (error) {
      console.error('Error generating signed URL:', error);
      return NextResponse.json(
        { error: 'Failed to generate download URL: ' + error.message, code: 'SIGNED_URL_ERROR' },
        { status: 500 }
      );
    }

    if (!data || !data.signedUrl) {
      console.error('No signed URL returned from Supabase');
      return NextResponse.json(
        { error: 'Failed to generate download URL', code: 'NO_SIGNED_URL' },
        { status: 500 }
      );
    }

    // Return success response with download information
    return NextResponse.json({
      downloadUrl: data.signedUrl,
      fileName: attachmentData.fileName,
      fileType: attachmentData.fileType,
      fileSize: attachmentData.fileSize,
      expiresIn: expiresIn,
    }, { status: 200 });

  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    );
  }
}