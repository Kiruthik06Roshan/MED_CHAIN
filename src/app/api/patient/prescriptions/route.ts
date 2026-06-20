import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabaseServer';

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data, error } = await supabase
      .from('prescriptions')
      .select('*, user_profiles!prescriber_id(full_name)')
      .eq('patient_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const prescriptions = (data ?? []).map(p => ({
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
      notes: p.notes,
      status: p.status,
      signatureProof: p.signature_proof,
      createdAt: p.created_at,
    }));

    return NextResponse.json(prescriptions);
  } catch {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
