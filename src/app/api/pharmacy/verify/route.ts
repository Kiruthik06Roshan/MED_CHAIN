import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabaseServer';
import { logAccess } from '@/services/audit';

export async function POST(req: Request) {
  try {
    const { prescriptionId } = await req.json();
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: prescription } = await supabase
      .from('prescriptions')
      .select('*, user_profiles!prescriber_id(full_name), patient:user_profiles!patient_id(full_name)')
      .eq('id', prescriptionId)
      .single();

    if (!prescription) {
      return NextResponse.json({ isValid: false, reason: 'Prescription not found', consentStatus: 'none', patientName: 'Unknown' });
    }

    // Check consent
    const { data: consent } = await supabase
      .from('consents')
      .select('id, expires_at')
      .eq('grantee_id', user.id)
      .eq('patient_id', prescription.patient_id)
      .eq('is_active', true)
      .single();

    let consentStatus: 'active' | 'none' | 'expired' = 'none';
    if (consent) {
      consentStatus = new Date(consent.expires_at) > new Date() ? 'active' : 'expired';
    }

    const isValid = prescription.status === 'active' &&
      new Date(prescription.expiry_date) > new Date() &&
      consentStatus === 'active';

    await logAccess({
      actorId: user.id,
      actorRole: 'PHARMACY',
      action: 'VERIFY_PRESCRIPTION',
      targetId: prescription.patient_id,
      scope: ['medications'],
      result: isValid ? 'success' : 'denied',
    });

    const prescriberInfo = prescription.user_profiles as { full_name?: string } | null;
    const patientInfo = prescription.patient as { full_name?: string } | null;

    return NextResponse.json({
      isValid,
      consentStatus,
      patientName: patientInfo?.full_name ?? 'Unknown',
      reason: !isValid ? (consentStatus !== 'active' ? 'No active patient consent' : 'Prescription expired or inactive') : undefined,
      prescription: isValid ? {
        id: prescription.id,
        medication: prescription.medication,
        dosage: prescription.dosage,
        quantity: prescription.quantity,
        refills: prescription.refills,
        dateIssued: prescription.date_issued,
        expiryDate: prescription.expiry_date,
        prescriberName: prescriberInfo?.full_name ?? 'Unknown',
        status: prescription.status,
        signatureProof: prescription.signature_proof,
      } : undefined,
    });
  } catch {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
