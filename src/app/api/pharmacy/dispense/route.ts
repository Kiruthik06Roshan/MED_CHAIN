import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabaseServer';
import { logAccess } from '@/services/audit';

export async function POST(req: Request) {
  try {
    const { prescriptionId, quantityDispensed, refillsRemaining } = await req.json();
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: prescription } = await supabase
      .from('prescriptions')
      .select('patient_id, status')
      .eq('id', prescriptionId)
      .single();

    if (!prescription || prescription.status !== 'active') {
      return NextResponse.json({ error: 'Prescription not active' }, { status: 400 });
    }

    await supabase.from('pharmacy_dispensings').insert({
      prescription_id: prescriptionId,
      pharmacy_id: user.id,
      quantity_dispensed: quantityDispensed,
      refills_remaining: refillsRemaining,
      dispensed_at: new Date().toISOString(),
    });

    // Update prescription status if no refills remaining
    if (refillsRemaining <= 0) {
      await supabase.from('prescriptions').update({ status: 'filled' }).eq('id', prescriptionId);
    }

    await logAccess({
      actorId: user.id,
      actorRole: 'PHARMACY',
      action: 'DISPENSE_MEDICATION',
      targetId: prescription.patient_id,
      scope: ['medications'],
      result: 'success',
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
