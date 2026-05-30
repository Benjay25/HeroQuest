import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

/**
 * Middleware — runs on the server before every request.
 *
 * Think of this as a bouncer at the door. Before Next.js renders any page,
 * this function runs, checks the user's session, and decides whether to:
 *   - Let the request through unchanged
 *   - Redirect the user somewhere else
 *
 * GUEST MODE DESIGN (Option A):
 * Most of the app is publicly browsable — factions, quest board, story quests.
 * Only personal routes require a login: dashboard, profile, check-in.
 * This lets guests explore before committing to an account.
 *
 * Route rules:
 *   PROTECTED  → must be logged in, redirects to /login if not
 *   AUTH-ONLY  → only for logged-out users (login/signup), redirects to
 *                /dashboard if already logged in (no point revisiting login)
 *   PUBLIC     → anyone can access, no checks needed
 */

// Routes that require a logged-in user.
// Add to this list as the app grows (e.g. '/checkin', '/profile').
const PROTECTED_ROUTES = [
  '/dashboard',
  '/profile',
  '/checkin',
  '/fog',
  '/quests',
];

// Routes only relevant to logged-out users.
// A logged-in user visiting /login gets bounced to /dashboard.
const AUTH_ROUTES = [
  '/login',
  '/signup',
];

export async function proxy(request: NextRequest) {
  // NextResponse.next() means "carry on, serve the page as normal".
  // We pass the request headers through so Supabase can read cookies.
  let response = NextResponse.next({
    request: { headers: request.headers },
  });

  /**
   * Create a Supabase client scoped to this single middleware request.
   *
   * Middleware runs in the Next.js Edge Runtime — a lightweight environment
   * that can't use Node.js APIs. The cookie handlers below tell Supabase
   * how to read and write cookies in this environment specifically.
   *
   * The set/remove handlers update the response cookies so that refreshed
   * auth tokens are sent back to the browser automatically.
   */
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          // First update the request cookies (so the current request sees them)
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          // Re-create the response with updated request headers
          response = NextResponse.next({ request });
          // Then update the response cookies (so the browser receives them)
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  /**
   * getUser() is the correct way to check auth in middleware.
   *
   * Important: use getUser() not getSession() here.
   * getSession() reads from the cookie and trusts it at face value —
   * it doesn't verify the token with Supabase's server.
   * getUser() makes a network call to verify the token is genuine.
   * This matters for security: a tampered cookie won't fool getUser().
   */
  const { data: { user } } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // Check if the current path starts with any protected route
  const isProtectedRoute = PROTECTED_ROUTES.some(route =>
    pathname.startsWith(route),
  );

  // Check if the current path is a login/signup page
  const isAuthRoute = AUTH_ROUTES.some(route =>
    pathname.startsWith(route),
  );

  // Case 1: User is NOT logged in and trying to access a protected route
  // → Redirect to login, but remember where they were trying to go
  //   so we can send them there after login (the `next` param).
  if (!user && isProtectedRoute) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Case 2: User IS logged in and trying to visit login or signup
  // → No need to be there, send them to the dashboard
  if (user && isAuthRoute) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Case 3: Everything else — public routes, or logged-in user on app routes
  // → Let the request through
  return response;
}

/**
 * Matcher — tells Next.js which routes to run middleware on.
 *
 * This pattern excludes:
 *   - _next/static  → built JS/CSS files
 *   - _next/image   → Next.js image optimisation
 *   - favicon.ico   → browser favicon request
 *   - Files with extensions (images, fonts, etc.)
 *
 * Without this, middleware would run on every asset request,
 * which is unnecessary and slows things down.
 */
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
