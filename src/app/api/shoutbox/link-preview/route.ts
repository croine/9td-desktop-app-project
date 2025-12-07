import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { session } from '@/db/schema';
import { eq } from 'drizzle-orm';

interface LinkPreviewResponse {
  url: string;
  title: string | null;
  description: string | null;
  imageUrl: string | null;
  siteName: string | null;
}

async function authenticateRequest(request: NextRequest): Promise<string | null> {
  const authHeader = request.headers.get('Authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7);

  try {
    const sessions = await db.select()
      .from(session)
      .where(eq(session.token, token))
      .limit(1);

    if (sessions.length === 0) {
      return null;
    }

    const userSession = sessions[0];
    const now = new Date();

    if (userSession.expiresAt < now) {
      return null;
    }

    return userSession.userId;
  } catch (error) {
    console.error('Session authentication error:', error);
    return null;
  }
}

async function fetchWithTimeout(url: string, timeout: number = 5000): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; LinkPreviewBot/1.0)',
      },
      redirect: 'follow',
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

function extractMetaTags(html: string): LinkPreviewResponse {
  const result: LinkPreviewResponse = {
    url: '',
    title: null,
    description: null,
    imageUrl: null,
    siteName: null,
  };

  // Extract Open Graph title
  const ogTitleMatch = html.match(/<meta\s+property=["']og:title["']\s+content=["']([^"']+)["']/i);
  if (ogTitleMatch) {
    result.title = ogTitleMatch[1];
  }

  // Fallback to regular title tag
  if (!result.title) {
    const titleMatch = html.match(/<title>([^<]+)<\/title>/i);
    if (titleMatch) {
      result.title = titleMatch[1].trim();
    }
  }

  // Extract Open Graph description
  const ogDescMatch = html.match(/<meta\s+property=["']og:description["']\s+content=["']([^"']+)["']/i);
  if (ogDescMatch) {
    result.description = ogDescMatch[1];
  }

  // Fallback to meta description
  if (!result.description) {
    const descMatch = html.match(/<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i);
    if (descMatch) {
      result.description = descMatch[1];
    }
  }

  // Extract Open Graph image
  const ogImageMatch = html.match(/<meta\s+property=["']og:image["']\s+content=["']([^"']+)["']/i);
  if (ogImageMatch) {
    result.imageUrl = ogImageMatch[1];
  }

  // Fallback to first image in content (basic approach)
  if (!result.imageUrl) {
    const imgMatch = html.match(/<img\s+[^>]*src=["']([^"']+)["']/i);
    if (imgMatch) {
      result.imageUrl = imgMatch[1];
    }
  }

  // Extract Open Graph site name
  const ogSiteMatch = html.match(/<meta\s+property=["']og:site_name["']\s+content=["']([^"']+)["']/i);
  if (ogSiteMatch) {
    result.siteName = ogSiteMatch[1];
  }

  return result;
}

export async function GET(request: NextRequest) {
  try {
    // Authentication check
    const userId = await authenticateRequest(request);
    if (!userId) {
      return NextResponse.json(
        { 
          error: 'Authentication required',
          code: 'AUTHENTICATION_REQUIRED' 
        },
        { status: 401 }
      );
    }

    // Get URL from query parameters
    const searchParams = request.nextUrl.searchParams;
    const url = searchParams.get('url');

    // Validate URL presence
    if (!url) {
      return NextResponse.json(
        { 
          error: 'URL parameter is required',
          code: 'MISSING_URL' 
        },
        { status: 400 }
      );
    }

    // Validate URL format and scheme
    let validatedUrl: URL;
    try {
      validatedUrl = new URL(url);
      
      // Only allow http and https schemes
      if (!['http:', 'https:'].includes(validatedUrl.protocol)) {
        return NextResponse.json(
          { 
            error: 'Only HTTP and HTTPS protocols are allowed',
            code: 'INVALID_URL_SCHEME' 
          },
          { status: 400 }
        );
      }
    } catch (error) {
      return NextResponse.json(
        { 
          error: 'Invalid URL format',
          code: 'INVALID_URL_FORMAT' 
        },
        { status: 400 }
      );
    }

    // Fetch the URL with timeout
    let response: Response;
    try {
      response = await fetchWithTimeout(validatedUrl.toString(), 5000);
    } catch (error) {
      console.error('Link preview fetch error:', error);
      
      if (error instanceof Error && error.name === 'AbortError') {
        return NextResponse.json(
          { 
            error: 'Request timeout: Unable to fetch URL within 5 seconds',
            code: 'FETCH_TIMEOUT' 
          },
          { status: 500 }
        );
      }

      return NextResponse.json(
        { 
          error: 'Failed to fetch URL: ' + (error instanceof Error ? error.message : 'Unknown error'),
          code: 'FETCH_ERROR' 
        },
        { status: 500 }
      );
    }

    // Check response status
    if (!response.ok) {
      return NextResponse.json(
        { 
          error: `Failed to fetch URL: HTTP ${response.status}`,
          code: 'HTTP_ERROR' 
        },
        { status: 500 }
      );
    }

    // Get content type
    const contentType = response.headers.get('content-type') || '';
    
    // Only process HTML content
    if (!contentType.includes('text/html')) {
      return NextResponse.json(
        { 
          error: 'URL does not return HTML content',
          code: 'INVALID_CONTENT_TYPE' 
        },
        { status: 400 }
      );
    }

    // Limit response size (5MB max)
    const contentLength = response.headers.get('content-length');
    if (contentLength && parseInt(contentLength) > 5 * 1024 * 1024) {
      return NextResponse.json(
        { 
          error: 'Response size exceeds maximum allowed limit',
          code: 'RESPONSE_TOO_LARGE' 
        },
        { status: 400 }
      );
    }

    // Parse HTML
    let html: string;
    try {
      html = await response.text();
      
      // Additional size check after reading
      if (html.length > 5 * 1024 * 1024) {
        return NextResponse.json(
          { 
            error: 'Response size exceeds maximum allowed limit',
            code: 'RESPONSE_TOO_LARGE' 
          },
          { status: 400 }
        );
      }
    } catch (error) {
      console.error('Link preview parse error:', error);
      return NextResponse.json(
        { 
          error: 'Failed to parse HTML response',
          code: 'PARSE_ERROR' 
        },
        { status: 500 }
      );
    }

    // Extract metadata
    const preview = extractMetaTags(html);
    preview.url = validatedUrl.toString();

    // If no site name, use domain
    if (!preview.siteName) {
      preview.siteName = validatedUrl.hostname;
    }

    // Make relative URLs absolute
    if (preview.imageUrl && !preview.imageUrl.startsWith('http')) {
      try {
        preview.imageUrl = new URL(preview.imageUrl, validatedUrl.toString()).toString();
      } catch (error) {
        console.error('Failed to resolve relative image URL:', error);
        preview.imageUrl = null;
      }
    }

    return NextResponse.json(preview, { status: 200 });

  } catch (error) {
    console.error('GET link preview error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error'),
        code: 'INTERNAL_ERROR' 
      },
      { status: 500 }
    );
  }
}