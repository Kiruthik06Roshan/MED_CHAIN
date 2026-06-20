'use client';

import { useCallback } from 'react';
import { useWallet } from '@/hooks/useWallet';
import { verifySignatureOnChain } from '@/lib/contracts/SignatureVerifier';
import { BrowserProvider } from 'ethers';

export function useSignatureVerifier() {
  const { provider } = useWallet();

  const verify = useCallback(async (
    signer: string,
    messageHash: string,
    v: number,
    r: string,
    s: string
  ): Promise<boolean | null> => {
    if (!provider) return null;
    try {
      return await verifySignatureOnChain(signer, messageHash, v, r, s, provider as BrowserProvider);
    } catch (err) {
      console.error('[useSignatureVerifier] verify error:', err);
      return null;
    }
  }, [provider]);

  return { verify };
}
