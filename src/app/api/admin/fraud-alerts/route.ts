import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabaseAdmin';
import { requireAdmin } from '@/lib/adminAuth';

export async function GET() {
  try {
    const auth = await requireAdmin();
    if (auth.error) return auth.error;

    const admin = createAdminClient();
    const { data } = await admin
      .from('fraud_alerts')
      .select(`*, patient:user_profiles!patient_id(full_name, email)`)
      .order('fraud_score', { ascending: false })
      .order('created_at',  { ascending: false })
      .limit(100);

    return NextResponse.json((data ?? []).map((a: Record<string, unknown>) => ({
      id:           a.id,
      patientId:    a.patient_id,
      patientName:  (a.patient as Record<string, unknown>)?.full_name ?? 'Unknown',
      patientEmail: (a.patient as Record<string, unknown>)?.email ?? '',
      fraudScore:   a.fraud_score,
      indicator:    a.indicator,
      explanation:  a.explanation,
      affectedData: a.affected_data ?? [],
      createdAt:    a.created_at,
      triagedAt:    a.triaged_at,
    })));
  } catch (err) {
    console.error('[admin/fraud-alerts]', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
