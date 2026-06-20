'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { createClient } from '@/lib/supabaseClient';
import { ROLES, ROLE_LABELS } from '@/constants/roles';
import type { UserRole } from '@/constants/roles';
import { ROLE_HOME_ROUTES } from '@/constants/routes';
import { Eye, EyeOff, Loader2, UserPlus, Mail } from 'lucide-react';

const schema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters'),
  role: z.enum(['PATIENT', 'HOSPITAL', 'PHARMACY', 'INSURANCE', 'ADMIN']),
  organizationName: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export default function SignupPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState('');
  const [emailSent, setEmailSent] = useState(false);
  const [sentEmail, setSentEmail] = useState('');

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { role: 'PATIENT' },
  });

  const selectedRole = watch('role') as UserRole;
  const needsOrg = (['HOSPITAL', 'PHARMACY', 'INSURANCE'] as UserRole[]).includes(selectedRole);

  const onSubmit = async (data: FormData) => {
    setServerError('');
    const supabase = createClient();

    const { data: authData, error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          full_name: data.fullName,
          role: data.role,
          organization_name: data.organizationName ?? null,
        },
      },
    });

    if (error) {
      setServerError(error.message);
      return;
    }

    // If Supabase returned a session immediately (email confirmation disabled),
    // redirect the user straight to their role portal.
    if (authData.session) {
      const home = ROLE_HOME_ROUTES[data.role] ?? '/';
      window.location.href = home;
      return;
    }

    // Email confirmation is required — show a confirmation prompt on this page.
    setSentEmail(data.email);
    setEmailSent(true);
  };

  // ── Email confirmation sent state ──────────────────────────────────────────
  if (emailSent) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-8 border border-border text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 bg-emerald-50 rounded-full mb-4">
          <Mail className="w-7 h-7 text-emerald-600" />
        </div>
        <h1 className="text-xl font-bold text-foreground mb-2">Check your inbox</h1>
        <p className="text-muted-foreground text-sm mb-1">
          We sent a confirmation link to
        </p>
        <p className="font-medium text-foreground mb-6">{sentEmail}</p>
        <p className="text-sm text-muted-foreground mb-6">
          Click the link in the email to activate your account. After confirming,
          you&apos;ll be signed in automatically.
        </p>
        <Link
          href="/auth/login"
          className="inline-block bg-primary text-primary-foreground px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          Go to Sign In
        </Link>
      </div>
    );
  }

  // ── Sign-up form ──────────────────────────────────────────────────────────
  return (
    <div className="bg-white rounded-2xl shadow-lg p-8 border border-border">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-12 h-12 bg-primary/10 rounded-xl mb-4">
          <UserPlus className="w-6 h-6 text-primary" />
        </div>
        <h1 className="text-2xl font-bold text-foreground">Create your account</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Join MedChain&apos;s secure health network
        </p>
      </div>

      {serverError && (
        <div className="mb-4 p-3 bg-destructive/10 text-destructive text-sm rounded-lg border border-destructive/20">
          {serverError}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Full Name */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            Full Name
          </label>
          <input
            {...register('fullName')}
            autoComplete="name"
            placeholder="Dr. Jane Smith"
            className="w-full px-3 py-2 border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring bg-background"
          />
          {errors.fullName && (
            <p className="text-xs text-destructive mt-1">{errors.fullName.message}</p>
          )}
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            Email
          </label>
          <input
            {...register('email')}
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            className="w-full px-3 py-2 border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring bg-background"
          />
          {errors.email && (
            <p className="text-xs text-destructive mt-1">{errors.email.message}</p>
          )}
        </div>

        {/* Role */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            I am a…
          </label>
          <select
            {...register('role')}
            className="w-full px-3 py-2 border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring bg-background"
          >
            {(Object.keys(ROLES) as UserRole[]).map(key => (
              <option key={key} value={key}>
                {ROLE_LABELS[key]}
              </option>
            ))}
          </select>
          {errors.role && (
            <p className="text-xs text-destructive mt-1">{errors.role.message}</p>
          )}
        </div>

        {/* Organization (conditional) */}
        {needsOrg && (
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Organization Name
            </label>
            <input
              {...register('organizationName')}
              autoComplete="organization"
              placeholder="City General Hospital"
              className="w-full px-3 py-2 border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring bg-background"
            />
            {errors.organizationName && (
              <p className="text-xs text-destructive mt-1">{errors.organizationName.message}</p>
            )}
          </div>
        )}

        {/* Password */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            Password
          </label>
          <div className="relative">
            <input
              {...register('password')}
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              placeholder="Min. 8 characters"
              className="w-full px-3 py-2 pr-10 border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring bg-background"
            />
            <button
              type="button"
              onClick={() => setShowPassword(v => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.password && (
            <p className="text-xs text-destructive mt-1">{errors.password.message}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-primary text-primary-foreground py-2.5 rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors mt-2"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Creating account…
            </>
          ) : (
            'Create Account'
          )}
        </button>
      </form>

      <p className="text-center text-sm text-muted-foreground mt-6">
        Already have an account?{' '}
        <Link href="/auth/login" className="text-primary font-medium hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
