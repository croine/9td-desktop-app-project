import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { customEmojis, user, session } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';

async function validateSession(request: NextRequest) {
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

    return userSession;
  } catch (error) {
    console.error('Session validation error:', error);
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    const userSession = await validateSession(request);
    if (!userSession) {
      return NextResponse.json({ 
        error: 'Authentication required',
        code: 'UNAUTHORIZED' 
      }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get('category');
    const isAnimatedParam = searchParams.get('isAnimated');

    let query = db.select({
      id: customEmojis.id,
      name: customEmojis.name,
      imageUrl: customEmojis.imageUrl,
      category: customEmojis.category,
      isAnimated: customEmojis.isAnimated,
      uploadedBy: customEmojis.uploadedBy,
      createdAt: customEmojis.createdAt,
      uploaderName: user.name,
      uploaderEmail: user.email,
    })
    .from(customEmojis)
    .leftJoin(user, eq(customEmojis.uploadedBy, user.id));

    const conditions = [];

    if (category) {
      conditions.push(eq(customEmojis.category, category));
    }

    if (isAnimatedParam !== null) {
      const isAnimated = isAnimatedParam === 'true';
      conditions.push(eq(customEmojis.isAnimated, isAnimated));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }

    const results = await query.orderBy(desc(customEmojis.createdAt));

    const formattedResults = results.map(row => ({
      id: row.id,
      name: row.name,
      imageUrl: row.imageUrl,
      category: row.category,
      isAnimated: row.isAnimated,
      uploadedBy: row.uploadedBy,
      createdAt: row.createdAt,
      uploader: {
        name: row.uploaderName,
        email: row.uploaderEmail,
      },
    }));

    return NextResponse.json(formattedResults, { status: 200 });
  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error as Error).message 
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const userSession = await validateSession(request);
    if (!userSession) {
      return NextResponse.json({ 
        error: 'Authentication required',
        code: 'UNAUTHORIZED' 
      }, { status: 401 });
    }

    const userId = userSession.userId;
    const body = await request.json();
    const { name, imageUrl, category, isAnimated } = body;

    if (!name || !imageUrl || !category) {
      return NextResponse.json({ 
        error: 'Missing required fields: name, imageUrl, and category are required',
        code: 'MISSING_REQUIRED_FIELDS' 
      }, { status: 400 });
    }

    const trimmedName = name.trim();
    const trimmedImageUrl = imageUrl.trim();

    if (!trimmedName.startsWith(':') || !trimmedName.endsWith(':')) {
      return NextResponse.json({ 
        error: 'Emoji name must start and end with ":" (e.g., ":custom:")',
        code: 'INVALID_NAME_FORMAT' 
      }, { status: 400 });
    }

    if (trimmedName.length < 3 || trimmedName.length > 50) {
      return NextResponse.json({ 
        error: 'Emoji name must be between 3 and 50 characters',
        code: 'INVALID_NAME_LENGTH' 
      }, { status: 400 });
    }

    if (!trimmedImageUrl) {
      return NextResponse.json({ 
        error: 'Image URL cannot be empty',
        code: 'INVALID_IMAGE_URL' 
      }, { status: 400 });
    }

    const validCategories = ['custom', 'team', 'animated'];
    if (!validCategories.includes(category)) {
      return NextResponse.json({ 
        error: 'Category must be one of: custom, team, animated',
        code: 'INVALID_CATEGORY' 
      }, { status: 400 });
    }

    const existingEmoji = await db.select()
      .from(customEmojis)
      .where(eq(customEmojis.name, trimmedName))
      .limit(1);

    if (existingEmoji.length > 0) {
      return NextResponse.json({ 
        error: 'An emoji with this name already exists',
        code: 'DUPLICATE_EMOJI_NAME' 
      }, { status: 409 });
    }

    const newEmoji = await db.insert(customEmojis)
      .values({
        name: trimmedName,
        imageUrl: trimmedImageUrl,
        category,
        isAnimated: isAnimated || false,
        uploadedBy: userId,
        createdAt: new Date().toISOString(),
      })
      .returning();

    return NextResponse.json(newEmoji[0], { status: 201 });
  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error as Error).message 
    }, { status: 500 });
  }
}