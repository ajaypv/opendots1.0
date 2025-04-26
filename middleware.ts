import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { updateSession } from './utils/supabase/middleware';

export async function middleware(request: NextRequest) {
  // Check if the URL has a signout parameter
  const url = new URL(request.url);
  const isSignOut = url.searchParams.has('signout');
  
  if (isSignOut) {
    // Create a new response that redirects to the sign-in page
    const response = NextResponse.redirect(new URL('/sign-in', request.url));
    
    // Clear all Supabase auth cookies
    const cookiesToClear = [
      'sb-access-token',
      'sb-refresh-token',
      'supabase-auth-token',
      '__client-auth-token'
    ];
    
    // Iterate through cookie names we want to clear
    for (const name of cookiesToClear) {
      // Clear the main cookie
      response.cookies.delete(name);
      
      // Clear any chunked cookies (e.g., sb-refresh-token.0, sb-refresh-token.1, etc.)
      for (let i = 0; i < 10; i++) {
        response.cookies.delete(`${name}.${i}`);
      }
    }
    
    return response;
  }
  
  // Continue with default session handling
  const response = await updateSession(request);
  
  // Add diagnostic header for D1 presence on Cloudflare Worker
  if (typeof globalThis !== 'undefined' && typeof (globalThis as any).DB !== 'undefined') {
    response.headers.set('X-D1-Available', 'true');
  } else {
    response.headers.set('X-D1-Available', 'false');
  }
  
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
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
