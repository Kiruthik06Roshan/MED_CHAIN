import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { PUBLIC_ROUTES, ROLE_HOME_ROUTES } from '@/constants/routes';

const VALID_ROLES = new Set(['PATIENT', 'HOSPITAL', 'PHARMACY', 'INSURANCE', 'ADMIN']);

// Sanitise env URL — strip trailing /rest/v1/ if someone pasted the wrong value
const SUPABASE_URL = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? '')
  .trim()
  .replace(/\/rest\/v1\/?$/, '');

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!.trim(),
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options?: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Use getSession() — reads the JWT from the cookie with NO network round-trip.
  // This is the key fix for slow page loads: the old getUser() hit the Supabase
  // Auth server on every single request (including static assets).
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const user = session?.user ?? null;

  const { pathname } = request.nextUrl;

  // API routes handle their own auth — never redirect them to the login page
  if (pathname.startsWith('/api/')) {
    return supabaseResponse;
  }

  // Treat landing page + all /auth/* routes as public
  const isPublic =
    PUBLIC_ROUTES.some(r => pathname === r) || pathname.startsWith('/auth');

  // ── Unauthenticated: redirect to login ───────────────────────────────────
  if (!user && !isPublic) {
    const url = request.nextUrl.clone();
    url.pathname = '/auth/login';
    url.searchParams.set('redirectTo', pathname);
    return NextResponse.redirect(url);
  }

  // ── Authenticated on a public/auth page: redirect to role portal ─────────
  if (user && (pathname === '/' || pathname.startsWith('/auth'))) {
    // 1. Try role from JWT metadata first — zero extra network calls
    const metaRole = user.user_metadata?.role as string | undefined;
    let role: string | undefined =
      metaRole && VALID_ROLES.has(metaRole) ? metaRole : undefined;

    // 2. Only hit the DB if metadata is missing (rare: dashboard-created users)
    if (!role) {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('id', user.id)
        .single();
      role =
        profile?.role && VALID_ROLES.has(profile.role)
          ? profile.role
          : 'PATIENT';
    }

    const home = ROLE_HOME_ROUTES[role!];
    if (home) {
      return NextResponse.redirect(new URL(home, request.url));
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    // Skip Next.js internals and static assets
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
