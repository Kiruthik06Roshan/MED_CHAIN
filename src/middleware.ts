import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { PUBLIC_ROUTES, ROLE_HOME_ROUTES } from '@/constants/routes';

const VALID_ROLES = new Set(['PATIENT', 'HOSPITAL', 'PHARMACY', 'INSURANCE', 'ADMIN']);

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
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

  // getUser() validates the JWT against Supabase — do not replace with getSession()
  const {
    data: { user },
  } = await supabase.auth.getUser();

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
    // 1. Try to get role from user_profiles (respects RLS via the user's JWT)
    let role: string | undefined;

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    role = profile?.role;

    // 2. If profile row is missing, fall back to the role stored in the JWT
    //    metadata (written at sign-up and always present even before the DB
    //    trigger has run or if the user was created via the dashboard).
    if (!role || !VALID_ROLES.has(role)) {
      const metaRole = user.user_metadata?.role as string | undefined;
      role = metaRole && VALID_ROLES.has(metaRole) ? metaRole : 'PATIENT';
    }

    const home = ROLE_HOME_ROUTES[role];
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
