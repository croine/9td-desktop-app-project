import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { tasks, taskAttachments, session } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { createClient } from '@supabase/supabase-js';

interface RouteContext {
  params: Promise<{
    attachmentId: string;
  }>;
}

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

function initializeSupabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase configuration missing');
  }

  return createClient(supabaseUrl, supabaseKey);
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const user = await validateSession(request);
    if (!user) {
      return NextResponse.json({ 
        error: 'Authentication required',
        code: 'AUTHENTICATION_REQUIRED' 
      }, { status: 401 });
    }

    const { attachmentId } = await context.params;

    if (!attachmentId || isNaN(parseInt(attachmentId))) {
      return NextResponse.json({ 
        error: 'Valid attachment ID is required',
        code: 'INVALID_ATTACHMENT_ID' 
      }, { status: 400 });
    }

    const attachmentResult = await db.select({
      attachment: taskAttachments,
      task: tasks
    })
      .from(taskAttachments)
      .leftJoin(tasks, eq(taskAttachments.taskId, tasks.id))
      .where(eq(taskAttachments.id, parseInt(attachmentId)))
      .limit(1);

    if (attachmentResult.length === 0) {
      return NextResponse.json({ 
        error: 'Attachment not found',
        code: 'ATTACHMENT_NOT_FOUND' 
      }, { status: 404 });
    }

    const { attachment, task } = attachmentResult[0];

    if (!task || task.userId !== user.id) {
      return NextResponse.json({ 
        error: 'Access denied',
        code: 'FORBIDDEN' 
      }, { status: 403 });
    }

    const supabase = initializeSupabase();

    const { data: signedUrlData, error: signedUrlError } = await supabase.storage
      .from(attachment.storageBucket)
      .createSignedUrl(attachment.storagePath, 86400);

    if (signedUrlError) {
      console.error('Signed URL generation error:', signedUrlError);
      return NextResponse.json({ 
        error: 'Failed to generate download URL',
        code: 'SIGNED_URL_ERROR' 
      }, { status: 500 });
    }

    return NextResponse.json({
      ...attachment,
      signedUrl: signedUrlData.signedUrl
    }, { status: 200 });

  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error')
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const user = await validateSession(request);
    if (!user) {
      return NextResponse.json({ 
        error: 'Authentication required',
        code: 'AUTHENTICATION_REQUIRED' 
      }, { status: 401 });
    }

    const { attachmentId } = await context.params;

    if (!attachmentId || isNaN(parseInt(attachmentId))) {
      return NextResponse.json({ 
        error: 'Valid attachment ID is required',
        code: 'INVALID_ATTACHMENT_ID' 
      }, { status: 400 });
    }

    const attachmentResult = await db.select({
      attachment: taskAttachments,
      task: tasks
    })
      .from(taskAttachments)
      .leftJoin(tasks, eq(taskAttachments.taskId, tasks.id))
      .where(eq(taskAttachments.id, parseInt(attachmentId)))
      .limit(1);

    if (attachmentResult.length === 0) {
      return NextResponse.json({ 
        error: 'Attachment not found',
        code: 'ATTACHMENT_NOT_FOUND' 
      }, { status: 404 });
    }

    const { attachment, task } = attachmentResult[0];

    if (!task || task.userId !== user.id) {
      return NextResponse.json({ 
        error: 'Access denied',
        code: 'FORBIDDEN' 
      }, { status: 403 });
    }

    const supabase = initializeSupabase();

    const { error: storageError } = await supabase.storage
      .from(attachment.storageBucket)
      .remove([attachment.storagePath]);

    if (storageError) {
      console.error('Storage deletion error:', storageError);
      return NextResponse.json({ 
        error: 'Failed to delete file from storage',
        code: 'STORAGE_DELETE_ERROR' 
      }, { status: 500 });
    }

    const deletedAttachment = await db.delete(taskAttachments)
      .where(eq(taskAttachments.id, parseInt(attachmentId)))
      .returning();

    if (deletedAttachment.length === 0) {
      return NextResponse.json({ 
        error: 'Failed to delete attachment record',
        code: 'DATABASE_DELETE_ERROR' 
      }, { status: 500 });
    }

    return NextResponse.json({
      message: 'Attachment deleted successfully',
      deletedAttachment: deletedAttachment[0]
    }, { status: 200 });

  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error')
    }, { status: 500 });
  }
}