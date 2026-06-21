'use client';

/**
 * DEV-ONLY: /dev-login
 *
 * One-click login bypass for development — bypasses email OTP rate limits.
 * Confirm email + create session using the service role key via /api/dev-login.
 *
 * DELETE THIS FOLDER before deploying to production.
 * The API route also blocks in NODE_ENV=production.
 */

import { useState } from 'react';
import { Terminal, Zap, AlertTriangle, Loader2, CheckCircle2, Copy } from 'lucide-react';

const DEV_ACCOUNTS = [
  { label: 'Patient',   email: 'patient@medchain.dev',   role: 'PATIENT',   redirect: '/patient' },
  { label: 'Hospital',  email: 'hospital@medchain.dev',  role: 'HOSPITAL',  redirect: '/hospital' },
  { label: 'Pharmacy',  email: 'pharmacy@medchain.dev',  role: 'PHARMACY',  redirect: '/pharmacy' },
  { label: 'Insurance', email: 'insurance@medchain.dev', role: 'INSURANCE', redirect: '/insurance' },
  { label: 'Admin',     email: 'admin@medchain.dev',     role: 'ADMIN',     redirect: '/admin' },
];

export default function DevLoginPage() {
  const [customEmail, setCustomEmail] = useState('');
  const [loading, setLoading]         = useState<string | null>(null);
  const [result,  setResult]          = useState<{
    method: 'magiclink' | 'password';
    loginUrl?: string;
    email: string;
    password?: string;
    message?: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (email: string, role?: string) => {
    setLoading(email);
    setError(null);
    setResult(null);

    try {
      const res = await fetch('/api/dev-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, role }),
      });
      const data = await res.json() as typeof result & { error?: string };

      if (!res.ok || data.error) {
        setError(data.error ?? 'Unknown error');
        return;
      }

      setResult(data as NonNullable<typeof result>);

      // Auto-redirect via magic link
      if (data.method === 'magiclink' && data.loginUrl) {
        setTimeout(() => { window.location.href = data.loginUrl!; }, 800);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Request failed');
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-mono px-3 py-1 rounded-full mb-4">
            <Terminal className="w-3 h-3" />
            DEV ONLY — remove before deploy
          </div>
          <h1 className="text-2xl font-bold text-white flex items-center justify-center gap-2">
            <Zap className="w-6 h-6 text-amber-400" />
            Dev Login Bypass
          </h1>
          <p className="text-slate-400 text-sm mt-2">
            Bypasses email confirmation &amp; OTP limits using service role key
          </p>
        </div>

        {/* Warning */}
        <div className="flex items-start gap-3 bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 mb-6">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-300">
            This page is only available in <code className="bg-amber-900/40 px-1 rounded">development</code>. The API returns 403 in production.
            Delete <code className="bg-amber-900/40 px-1 rounded">/app/api/dev-login</code> and <code className="bg-amber-900/40 px-1 rounded">/app/dev-login</code> when done.
          </p>
        </div>

        {/* Quick-login cards */}
        <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-5 mb-4">
          <p className="text-xs text-slate-400 font-medium mb-3 uppercase tracking-wider">Quick Login</p>
          <div className="grid grid-cols-1 gap-2">
            {DEV_ACCOUNTS.map(acc => (
              <button
                key={acc.email}
                onClick={() => handleLogin(acc.email, acc.role)}
                disabled={!!loading}
                className="flex items-center justify-between px-4 py-3 bg-slate-700/50 hover:bg-slate-700 border border-slate-600 hover:border-slate-500 rounded-xl text-sm transition-all disabled:opacity-50 group"
              >
                <div className="text-left">
                  <p className="text-white font-medium group-hover:text-amber-300 transition-colors">
                    {acc.label}
                  </p>
                  <p className="text-slate-400 text-xs font-mono">{acc.email}</p>
                </div>
                {loading === acc.email ? (
                  <Loader2 className="w-4 h-4 text-amber-400 animate-spin" />
                ) : (
                  <Zap className="w-4 h-4 text-slate-500 group-hover:text-amber-400 transition-colors" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Custom email */}
        <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-5 mb-4">
          <p className="text-xs text-slate-400 font-medium mb-3 uppercase tracking-wider">Custom Email</p>
          <div className="flex gap-2">
            <input
              value={customEmail}
              onChange={e => setCustomEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && customEmail && handleLogin(customEmail)}
              placeholder="your@email.com"
              className="flex-1 bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
            />
            <button
              onClick={() => customEmail && handleLogin(customEmail)}
              disabled={!customEmail || !!loading}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black text-sm font-medium rounded-lg disabled:opacity-40 transition-colors flex items-center gap-1.5"
            >
              {loading === customEmail ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
              Login
            </button>
          </div>
        </div>

        {/* Result */}
        {result && (
          <div className="bg-emerald-900/30 border border-emerald-500/30 rounded-2xl p-5 mb-4">
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span className="text-emerald-300 font-medium text-sm">
                {result.method === 'magiclink' ? 'Redirecting via magic link…' : 'Email confirmed!'}
              </span>
            </div>
            {result.method === 'password' && (
              <div className="space-y-2">
                <p className="text-slate-400 text-xs">Use these credentials on the login page:</p>
                <div className="bg-slate-900/80 rounded-lg p-3 font-mono text-xs space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Email</span>
                    <span className="text-white">{result.email}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Password</span>
                    <div className="flex items-center gap-2">
                      <span className="text-amber-300">{result.password}</span>
                      <button
                        onClick={() => navigator.clipboard.writeText(result.password!)}
                        className="text-slate-500 hover:text-slate-300"
                      >
                        <Copy className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
                <a
                  href="/auth/login"
                  className="block text-center bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium py-2 rounded-lg mt-3 transition-colors"
                >
                  Go to Login Page →
                </a>
              </div>
            )}
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-900/30 border border-red-500/30 rounded-xl p-4">
            <p className="text-red-300 text-sm">{error}</p>
          </div>
        )}

        <p className="text-center text-slate-600 text-xs mt-6 font-mono">
          /dev-login · dev bypass · medchain
        </p>
      </div>
    </div>
  );
}
