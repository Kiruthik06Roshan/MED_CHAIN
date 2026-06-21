import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabaseServer';

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Return active prescriptions from patients where pharmacy has consent
    const { data: consents } = await supabase
      .from('consents')
      .select('patient_id')
      .eq('grantee_id', user.id)
      .eq('is_active', true);

    const patientIds = (consents ?? []).map(c => c.patient_id);
    if (patientIds.length === 0) return NextResponse.json([]);

    const { data: prescriptions } = await supabase
      .from('prescriptions')
      .select('*, user_profiles!prescriber_id(full_name)')
      .in('patient_id', patientIds)
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    const result = (prescriptions ?? []).map(p => ({
      id: p.id,
      patientId: p.patient_id,
      prescriberId: p.prescriber_id,
      prescriberName: (p.user_profiles as { full_name?: string })?.full_name ?? 'Unknown',
      medication: p.medication,
      dosage: p.dosage,
      quantity: p.quantity,
      refills: p.refills,
      dateIssued: p.date_issued,
      expiryDate: p.expiry_date,
      status: p.status,
      signatureProof: p.signature_proof,
      createdAt: p.created_at,
    }));

    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
