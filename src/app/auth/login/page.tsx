'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { createClient } from '@/lib/supabaseClient';
import { ROLE_HOME_ROUTES } from '@/constants/routes';
import { Eye, EyeOff, Loader2, Shield, CheckCircle, AlertCircle } from 'lucide-react';

const schema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type FormData = z.infer<typeof schema>;

const VALID_ROLES = ['PATIENT', 'HOSPITAL', 'PHARMACY', 'INSURANCE', 'ADMIN'] as const;

export default function LoginPage() {
  // Read URL params after mount — avoids useSearchParams + Suspense entirely.
  // Without this, Next.js 15 SSR bails on the Suspense boundary and the form
  // renders without React attached, causing native GET submission.
  const [redirectTo, setRedirectTo]   = useState<string | null>(null);
  const [message,    setMessage]      = useState<string | null>(null);
  const [urlError,   setUrlError]     = useState<string | null>(null);

  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    setRedirectTo(p.get('redirectTo'));
    setMessage(p.get('message'));
    setUrlError(p.get('error'));
  }, []);

  const [showPassword,  setShowPassword]  = useState(false);
  const [serverError,   setServerError]   = useState('');
  const [isRedirecting, setIsRedirecting] = useState(false);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setServerError('');

    const supabase = createClient();
    const { data: authData, error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });

    if (error) {
      setServerError(error.message);
      return;
    }

    if (!authData.user) {
      setServerError('Login failed. Please try again.');
      return;
    }

    setIsRedirecting(true);

    // Re-read from window.location in case the state setter hasn't flushed yet.
    const params      = new URLSearchParams(window.location.search);
    const rawRedirect = params.get('redirectTo') ?? redirectTo;

    if (rawRedirect && rawRedirect.startsWith('/') && !rawRedirect.startsWith('/auth')) {
      window.location.href = rawRedirect;
      return;
    }

    // Ask the server to ensure user_profiles row exists and return the confirmed role.
    try {
      const res = await fetch('/api/auth/sync-profile', { method: 'POST' });
      if (res.ok) {
        const { role } = await res.json() as { role?: string };
        if (role && ROLE_HOME_ROUTES[role]) {
          window.location.href = ROLE_HOME_ROUTES[role];
          return;
        }
      }
    } catch {
      // network error — fall through to metadata fallback
    }

    const metaRole  = authData.user.user_metadata?.role as string | undefined;
    const validMeta = metaRole && VALID_ROLES.includes(metaRole as typeof VALID_ROLES[number]);
    window.location.href = ROLE_HOME_ROUTES[validMeta ? metaRole! : 'PATIENT'] ?? '/patient';
  };

  const signInWithGoogle = async () => {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  };

  const busy = isSubmitting || isRedirecting;

  return (
    <div className="bg-white rounded-2xl shadow-lg p-8 border border-border">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-12 h-12 bg-primary/10 rounded-xl mb-4">
          <Shield className="w-6 h-6 text-primary" />
        </div>
        <h1 className="text-2xl font-bold text-foreground">Welcome back</h1>
        <p className="text-muted-foreground mt-1 text-sm">Sign in to your MedChain account</p>
      </div>

      {/* URL-param messages */}
      {message && (
        <div className="mb-4 p-3 bg-emerald-50 text-emerald-700 text-sm rounded-lg border border-emerald-200 flex items-start gap-2">
          <CheckCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>{message}</span>
        </div>
      )}
      {urlError && (
        <div className="mb-4 p-3 bg-destructive/10 text-destructive text-sm rounded-lg border border-destructive/20 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>
            {urlError === 'auth_callback_error'
              ? 'Authentication failed. Please try again.'
              : urlError}
          </span>
        </div>
      )}

      {/* Server-side / submit error */}
      {serverError && (
        <div className="mb-4 p-3 bg-destructive/10 text-destructive text-sm rounded-lg border border-destructive/20 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>{serverError}</span>
        </div>
      )}

      {/* Redirecting banner */}
      {isRedirecting && (
        <div className="mb-4 p-3 bg-primary/5 text-primary text-sm rounded-lg border border-primary/20 flex items-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin" />
          Signing you in…
        </div>
      )}

      {/* Form — onSubmit is always attached because there is no Suspense boundary */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Email</label>
          <input
            {...register('email')}
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            className="w-full px-3 py-2 border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring bg-background disabled:opacity-50"
            disabled={busy}
          />
          {errors.email && <p className="text-xs text-destructive mt-1">{errors.email.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Password</label>
          <div className="relative">
            <input
              {...register('password')}
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              placeholder="••••••••"
              className="w-full px-3 py-2 pr-10 border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring bg-background disabled:opacity-50"
              disabled={busy}
            />
            <button
              type="button"
              onClick={() => setShowPassword(v => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              tabIndex={-1}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.password && <p className="text-xs text-destructive mt-1">{errors.password.message}</p>}
        </div>

        <button
          type="submit"
          disabled={busy}
          className="w-full bg-primary text-primary-foreground py-2.5 rounded-lg font-medium hover:bg-primary/90 disabled:opacity-60 flex items-center justify-center gap-2 transition-colors"
        >
          {busy ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              {isRedirecting ? 'Opening portal…' : 'Signing in…'}
            </>
          ) : (
            'Sign In'
          )}
        </button>
      </form>

      {/* Google OAuth */}
      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="bg-white px-2 text-muted-foreground">or continue with</span>
        </div>
      </div>

      <button
        onClick={signInWithGoogle}
        disabled={busy}
        className="w-full border border-input py-2.5 rounded-lg text-sm font-medium hover:bg-secondary disabled:opacity-60 transition-colors flex items-center justify-center gap-2"
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24" aria-hidden="true">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
        Continue with Google
      </button>

      <p className="text-center text-sm text-muted-foreground mt-6">
        Don&apos;t have an account?{' '}
        <Link href="/auth/signup" className="text-primary font-medium hover:underline">
          Sign up
        </Link>
      </p>
    </div>
  );
}
