'use client';

import { useState } from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { useSignatureVerifier } from '@/hooks/useContract';
import { useWallet } from '@/hooks/useWallet';
import { ConnectWalletButton } from '@/components/wallet/ConnectWalletButton';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { formatAddress } from '@/utils/blockchain';

export default function VerificationPage() {
  const { verify } = useSignatureVerifier();
  const { isConnected } = useWallet();
  const [form, setForm] = useState({ signer: '', messageHash: '', v: '', r: '', s: '' });
  const [result, setResult] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    const res = await verify(form.signer, form.messageHash, Number(form.v), form.r, form.s);
    setResult(res);
    setLoading(false);
  };

  return (
    <div>
      <PageHeader title="Signature Verification"
        description="Verify a prescription or consent signature using the on-chain SignatureVerifier contract." />

      <div className="max-w-2xl space-y-6">
        {!isConnected && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <p className="text-sm text-amber-700 mb-3">Connect your wallet to verify signatures on-chain.</p>
            <ConnectWalletButton variant="outline" size="sm" />
          </div>
        )}

        <div className="bg-white border border-border rounded-xl p-6">
          <form onSubmit={handleVerify} className="space-y-4">
            {(['signer', 'messageHash', 'r', 's'] as const).map(field => (
              <div key={field}>
                <label className="block text-sm font-medium mb-1 capitalize">{field}</label>
                <input value={form[field]} onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))}
                  placeholder={field === 'signer' ? '0x...' : '0x...'}
                  className="w-full px-3 py-2 border border-input rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ring" />
              </div>
            ))}
            <div>
              <label className="block text-sm font-medium mb-1">V (recovery byte, 27 or 28)</label>
              <input value={form.v} onChange={e => setForm(f => ({ ...f, v: e.target.value }))} type="number"
                className="w-full px-3 py-2 border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <button type="submit" disabled={loading || !isConnected}
              className="flex items-center gap-2 bg-primary text-primary-foreground px-6 py-2 rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors">
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Verify On-Chain
            </button>
          </form>
        </div>

        {result !== null && (
          <div className={`flex items-center gap-3 p-4 rounded-xl border ${result ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
            {result
              ? <CheckCircle className="w-6 h-6 text-emerald-600" />
              : <XCircle className="w-6 h-6 text-red-600" />}
            <div>
              <p className={`font-semibold ${result ? 'text-emerald-700' : 'text-red-700'}`}>
                {result ? 'Signature Valid' : 'Signature Invalid'}
              </p>
              <p className="text-sm text-muted-foreground">
                {result
                  ? `Signer ${formatAddress(form.signer)} is verified.`
                  : 'The signature does not match the provided signer address.'}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
