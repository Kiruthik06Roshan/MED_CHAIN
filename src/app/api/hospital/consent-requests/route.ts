import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabaseServer';

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data } = await supabase
      .from('consent_requests')
      .select('*')
      .eq('requestor_id', user.id)
      .order('created_at', { ascending: false });

    const requests = (data ?? []).map(r => ({
      id: r.id,
      requestorId: r.requestor_id,
      patientId: r.patient_id,
      purpose: r.purpose,
      scope: r.scope ?? [],
      expiryDate: r.expires_at,
      createdAt: r.created_at,
      status: r.status,
    }));

    return NextResponse.json(requests);
  } catch {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { patientId, purpose, scope, expiryDate } = await req.json();
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data, error } = await supabase.from('consent_requests').insert({
      patient_id: patientId,
      requestor_id: user.id,
      purpose,
      scope,
      expires_at: expiryDate ?? new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'pending',
    }).select().single();

    if (error) throw error;

    return NextResponse.json({ id: data?.id });
  } catch {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
