import { createServerSupabaseClient } from '@/lib/supabaseServer';
import { NextResponse } from 'next/server';
import type { UserProfile } from '@/types/auth';

export interface AuthContext {
  user: UserProfile;
}

type Handler = (req: Request, ctx: AuthContext, params?: Record<string, string>) => Promise<Response>;

export function withAuth(handler: Handler) {
  return async (req: Request, params?: Record<string, string>) => {
    try {
      const supabase = await createServerSupabaseClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      const { data: profile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (!profile) {
        return NextResponse.json({ error: 'Profile not found' }, { status: 401 });
      }

      const authUser: UserProfile = {
        id: profile.id,
        email: profile.email,
        fullName: profile.full_name,
        role: profile.role,
        walletAddress: profile.wallet_address,
        createdAt: profile.created_at,
        updatedAt: profile.updated_at,
      };

      return handler(req, { user: authUser }, params);
    } catch (err) {
      console.error('[withAuth] error:', err);
      return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
  };
}
