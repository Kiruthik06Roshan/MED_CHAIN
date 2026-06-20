import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabaseServer';

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: profile } = await supabase.from('user_profiles').select('role').eq('id', user.id).single();
    if (profile?.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const start = Date.now();
    await supabase.from('user_profiles').select('id').limit(1);
    const latency = Date.now() - start;

    return NextResponse.json({
      apiLatency: latency,
      dbConnections: 1,
      contractAvailable: !!process.env.NEXT_PUBLIC_CONTRACT_ADDRESS,
      errorRate: 0,
      uptime: 99.9,
    });
  } catch {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
