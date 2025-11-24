import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { user, userPreferences, session } from '@/db/schema';
import { eq } from 'drizzle-orm';

// Helper function to authenticate user via bearer token
async function authenticateRequest(request: NextRequest): Promise<string | null> {
  const authHeader = request.headers.get('authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  
  const token = authHeader.substring(7); // Remove 'Bearer ' prefix
  
  try {
    const sessionRecord = await db.select()
      .from(session)
      .where(eq(session.token, token))
      .limit(1);
    
    if (sessionRecord.length === 0) {
      return null;
    }
    
    return sessionRecord[0].userId;
  } catch (error) {
    console.error('Authentication error:', error);
    return null;
  }
}

// Default preferences values
const defaultPreferences = {
  customTitle: "Account Secured",
  showEmail: false,
  blurEmail: false,
  avatarUrl: null,
  avatarShape: "circle",
  avatarColorScheme: "gradient",
  avatarBorderColor: "#6366f1",
  showPassword: false,
  accountVisibility: "private",
  twoFactorEnabled: false
};

export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const userId = await authenticateRequest(request);
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }
    
    // Get user data
    const userData = await db.select({
      id: user.id,
      name: user.name,
      email: user.email,
      emailVerified: user.emailVerified,
      image: user.image,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    })
      .from(user)
      .where(eq(user.id, userId))
      .limit(1);
    
    if (userData.length === 0) {
      return NextResponse.json(
        { error: 'User not found', code: 'USER_NOT_FOUND' },
        { status: 404 }
      );
    }
    
    // Get user preferences
    const preferencesData = await db.select()
      .from(userPreferences)
      .where(eq(userPreferences.userId, userId))
      .limit(1);
    
    // Use default preferences if none exist
    const preferences = preferencesData.length > 0 
      ? {
          customTitle: preferencesData[0].customTitle ?? defaultPreferences.customTitle,
          showEmail: preferencesData[0].showEmail ?? defaultPreferences.showEmail,
          blurEmail: preferencesData[0].blurEmail ?? defaultPreferences.blurEmail,
          avatarUrl: defaultPreferences.avatarUrl,
          avatarShape: defaultPreferences.avatarShape,
          avatarColorScheme: defaultPreferences.avatarColorScheme,
          avatarBorderColor: defaultPreferences.avatarBorderColor,
          showPassword: defaultPreferences.showPassword,
          accountVisibility: defaultPreferences.accountVisibility,
          twoFactorEnabled: defaultPreferences.twoFactorEnabled
        }
      : defaultPreferences;
    
    return NextResponse.json({
      user: userData[0],
      preferences
    }, { status: 200 });
    
  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Authenticate user
    const userId = await authenticateRequest(request);
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }
    
    // Parse request body
    const body = await request.json();
    
    // Extract preference fields
    const {
      customTitle,
      showEmail,
      blurEmail,
      avatarUrl,
      avatarShape,
      avatarColorScheme,
      avatarBorderColor,
      showPassword,
      accountVisibility,
      twoFactorEnabled
    } = body;
    
    // Validate inputs
    if (customTitle !== undefined) {
      if (typeof customTitle !== 'string') {
        return NextResponse.json(
          { error: 'customTitle must be a string', code: 'INVALID_CUSTOM_TITLE' },
          { status: 400 }
        );
      }
      if (customTitle.length > 100) {
        return NextResponse.json(
          { error: 'customTitle must be 100 characters or less', code: 'CUSTOM_TITLE_TOO_LONG' },
          { status: 400 }
        );
      }
    }
    
    if (avatarShape !== undefined) {
      const validShapes = ['circle', 'square', 'rounded'];
      if (!validShapes.includes(avatarShape)) {
        return NextResponse.json(
          { error: 'avatarShape must be one of: circle, square, rounded', code: 'INVALID_AVATAR_SHAPE' },
          { status: 400 }
        );
      }
    }
    
    if (avatarColorScheme !== undefined) {
      const validColorSchemes = ['solid', 'gradient', 'rainbow', 'fade'];
      if (!validColorSchemes.includes(avatarColorScheme)) {
        return NextResponse.json(
          { error: 'avatarColorScheme must be one of: solid, gradient, rainbow, fade', code: 'INVALID_AVATAR_COLOR_SCHEME' },
          { status: 400 }
        );
      }
    }
    
    if (avatarBorderColor !== undefined) {
      const hexColorRegex = /^#([0-9A-Fa-f]{3}){1,2}$/;
      if (!hexColorRegex.test(avatarBorderColor)) {
        return NextResponse.json(
          { error: 'avatarBorderColor must be a valid hex color format (#RRGGBB or #RGB)', code: 'INVALID_AVATAR_BORDER_COLOR' },
          { status: 400 }
        );
      }
    }
    
    if (accountVisibility !== undefined) {
      const validVisibilities = ['private', 'public', 'team'];
      if (!validVisibilities.includes(accountVisibility)) {
        return NextResponse.json(
          { error: 'accountVisibility must be one of: private, public, team', code: 'INVALID_ACCOUNT_VISIBILITY' },
          { status: 400 }
        );
      }
    }
    
    if (showEmail !== undefined && typeof showEmail !== 'boolean') {
      return NextResponse.json(
        { error: 'showEmail must be a boolean', code: 'INVALID_SHOW_EMAIL' },
        { status: 400 }
      );
    }
    
    if (blurEmail !== undefined && typeof blurEmail !== 'boolean') {
      return NextResponse.json(
        { error: 'blurEmail must be a boolean', code: 'INVALID_BLUR_EMAIL' },
        { status: 400 }
      );
    }
    
    if (showPassword !== undefined && typeof showPassword !== 'boolean') {
      return NextResponse.json(
        { error: 'showPassword must be a boolean', code: 'INVALID_SHOW_PASSWORD' },
        { status: 400 }
      );
    }
    
    if (twoFactorEnabled !== undefined && typeof twoFactorEnabled !== 'boolean') {
      return NextResponse.json(
        { error: 'twoFactorEnabled must be a boolean', code: 'INVALID_TWO_FACTOR_ENABLED' },
        { status: 400 }
      );
    }
    
    if (avatarUrl !== undefined && avatarUrl !== null && typeof avatarUrl !== 'string') {
      return NextResponse.json(
        { error: 'avatarUrl must be a string or null', code: 'INVALID_AVATAR_URL' },
        { status: 400 }
      );
    }
    
    // Check if preferences exist
    const existingPreferences = await db.select()
      .from(userPreferences)
      .where(eq(userPreferences.userId, userId))
      .limit(1);
    
    const updateData: Record<string, any> = {
      updatedAt: new Date()
    };
    
    if (customTitle !== undefined) updateData.customTitle = customTitle;
    if (showEmail !== undefined) updateData.showEmail = showEmail;
    if (blurEmail !== undefined) updateData.blurEmail = blurEmail;
    
    if (existingPreferences.length > 0) {
      // Update existing preferences
      const updated = await db.update(userPreferences)
        .set(updateData)
        .where(eq(userPreferences.userId, userId))
        .returning();
      
      // Construct full response with all preference fields
      const responsePreferences = {
        customTitle: updated[0].customTitle ?? defaultPreferences.customTitle,
        showEmail: updated[0].showEmail ?? defaultPreferences.showEmail,
        blurEmail: updated[0].blurEmail ?? defaultPreferences.blurEmail,
        avatarUrl: avatarUrl !== undefined ? avatarUrl : defaultPreferences.avatarUrl,
        avatarShape: avatarShape !== undefined ? avatarShape : defaultPreferences.avatarShape,
        avatarColorScheme: avatarColorScheme !== undefined ? avatarColorScheme : defaultPreferences.avatarColorScheme,
        avatarBorderColor: avatarBorderColor !== undefined ? avatarBorderColor : defaultPreferences.avatarBorderColor,
        showPassword: showPassword !== undefined ? showPassword : defaultPreferences.showPassword,
        accountVisibility: accountVisibility !== undefined ? accountVisibility : defaultPreferences.accountVisibility,
        twoFactorEnabled: twoFactorEnabled !== undefined ? twoFactorEnabled : defaultPreferences.twoFactorEnabled
      };
      
      return NextResponse.json(responsePreferences, { status: 200 });
    } else {
      // Create new preferences
      const insertData = {
        userId,
        customTitle: customTitle ?? defaultPreferences.customTitle,
        showEmail: showEmail ?? defaultPreferences.showEmail,
        blurEmail: blurEmail ?? defaultPreferences.blurEmail,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      const created = await db.insert(userPreferences)
        .values(insertData)
        .returning();
      
      // Construct full response with all preference fields
      const responsePreferences = {
        customTitle: created[0].customTitle ?? defaultPreferences.customTitle,
        showEmail: created[0].showEmail ?? defaultPreferences.showEmail,
        blurEmail: created[0].blurEmail ?? defaultPreferences.blurEmail,
        avatarUrl: avatarUrl ?? defaultPreferences.avatarUrl,
        avatarShape: avatarShape ?? defaultPreferences.avatarShape,
        avatarColorScheme: avatarColorScheme ?? defaultPreferences.avatarColorScheme,
        avatarBorderColor: avatarBorderColor ?? defaultPreferences.avatarBorderColor,
        showPassword: showPassword ?? defaultPreferences.showPassword,
        accountVisibility: accountVisibility ?? defaultPreferences.accountVisibility,
        twoFactorEnabled: twoFactorEnabled ?? defaultPreferences.twoFactorEnabled
      };
      
      return NextResponse.json(responsePreferences, { status: 201 });
    }
    
  } catch (error) {
    console.error('PUT error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}