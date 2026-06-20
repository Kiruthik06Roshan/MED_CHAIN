import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabaseServer';

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data, error } = await supabase
      .from('consent_requests')
      .select('*, requestor:user_profiles!requestor_id(full_name, role)')
      .eq('patient_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const requests = (data ?? []).map(r => ({
      id: r.id,
      requestorId: r.requestor_id,
      requestorName: (r.requestor as { full_name?: string; role?: string })?.full_name ?? 'Unknown',
      requestorRole: (r.requestor as { role?: string })?.role ?? 'HOSPITAL',
      purpose: r.purpose,
      scope: r.scope ?? [],
      dataCategories: r.data_categories ?? [],
      expiryDate: r.expires_at,
      createdAt: r.created_at,
      status: r.status,
    }));

    return NextResponse.json(requests);
  } catch {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
