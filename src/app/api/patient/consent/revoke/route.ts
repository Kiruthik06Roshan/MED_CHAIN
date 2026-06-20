import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabaseServer';
import { logAccess } from '@/services/audit';

export async function POST(req: Request) {
  try {
    const { consentId } = await req.json();
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await supabase.from('consents')
      .update({ is_active: false, revoked_at: new Date().toISOString() })
      .eq('id', consentId)
      .eq('patient_id', user.id);

    await logAccess({
      actorId: user.id,
      actorRole: 'PATIENT',
      action: 'REVOKE_CONSENT',
      targetId: consentId,
      scope: [],
      result: 'success',
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
