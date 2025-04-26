import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";
import { Database } from "@/types/database.types";

export const updateSession = async (request: NextRequest) => {
  try {
    // Create an unmodified response
    let response = NextResponse.next({
      request: {
        headers: request.headers,
      },
    });

    // Add security headers
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    response.headers.set('X-XSS-Protection', '1; mode=block');
    
    const supabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) =>
              request.cookies.set(name, value),
            );
            response = NextResponse.next({
              request,
            });
            cookiesToSet.forEach(({ name, value, options }) => {
              // Ensure all cookies have secure attributes in production
              const secureOptions = {
                ...options,
                secure: process.env.NODE_ENV === 'production',
                httpOnly: true,
                sameSite: 'lax' as 'lax', // Type assertion to fix linter error
              };
              response.cookies.set(name, value, secureOptions);
            });
          },
        },
      },
    );

    // IMPORTANT: DO NOT add code between createServerClient and getSession
    // This ensures proper session management and token refresh
    const { data: { session } } = await supabase.auth.getSession();

    // IMPORTANT: After getSession, we now get the user
    const { data: { user }, error } = await supabase.auth.getUser();

    // Debug information to help diagnose authentication issues
    if (process.env.NODE_ENV === 'development') {
      console.log(`Path: ${request.nextUrl.pathname}, User: ${user ? 'Authenticated' : 'Not authenticated'}`);
    }

    // Log attempted access to protected routes by unauthenticated users
    if (request.nextUrl.pathname.startsWith("/protected") && (!user || error)) {
      console.warn(`Unauthorized access attempt to ${request.nextUrl.pathname}`);
      return NextResponse.redirect(new URL("/sign-in", request.url));
    }

    // Redirect authenticated users to protected area when accessing the homepage
    if (request.nextUrl.pathname === "/" && user && !error) {
      return NextResponse.redirect(new URL("/protected", request.url));
    }

    return response;
  } catch (e) {
    console.error('Error in updateSession middleware:', e);
    // If you are here, a Supabase client could not be created!
    // This is likely because you have not set up environment variables.
    return NextResponse.next({
      request: {
        headers: request.headers,
      },
    });
  }
};
