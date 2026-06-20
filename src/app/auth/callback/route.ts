import { createServerSupabaseClient } from '@/lib/supabaseServer';
import { NextResponse } from 'next/server';
import { ROLE_HOME_ROUTES } from '@/constants/routes';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next');

  if (code) {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      // If a specific `next` path was requested, honour it
      if (next && next.startsWith('/')) {
        return NextResponse.redirect(`${origin}${next}`);
      }

      // Otherwise redirect to the user's role home
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('id', data.user.id)
        .single();

      const home = profile?.role ? (ROLE_HOME_ROUTES[profile.role] ?? '/') : '/';
      return NextResponse.redirect(`${origin}${home}`);
    }
  }

  return NextResponse.redirect(
    `${origin}/auth/login?error=auth_callback_error`
  );
}
