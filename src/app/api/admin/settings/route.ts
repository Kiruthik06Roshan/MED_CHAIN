import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabaseServer';

export async function PUT(req: Request) {
  try {
    const { flags } = await req.json();
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: profile } = await supabase.from('user_profiles').select('role').eq('id', user.id).single();
    if (profile?.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const updates = Object.entries(flags as Record<string, boolean>).map(([key, value]) => ({
      flag_name: key.replace(/([A-Z])/g, '_$1').toLowerCase(),
      enabled: value,
      updated_at: new Date().toISOString(),
    }));

    for (const u of updates) {
      await supabase.from('feature_flags').upsert(u, { onConflict: 'flag_name' });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
