import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabaseServer';
import { logAccess } from '@/services/audit';

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await supabase.from('consent_requests')
      .update({ status: 'denied' })
      .eq('id', id)
      .eq('patient_id', user.id);

    await logAccess({
      actorId: user.id,
      actorRole: 'PATIENT',
      action: 'DENY_ACCESS_REQUEST',
      targetId: id,
      scope: [],
      result: 'denied',
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
