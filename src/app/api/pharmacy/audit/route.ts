import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabaseServer';

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data } = await supabase
      .from('audit_logs')
      .select('*')
      .eq('actor_id', user.id)
      .in('action', ['VERIFY_PRESCRIPTION', 'DISPENSE_MEDICATION'])
      .order('timestamp', { ascending: false })
      .limit(100);

    return NextResponse.json((data ?? []).map(e => ({
      id: e.id,
      actorId: e.actor_id,
      actorRole: e.actor_role,
      action: e.action,
      targetId: e.target_id,
      scope: e.scope ?? [],
      result: e.result,
      timestamp: e.timestamp,
    })));
  } catch {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
