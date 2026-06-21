import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabaseServer';

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const [dispensedToday, auditPending] = await Promise.all([
      supabase.from('pharmacy_dispensings').select('id', { count: 'exact' })
        .eq('pharmacy_id', user.id)
        .gte('dispensed_at', new Date(new Date().setHours(0, 0, 0, 0)).toISOString()),
      supabase.from('audit_logs').select('id', { count: 'exact' })
        .eq('actor_id', user.id)
        .eq('action', 'VERIFY_PRESCRIPTION')
        .eq('result', 'denied'),
    ]);

    return NextResponse.json({
      forVerification: 0,
      dispensedToday: dispensedToday.count ?? 0,
      pending: 0,
      alerts: auditPending.count ?? 0,
    });
  } catch {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
