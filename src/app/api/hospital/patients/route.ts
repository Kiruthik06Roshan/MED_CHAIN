import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabaseServer';

export async function GET(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q') ?? '';

    const { data: patients } = await supabase
      .from('user_profiles')
      .select('id, full_name, email')
      .eq('role', 'PATIENT')
      .or(`full_name.ilike.%${q}%,email.ilike.%${q}%`)
      .limit(20);

    // Check if hospital has consent for each patient
    const patientIds = (patients ?? []).map(p => p.id);
    const { data: consents } = await supabase
      .from('consents')
      .select('patient_id')
      .eq('grantee_id', user.id)
      .eq('is_active', true)
      .in('patient_id', patientIds);

    const consentSet = new Set((consents ?? []).map(c => c.patient_id));

    const results = (patients ?? []).map(p => ({
      id: p.id,
      fullName: p.full_name,
      email: p.email,
      hasConsent: consentSet.has(p.id),
    }));

    return NextResponse.json(results);
  } catch {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
