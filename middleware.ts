import { updateSession } from '@/lib/supabase/middleware';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  // Update session (refresh tokens)
  const response = await updateSession(request);

  const { pathname } = request.nextUrl;

  // Get session from cookies (Supabase uses sb-<project-ref>-access-token)
  const cookieStore = request.cookies;
  const allCookies = cookieStore.getAll();
  const hasSession = allCookies.some(c => c.name.includes('auth-token') || c.name.includes('access-token'));

  // Public paths that don't require authentication
  const isPublicPath = pathname === '/login' ||
                       pathname.startsWith('/unauthorized') ||
                       pathname === '/';

  // If public path, allow access
  if (isPublicPath) {
    // Redirect to dashboard if already logged in and trying to access root
    if (pathname === '/' && hasSession) {
      return NextResponse.redirect(new URL('/admin/dashboard', request.url));
    }
    return response;
  }

  // If no session and trying to access protected route, redirect to login
  if (!hasSession) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Role-based access control will be handled in layout components
  // This middleware just ensures authentication
  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
