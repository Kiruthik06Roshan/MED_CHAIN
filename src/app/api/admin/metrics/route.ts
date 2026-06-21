import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabaseAdmin';
import { requireAdmin } from '@/lib/adminAuth';

export async function GET() {
  try {
    const auth = await requireAdmin();
    if (auth.error) return auth.error;

    const admin = createAdminClient();

    const [users, records, consents, prescriptions, fraudAlerts, auditToday] = await Promise.all([
      admin.from('user_profiles').select('*', { count: 'exact', head: true }),
      admin.from('medical_records').select('*', { count: 'exact', head: true }),
      admin.from('consents').select('*', { count: 'exact', head: true }).eq('is_active', true),
      admin.from('prescriptions').select('*', { count: 'exact', head: true }).eq('status', 'active'),
      admin.from('fraud_alerts').select('*', { count: 'exact', head: true })
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()),
      admin.from('audit_logs').select('*', { count: 'exact', head: true })
        .gte('timestamp', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()),
    ]);

    const { data: allProfiles } = await admin.from('user_profiles').select('role');
    const usersByRole = (allProfiles ?? []).reduce((acc: Record<string, number>, p) => {
      acc[p.role] = (acc[p.role] ?? 0) + 1;
      return acc;
    }, {});

    return NextResponse.json({
      totalUsers:          users.count          ?? 0,
      totalRecords:        records.count        ?? 0,
      activeConsents:      consents.count       ?? 0,
      activePrescriptions: prescriptions.count  ?? 0,
      fraudAlertsToday:    fraudAlerts.count    ?? 0,
      accessVolume:        auditToday.count     ?? 0,
      usersByRole,
    });
  } catch (err) {
    console.error('[admin/metrics]', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
