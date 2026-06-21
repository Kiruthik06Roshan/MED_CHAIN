'use client';

import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { formatAddress } from '@/utils/blockchain';

interface Props {
  isSigningPending: boolean;
  error: string | null;
  signedData?: {
    signer: string;
    signature: string;
    payload: Record<string, unknown>;
  } | null;
}

export function SignatureVerificationPanel({ isSigningPending, error, signedData }: Props) {
  return (
    <div className="space-y-4">
      {isSigningPending && (
        <div className="flex flex-col items-center gap-3 py-6">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
          <p className="font-medium text-foreground">Waiting for wallet signature…</p>
          <p className="text-sm text-muted-foreground text-center">
            Please check MetaMask and sign the consent message.
          </p>
        </div>
      )}

      {error && (
        <div className="flex items-start gap-3 bg-destructive/10 border border-destructive/20 rounded-xl p-4">
          <AlertCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-destructive">Signing failed</p>
            <p className="text-sm text-muted-foreground">{error}</p>
          </div>
        </div>
      )}

      {signedData && !isSigningPending && !error && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle className="w-5 h-5 text-emerald-600" />
            <p className="font-medium text-emerald-700">Signature captured</p>
          </div>
          <div className="space-y-1 text-xs text-muted-foreground font-mono">
            <p>Signer: {formatAddress(signedData.signer)}</p>
            <p className="break-all">Sig: {signedData.signature.slice(0, 40)}…</p>
          </div>
        </div>
      )}
    </div>
  );
}
