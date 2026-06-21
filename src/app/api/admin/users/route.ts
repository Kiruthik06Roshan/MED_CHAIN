import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabaseAdmin';
import { requireAdmin } from '@/lib/adminAuth';

export async function GET() {
  try {
    const auth = await requireAdmin();
    if (auth.error) return auth.error;

    const admin = createAdminClient();
    const { data } = await admin
      .from('user_profiles')
      .select('*')
      .order('created_at', { ascending: false });

    return NextResponse.json((data ?? []).map(u => ({
      id:           u.id,
      email:        u.email,
      fullName:     u.full_name,
      role:         u.role,
      organization: u.organization_name,
      createdAt:    u.created_at,
      isDisabled:   u.is_disabled ?? false,
    })));
  } catch (err) {
    console.error('[admin/users]', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
