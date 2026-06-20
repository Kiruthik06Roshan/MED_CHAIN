import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabaseServer';

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data, error } = await supabase
      .from('insurance_claims')
      .select('*')
      .eq('insurance_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json((data ?? []).map(c => ({
      id: c.id,
      patientId: c.patient_id,
      claimAmount: c.claim_amount,
      status: c.status,
      createdAt: c.created_at,
    })));
  } catch {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
