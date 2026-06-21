import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabaseServer';
import { logAccess } from '@/services/audit';

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data } = await supabase
      .from('prescriptions')
      .select('*')
      .eq('prescriber_id', user.id)
      .order('created_at', { ascending: false });

    const prescriptions = (data ?? []).map(p => ({
      id: p.id,
      patientId: p.patient_id,
      prescriberId: p.prescriber_id,
      prescriberName: 'You',
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

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Verify hospital has consent to prescribe for patient
    const { data: consent } = await supabase
      .from('consents')
      .select('id')
      .eq('grantee_id', user.id)
      .eq('patient_id', body.patientId)
      .eq('is_active', true)
      .single();

    if (!consent) return NextResponse.json({ error: 'No active consent for this patient' }, { status: 403 });

    const { data, error } = await supabase.from('prescriptions').insert({
      patient_id: body.patientId,
      prescriber_id: user.id,
      medication: body.medication,
      dosage: body.dosage,
      quantity: body.quantity,
      refills: body.refills,
      date_issued: new Date().toISOString(),
      expiry_date: body.expiryDate,
      notes: body.notes,
      status: 'active',
    }).select().single();

    if (error) throw error;

    await logAccess({
      actorId: user.id,
      actorRole: 'HOSPITAL',
      action: 'CREATE_PRESCRIPTION',
      targetId: body.patientId,
      scope: ['medications'],
      result: 'success',
    });

    return NextResponse.json({ id: data?.id });
  } catch {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
