'use client';

import { useState, useCallback } from 'react';
import { useWallet } from '@/hooks/useWallet';
import { createConsentPayload } from '@/utils/consent';
import type { ConsentRequest } from '@/types/consent';
import { splitSignature } from '@/utils/blockchain';

export function useSignature() {
  const { signMessage, address } = useWallet();
  const [isSigningPending, setIsSigningPending] = useState(false);
  const [signatureError, setSignatureError] = useState<string | null>(null);

  const signConsentPayload = useCallback(async (request: ConsentRequest) => {
    if (!address) {
      setSignatureError('Wallet not connected');
      return null;
    }
    setIsSigningPending(true);
    setSignatureError(null);
    try {
      const payload = createConsentPayload(request);
      const message = JSON.stringify(payload);
      const signature = await signMessage(message);
      if (!signature) throw new Error('Signing cancelled');
      const { v, r, s } = splitSignature(signature);
      return { payload, signature, v, r, s, signer: address };
    } catch (err) {
      setSignatureError(err instanceof Error ? err.message : 'Signing failed');
      return null;
    } finally {
      setIsSigningPending(false);
    }
  }, [address, signMessage]);

  return { signConsentPayload, isSigningPending, signatureError };
}
