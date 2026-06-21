import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabaseServer';

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data, error } = await supabase
      .from('consents')
      .select('*, grantee:user_profiles!grantee_id(full_name)')
      .eq('patient_id', user.id)
      .order('granted_at', { ascending: false });

    if (error) throw error;

    const consents = (data ?? []).map(c => ({
      id: c.id,
      granteeId: c.grantee_id,
      granteeName: (c.grantee as { full_name?: string })?.full_name ?? 'Unknown',
      grantorId: c.patient_id,
      purpose: c.purpose,
      scope: c.scope ?? [],
      signedPayload: c.signed_payload ?? {},
      blockchainTxHash: c.blockchain_tx_hash,
      signatureProof: c.signature_proof,
      isActive: c.is_active,
      expiresAt: c.expires_at,
      grantedAt: c.granted_at,
      revokedAt: c.revoked_at,
    }));

    return NextResponse.json(consents);
  } catch {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
