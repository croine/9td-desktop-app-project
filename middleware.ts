import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  
  // Define route types
  const publicRoutes = [
    '/',
    '/login',
    '/register',
    '/pricing',
    '/verify-email',
    '/verify-email-pending',
  ];
  
  const protectedRoutes = [
    '/dashboard',
    '/profile',
    '/settings',
    '/tasks',
    '/analytics',
  ];
  
  // Allow API routes, static files, and public assets
  if (
    pathname.startsWith('/api/') ||
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/static/') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }
  
  // Check if route is public
  const isPublicRoute = publicRoutes.some(route => pathname === route || pathname.startsWith(route));
  
  // Get session
  const session = await auth.api.getSession({ headers: await headers() });
  
  // If accessing verification pages, allow
  if (pathname.startsWith('/verify-email')) {
    return NextResponse.next();
  }
  
  // If user is not authenticated and trying to access protected content
  if (!session?.user && !isPublicRoute) {
    const url = new URL('/login', request.url);
    url.searchParams.set('redirect', pathname);
    return NextResponse.redirect(url);
  }
  
  // If user is authenticated but email not verified
  if (session?.user && !session.user.emailVerified) {
    // Allow access to verification pages and logout
    if (
      pathname === '/verify-email-pending' ||
      pathname === '/verify-email' ||
      pathname === '/login' ||
      pathname === '/register'
    ) {
      return NextResponse.next();
    }
    
    // Redirect to verification pending page for all other routes
    return NextResponse.redirect(new URL('/verify-email-pending', request.url));
  }
  
  // If user is authenticated with verified email and accessing auth pages
  if (session?.user && session.user.emailVerified) {
    if (pathname === '/login' || pathname === '/register' || pathname === '/verify-email-pending') {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};