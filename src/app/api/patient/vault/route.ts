import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabaseServer';

export async function GET(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');

    let query = supabase.from('medical_records').select('*').eq('patient_id', user.id).order('created_at', { ascending: false });
    if (type) query = query.eq('type', type);
    if (dateFrom) query = query.gte('created_at', dateFrom);
    if (dateTo) query = query.lte('created_at', dateTo);

    const { data, error } = await query;
    if (error) throw error;

    const records = (data ?? []).map(r => ({
      id: r.id,
      type: r.type,
      title: r.data?.title ?? `${r.type} record`,
      provider: r.data?.provider ?? 'Unknown',
      date: r.data?.date ?? r.created_at,
      data: r.data,
      signatureProof: r.signature_proof,
      createdAt: r.created_at,
    }));

    return NextResponse.json(records);
  } catch {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
