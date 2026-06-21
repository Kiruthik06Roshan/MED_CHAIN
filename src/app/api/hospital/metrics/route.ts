import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabaseServer';

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const [patients, pending, prescriptions] = await Promise.all([
      supabase.from('consents').select('patient_id', { count: 'exact' }).eq('grantee_id', user.id).eq('is_active', true),
      supabase.from('consent_requests').select('id', { count: 'exact' }).eq('requestor_id', user.id).eq('status', 'pending'),
      supabase.from('prescriptions').select('id', { count: 'exact' }).eq('prescriber_id', user.id),
    ]);

    return NextResponse.json({
      patients: patients.count ?? 0,
      pendingRequests: pending.count ?? 0,
      prescriptions: prescriptions.count ?? 0,
      verifications: 0,
    });
  } catch {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
