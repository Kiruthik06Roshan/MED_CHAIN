'use client';

import { useState } from 'react';
import type { ConsentRequest } from '@/types/consent';
import { useWallet } from '@/hooks/useWallet';
import { useSignature } from '@/hooks/useSignature';
import { SignatureVerificationPanel } from './SignatureVerificationPanel';
import { formatConsentScope } from '@/utils/consent';
import { ShieldCheck, X, Wallet } from 'lucide-react';
import { format } from 'date-fns';

interface Props {
  request: ConsentRequest;
  onClose: () => void;
  onGranted: () => void;
}

export function ConsentDialog({ request, onClose, onGranted }: Props) {
  const { isConnected, connectWallet } = useWallet();
  const { signConsentPayload, isSigningPending, signatureError } = useSignature();
  const [step, setStep] = useState<'review' | 'signing' | 'done'>('review');
  const [signedData, setSignedData] = useState<Awaited<ReturnType<typeof signConsentPayload>>>(null);

  const handleSign = async () => {
    setStep('signing');
    const result = await signConsentPayload(request);
    if (!result) {
      setStep('review');
      return;
    }
    setSignedData(result);

    // Submit to API
    await fetch('/api/patient/consent/sign', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ consentRequest: request, ...result }),
    });

    setStep('done');
    setTimeout(() => { onGranted(); onClose(); }, 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[var(--z-modal)] p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-primary" />
            <h2 className="font-semibold text-lg">Access Request</h2>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {step === 'review' && (
            <>
              <div className="bg-secondary/50 rounded-xl p-4 space-y-2">
                <p className="text-sm"><span className="font-medium">Requestor:</span> {request.requestorName}</p>
                <p className="text-sm"><span className="font-medium">Purpose:</span> {request.purpose}</p>
                <p className="text-sm"><span className="font-medium">Data Scope:</span> {formatConsentScope(request.scope)}</p>
                <p className="text-sm"><span className="font-medium">Expires:</span> {format(new Date(request.expiryDate), 'MMM d, yyyy')}</p>
              </div>

              <p className="text-xs text-muted-foreground">
                By approving, you authorize {request.requestorName} to access the listed data for the specified purpose. This consent is signed with your wallet and recorded on-chain.
              </p>

              {!isConnected ? (
                <button onClick={connectWallet}
                  className="w-full flex items-center justify-center gap-2 border border-primary text-primary px-4 py-2 rounded-lg font-medium hover:bg-primary/10 transition-colors">
                  <Wallet className="w-4 h-4" />
                  Connect Wallet to Sign
                </button>
              ) : (
                <div className="flex gap-3">
                  <button onClick={onClose}
                    className="flex-1 border border-border px-4 py-2 rounded-lg text-sm font-medium hover:bg-secondary transition-colors">
                    Deny
                  </button>
                  <button onClick={handleSign}
                    className="flex-1 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors">
                    Review & Sign
                  </button>
                </div>
              )}
            </>
          )}

          {step === 'signing' && (
            <SignatureVerificationPanel
              isSigningPending={isSigningPending}
              error={signatureError}
              signedData={signedData}
            />
          )}

          {step === 'done' && (
            <div className="text-center py-4">
              <ShieldCheck className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
              <p className="font-semibold text-foreground">Consent Granted</p>
              <p className="text-sm text-muted-foreground mt-1">Access has been authorized and recorded.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
