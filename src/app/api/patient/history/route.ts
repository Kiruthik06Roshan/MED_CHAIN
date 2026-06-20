import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabaseServer';

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data, error } = await supabase
      .from('medical_records')
      .select('*')
      .eq('patient_id', user.id)
      .eq('type', 'encounter')
      .order('created_at', { ascending: false });

    if (error) throw error;

    const encounters = (data ?? []).map(r => ({
      id: r.id,
      type: r.data?.encounter_type ?? 'visit',
      provider: r.data?.provider ?? 'Unknown',
      date: r.data?.date ?? r.created_at,
      notes: r.data?.notes,
      diagnoses: r.data?.diagnoses ?? [],
      procedures: r.data?.procedures ?? [],
    }));

    return NextResponse.json(encounters);
  } catch {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
