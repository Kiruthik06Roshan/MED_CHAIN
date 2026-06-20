import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabaseServer';
import { logAccess } from '@/services/audit';

export async function POST(req: Request) {
  try {
    const { consentRequest, payload, signature, signer, v, r, s } = await req.json();
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data, error } = await supabase.from('consents').insert({
      patient_id: user.id,
      grantee_id: consentRequest.requestorId,
      purpose: consentRequest.purpose,
      scope: consentRequest.scope,
      signed_payload: payload,
      signature_proof: { signer, signature, v, r, s, timestamp: new Date().toISOString() },
      is_active: true,
      expires_at: consentRequest.expiryDate,
      granted_at: new Date().toISOString(),
    }).select().single();

    if (error) throw error;

    // Update request status
    await supabase.from('consent_requests')
      .update({ status: 'approved' })
      .eq('id', consentRequest.id);

    await logAccess({
      actorId: user.id,
      actorRole: 'PATIENT',
      action: 'SIGN_CONSENT',
      targetId: data?.id ?? consentRequest.id,
      scope: consentRequest.scope,
      result: 'success',
    });

    return NextResponse.json({ success: true, consentId: data?.id });
  } catch {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
