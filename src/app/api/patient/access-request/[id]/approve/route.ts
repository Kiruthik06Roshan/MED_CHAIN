import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabaseServer';
import { logAccess } from '@/services/audit';

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: req } = await supabase
      .from('consent_requests')
      .select('*')
      .eq('id', id)
      .eq('patient_id', user.id)
      .single();

    if (!req) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    await supabase.from('consent_requests').update({ status: 'approved' }).eq('id', id);

    // Create consent record
    await supabase.from('consents').insert({
      patient_id: user.id,
      grantee_id: req.requestor_id,
      purpose: req.purpose,
      scope: req.scope,
      is_active: true,
      expires_at: req.expires_at,
      granted_at: new Date().toISOString(),
    });

    await logAccess({
      actorId: user.id,
      actorRole: 'PATIENT',
      action: 'APPROVE_ACCESS_REQUEST',
      targetId: id,
      scope: req.scope ?? [],
      result: 'success',
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
