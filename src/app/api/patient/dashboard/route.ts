import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabaseServer';

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const [prescriptionsRes, consentsRes, requestsRes, auditRes] = await Promise.all([
      supabase.from('prescriptions').select('id', { count: 'exact' }).eq('patient_id', user.id),
      supabase.from('consents').select('id', { count: 'exact' }).eq('patient_id', user.id).eq('is_active', true),
      supabase.from('consent_requests').select('id', { count: 'exact' }).eq('patient_id', user.id).eq('status', 'pending'),
      supabase.from('audit_logs').select('id', { count: 'exact' }).eq('target_id', user.id)
        .gte('timestamp', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()),
    ]);

    return NextResponse.json({
      totalPrescriptions: prescriptionsRes.count ?? 0,
      activeConsents: consentsRes.count ?? 0,
      pendingAccessRequests: requestsRes.count ?? 0,
      auditEventsLast30Days: auditRes.count ?? 0,
    });
  } catch {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
