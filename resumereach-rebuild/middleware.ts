import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

// Define protected routes
const protectedRoutes = ['/dashboard', '/api/profile', '/api/resumes', '/api/applications', '/api/preferences'];

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Check if route is protected
  const isProtectedRoute = protectedRoutes.some((route) => pathname.startsWith(route));

  if (!isProtectedRoute) {
    return NextResponse.next();
  }

  // Get JWT token (Edge-compatible, no DB import)
  const token = await getToken({ req: request });

  // Redirect to signin if not authenticated
  if (!token?.sub) {
    const signinUrl = new URL('/signin', request.url);
    signinUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(signinUrl);
  }

  // Add user ID to response headers for debugging
  const response = NextResponse.next();
  response.headers.set('x-user-id', token.sub);

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
};
