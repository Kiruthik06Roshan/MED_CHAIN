import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabaseServer';
import { createAdminClient } from '@/lib/supabaseAdmin';

/**
 * POST /api/auth/sync-profile
 *
 * Called immediately after sign-in. Ensures a user_profiles row exists for
 * the authenticated user and returns their role.
 *
 * Why this exists: the database trigger (on_auth_user_created) normally creates
 * the profile on sign-up, but it can be missed when users are created via the
 * Supabase dashboard, when email confirmation delays the insert, or when the
 * trigger fails silently. The admin client bypasses RLS so the upsert always works.
 */
export async function POST() {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 1. Try to read the existing profile (anon client, subject to RLS)
    const { data: existing } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (existing?.role) {
      return NextResponse.json({ role: existing.role });
    }

    // 2. Profile is missing — create it via the service-role admin client
    const admin = createAdminClient();
    const meta = user.user_metadata ?? {};

    const role: string =
      meta.role && ['PATIENT', 'HOSPITAL', 'PHARMACY', 'INSURANCE', 'ADMIN'].includes(meta.role)
        ? meta.role
        : 'PATIENT';

    const { data: created, error } = await admin
      .from('user_profiles')
      .upsert(
        {
          id: user.id,
          email: user.email ?? '',
          full_name: meta.full_name ?? (user.email ?? '').split('@')[0],
          role,
          organization_name: meta.organization_name ?? null,
          wallet_address: null,
          phone: null,
          is_disabled: false,
        },
        { onConflict: 'id' }
      )
      .select('role')
      .single();

    if (error) {
      // Fallback: if the upsert failed (e.g. concurrent request), try reading again
      const { data: retry } = await admin
        .from('user_profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      return NextResponse.json({ role: retry?.role ?? role });
    }

    return NextResponse.json({ role: created?.role ?? role });
  } catch (err) {
    console.error('[sync-profile]', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
