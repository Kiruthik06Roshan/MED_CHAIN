import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabaseServer';

export async function GET(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const action = searchParams.get('action');

    let query = supabase.from('audit_logs').select('*')
      .eq('target_id', user.id)
      .order('timestamp', { ascending: false })
      .limit(100);

    if (dateFrom) query = query.gte('timestamp', dateFrom);
    if (dateTo) query = query.lte('timestamp', dateTo);
    if (action) query = query.eq('action', action);

    const { data, error } = await query;
    if (error) throw error;

    const events = (data ?? []).map(e => ({
      id: e.id,
      actorId: e.actor_id,
      actorRole: e.actor_role,
      action: e.action,
      targetId: e.target_id,
      scope: e.scope ?? [],
      result: e.result,
      timestamp: e.timestamp,
      txHash: e.tx_hash,
      ipAddress: e.ip_address,
    }));

    return NextResponse.json(events);
  } catch {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
