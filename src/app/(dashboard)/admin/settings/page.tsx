'use client';

import { useState } from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { Settings, Loader2, Save } from 'lucide-react';

interface FeatureFlags {
  aiInsights: boolean;
  fraudDetection: boolean;
  blockchainVerification: boolean;
  googleAuth: boolean;
}

export default function AdminSettingsPage() {
  const [flags, setFlags] = useState<FeatureFlags>({
    aiInsights: true,
    fraudDetection: true,
    blockchainVerification: true,
    googleAuth: false,
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const toggle = (key: keyof FeatureFlags) =>
    setFlags(f => ({ ...f, [key]: !f[key] }));

  const handleSave = async () => {
    setSaving(true);
    await fetch('/api/admin/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ flags }),
    }).catch(() => null);
    setSaved(true);
    setSaving(false);
    setTimeout(() => setSaved(false), 3000);
  };

  const features: { key: keyof FeatureFlags; label: string; desc: string }[] = [
    { key: 'aiInsights', label: 'AI Safety Insights', desc: 'Enable AI-powered medication interaction and safety analysis.' },
    { key: 'fraudDetection', label: 'Fraud Detection', desc: 'Enable AI-powered anomaly detection for data access patterns.' },
    { key: 'blockchainVerification', label: 'Blockchain Verification', desc: 'Enable on-chain signature verification via SignatureVerifier contract.' },
    { key: 'googleAuth', label: 'Google OAuth', desc: 'Allow users to sign in with Google.' },
  ];

  return (
    <div>
      <PageHeader title="System Settings" description="Configure platform features and integrations." />

      <div className="max-w-2xl space-y-6">
        <div className="bg-white border border-border rounded-xl p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Settings className="w-5 h-5 text-primary" />
            Feature Flags
          </h3>
          <div className="space-y-4">
            {features.map(({ key, label, desc }) => (
              <div key={key} className="flex items-start justify-between gap-4 py-3 border-b border-border last:border-0">
                <div>
                  <p className="font-medium text-sm">{label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
                </div>
                <button
                  onClick={() => toggle(key)}
                  className={`relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors ${flags[key] ? 'bg-primary' : 'bg-secondary'}`}
                >
                  <span className={`inline-block h-5 w-5 rounded-full bg-white shadow transform transition-transform ${flags[key] ? 'translate-x-5' : 'translate-x-0'}`} />
                </button>
              </div>
            ))}
          </div>
          <button onClick={handleSave} disabled={saving}
            className="mt-4 flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saved ? 'Saved!' : 'Save Settings'}
          </button>
        </div>

        <div className="bg-white border border-border rounded-xl p-6">
          <h3 className="font-semibold mb-4">Environment Configuration</h3>
          <div className="space-y-2 text-sm">
            {[
              { label: 'Supabase URL', value: process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'Not configured' },
              { label: 'Chain ID', value: process.env.NEXT_PUBLIC_CHAIN_ID ?? '11155111 (Sepolia)' },
              { label: 'Contract Address', value: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS ?? 'Not deployed' },
              { label: 'AI Provider', value: process.env.GROQ_API_KEY ? 'Groq (configured)' : 'Not configured' },
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between py-2 border-b border-border last:border-0">
                <span className="text-muted-foreground">{label}</span>
                <span className="font-mono text-xs">{String(value).slice(0, 40)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
