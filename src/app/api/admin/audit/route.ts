import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabaseAdmin';
import { requireAdmin } from '@/lib/adminAuth';

export async function GET(request: Request) {
  try {
    const auth = await requireAdmin();
    if (auth.error) return auth.error;

    const { searchParams } = new URL(request.url);
    const dateFrom = searchParams.get('dateFrom');
    const dateTo   = searchParams.get('dateTo');
    const role     = searchParams.get('role');
    const action   = searchParams.get('action');

    const admin = createAdminClient();
    let query = admin.from('audit_logs').select('*')
      .order('timestamp', { ascending: false })
      .limit(500);

    if (dateFrom) query = query.gte('timestamp', dateFrom);
    if (dateTo)   query = query.lte('timestamp', dateTo);
    if (role)     query = query.eq('actor_role', role);
    if (action)   query = query.ilike('action', `%${action}%`);

    const { data } = await query;

    return NextResponse.json((data ?? []).map(e => ({
      id:        e.id,
      actorId:   e.actor_id,
      actorRole: e.actor_role,
      action:    e.action,
      targetId:  e.target_id,
      scope:     e.scope ?? [],
      result:    e.result,
      timestamp: e.timestamp,
      txHash:    e.tx_hash,
    })));
  } catch (err) {
    console.error('[admin/audit]', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
