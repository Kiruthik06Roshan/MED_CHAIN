import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabaseServer';

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const [claims, pending, approved] = await Promise.all([
      supabase.from('insurance_claims').select('id', { count: 'exact' }).eq('insurance_id', user.id),
      supabase.from('verification_requests').select('id', { count: 'exact' }).eq('insurance_id', user.id).eq('status', 'pending'),
      supabase.from('insurance_claims').select('id', { count: 'exact' }).eq('insurance_id', user.id).eq('status', 'approved'),
    ]);

    const total = claims.count ?? 0;
    const approvedCount = approved.count ?? 0;

    return NextResponse.json({
      totalClaims: total,
      pendingVerifications: pending.count ?? 0,
      approvalRate: total > 0 ? Math.round((approvedCount / total) * 100) : 0,
      fraudFlags: 0,
    });
  } catch {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
