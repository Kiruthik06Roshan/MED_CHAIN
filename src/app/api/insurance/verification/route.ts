import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabaseServer';
import { logAccess } from '@/services/audit';

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data } = await supabase
      .from('verification_requests')
      .select('*')
      .eq('insurance_id', user.id)
      .order('created_at', { ascending: false });

    return NextResponse.json((data ?? []).map(r => ({
      id: r.id,
      claimId: r.claim_id,
      patientId: r.patient_id,
      requestedDataScope: r.requested_data_scope ?? [],
      approvedDataScope: r.approved_data_scope ?? [],
      status: r.status,
      createdAt: r.created_at,
    })));
  } catch {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { patientId, claimId, dataScope } = await req.json();
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data, error } = await supabase.from('verification_requests').insert({
      insurance_id: user.id,
      patient_id: patientId,
      claim_id: claimId,
      requested_data_scope: dataScope,
      status: 'pending',
    }).select().single();

    if (error) throw error;

    // Also create a consent_request so patient sees it in their access-requests
    await supabase.from('consent_requests').insert({
      patient_id: patientId,
      requestor_id: user.id,
      purpose: `Insurance verification for claim ${claimId}`,
      scope: dataScope,
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'pending',
    });

    await logAccess({
      actorId: user.id,
      actorRole: 'INSURANCE',
      action: 'CREATE_VERIFICATION_REQUEST',
      targetId: patientId,
      scope: dataScope,
      result: 'success',
    });

    return NextResponse.json({ id: data?.id });
  } catch {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
