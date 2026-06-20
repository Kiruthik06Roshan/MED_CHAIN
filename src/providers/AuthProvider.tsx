'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { User } from '@supabase/supabase-js';
import type { UserProfile } from '@/types/auth';
import type { UserRole } from '@/constants/roles';
import { createClient } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import { ROUTES } from '@/constants/routes';

const VALID_ROLES: UserRole[] = ['PATIENT', 'HOSPITAL', 'PHARMACY', 'INSURANCE', 'ADMIN'];

interface AuthContextValue {
  user: UserProfile | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// Build a UserProfile from Supabase Auth JWT metadata.
// Used as an immediate fallback before the DB round-trip completes.
function profileFromMeta(authUser: User): UserProfile {
  const meta = authUser.user_metadata ?? {};
  const role: UserRole = VALID_ROLES.includes(meta.role) ? meta.role : 'PATIENT';
  return {
    id: authUser.id,
    email: authUser.email ?? meta.email ?? '',
    fullName: meta.full_name ?? (authUser.email ?? '').split('@')[0] ?? 'User',
    role,
    organizationName: meta.organization_name ?? undefined,
    walletAddress: undefined,
    phone: undefined,
    avatarUrl: undefined,
    createdAt: authUser.created_at,
    updatedAt: authUser.updated_at ?? authUser.created_at,
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  // Fetch the full profile from user_profiles table and merge it with the
  // current user state. Never clears the user on a fetch failure.
  const fetchProfile = useCallback(
    async (userId: string) => {
      const { data } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (data) {
        setUser({
          id: data.id,
          email: data.email,
          fullName: data.full_name,
          role: data.role as UserRole,
          walletAddress: data.wallet_address ?? undefined,
          organizationName: data.organization_name ?? undefined,
          phone: data.phone ?? undefined,
          avatarUrl: data.avatar_url ?? undefined,
          createdAt: data.created_at,
          updatedAt: data.updated_at,
        });
      }
      // If data is null (profile row missing), keep whatever was set from metadata
    },
    [supabase]
  );

  const refreshUser = useCallback(async () => {
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();
    if (authUser) {
      await fetchProfile(authUser.id);
    }
  }, [supabase, fetchProfile]);

  useEffect(() => {
    // Initial session check
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        // 1. Set immediately from JWT so sidebar/header render with correct role
        //    without waiting for the Supabase DB query.
        setUser(profileFromMeta(session.user));

        // 2. Enrich with full DB profile (wallet, phone, org name, etc.)
        await fetchProfile(session.user.id);
      }
      setIsLoading(false);
    });

    // Listen for sign-in / sign-out / token refresh
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setUser(profileFromMeta(session.user));
        await fetchProfile(session.user.id);
      } else {
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase, fetchProfile]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    router.push(ROUTES.AUTH.LOGIN);
  }, [supabase, router]);

  return (
    <AuthContext.Provider value={{ user, isLoading, signOut, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuthContext must be used within AuthProvider');
  return ctx;
}
