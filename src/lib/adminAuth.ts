import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabaseServer';
import { createAdminClient } from '@/lib/supabaseAdmin';

interface AdminAuthResult {
  userId: string;
  error?: NextResponse;
}

/**
 * Verifies the request is from an authenticated ADMIN user.
 * Uses the user client for session validation (JWT-verified),
 * then the admin client for the profile role check (bypasses the
 * self-referential RLS policy on user_profiles that causes false 403s).
 */
export async function requireAdmin(): Promise<AdminAuthResult> {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { userId: '', error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  }

  // Use admin client to read the profile — avoids the self-referential RLS policy
  const admin = createAdminClient();
  const { data: profile } = await admin
    .from('user_profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'ADMIN') {
    return { userId: user.id, error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) };
  }

  return { userId: user.id };
}
