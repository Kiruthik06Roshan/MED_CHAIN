import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabaseAdmin';
import { requireAdmin } from '@/lib/adminAuth';

export async function GET() {
  try {
    const auth = await requireAdmin();
    if (auth.error) return auth.error;

    const admin = createAdminClient();

    const [profilesRes, auditRes, consentsRes] = await Promise.all([
      admin.from('user_profiles').select('role, created_at').order('created_at', { ascending: true }),
      admin.from('audit_logs').select('actor_role, scope'),
      admin.from('consents').select('granted_at, is_active'),
    ]);

    const allProfiles = profilesRes.data ?? [];
    const auditLogs   = auditRes.data   ?? [];
    const allConsents = consentsRes.data ?? [];

    // Month-by-month user signups (last 6 months)
    const now = new Date();
    const userGrowth = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
      const label = d.toLocaleString('default', { month: 'short', year: '2-digit' });
      const inMonth = allProfiles.filter(p => {
        const c = new Date(p.created_at);
        return c.getFullYear() === d.getFullYear() && c.getMonth() === d.getMonth();
      });
      return {
        month:     label,
        patients:  inMonth.filter(p => p.role === 'PATIENT').length,
        providers: inMonth.filter(p => p.role !== 'PATIENT' && p.role !== 'ADMIN').length,
      };
    });

    // Access volume by role
    const roleCounts = auditLogs.reduce((acc: Record<string, number>, r) => {
      if (r.actor_role) acc[r.actor_role] = (acc[r.actor_role] ?? 0) + 1;
      return acc;
    }, {});
    const accessByRole = Object.entries(roleCounts).map(([role, count]) => ({ role, count }));

    // Data type access frequency
    const typeCounts = auditLogs.reduce((acc: Record<string, number>, r) => {
      (r.scope ?? []).forEach((s: string) => { acc[s] = (acc[s] ?? 0) + 1; });
      return acc;
    }, {});
    const dataTypeAccess = Object.entries(typeCounts).map(([type, value]) => ({ type, value }));

    // Consent activity over last 6 months
    const consentTrend = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
      const label = d.toLocaleString('default', { month: 'short', year: '2-digit' });
      const inMonth = allConsents.filter(c => {
        const g = new Date(c.granted_at);
        return g.getFullYear() === d.getFullYear() && g.getMonth() === d.getMonth();
      });
      return {
        month:   label,
        granted: inMonth.length,
        active:  inMonth.filter(c => c.is_active).length,
      };
    });

    return NextResponse.json({ userGrowth, accessByRole, dataTypeAccess, consentTrend });
  } catch (err) {
    console.error('[admin/analytics]', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
