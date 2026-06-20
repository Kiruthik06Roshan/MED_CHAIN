'use client';

import { useCallback } from 'react';
import { Contract, ethers } from 'ethers';
import { useWallet } from '@/hooks/useWallet';
import ABI from '@/lib/contracts/abi/SignatureVerifier.json';

const CONTRACT_ADDRESS =
  process.env.NEXT_PUBLIC_CONTRACT_ADDRESS ??
  '0x858711d89dc69EaF44Dc742502F841E927ca5C4a';

/** Low-level hook: returns a typed contract instance bound to the current signer */
export function useSignatureVerifier() {
  const { getSigner, address, isConnected } = useWallet();

  const getContract = useCallback(async (): Promise<Contract | null> => {
    if (!isConnected) return null;
    const signer = await getSigner();
    if (!signer) return null;
    return new Contract(CONTRACT_ADDRESS, ABI, signer);
  }, [isConnected, getSigner]);

  const verify = useCallback(
    async (
      signer: string,
      messageHash: string,
      v: number,
      r: string,
      s: string
    ): Promise<boolean | null> => {
      if (!isConnected || !address) return null;
      try {
        const contract = await getContract();
        if (!contract) return null;
        return (await contract.verify(signer, messageHash, v, r, s)) as boolean;
      } catch (err) {
        console.error('[useSignatureVerifier] verify error:', err);
        return null;
      }
    },
    [isConnected, address, getContract]
  );

  return { getContract, verify };
}

/**
 * Higher-level hook: sign a message, then verify it on-chain in one call.
 * Returns { valid, txHash } or null on failure.
 */
export function useContract() {
  const { getSigner, address, isConnected } = useWallet();

  const getContract = useCallback(async (): Promise<Contract | null> => {
    if (!isConnected) return null;
    const signer = await getSigner();
    if (!signer) return null;
    return new Contract(CONTRACT_ADDRESS, ABI, signer);
  }, [isConnected, getSigner]);

  const verifySignature = useCallback(
    async (
      message: string,
      signature: string
    ): Promise<{ valid: boolean; txHash?: string } | null> => {
      if (!isConnected || !address) {
        console.error('[useContract] Wallet not connected');
        return null;
      }

      try {
        const contract = await getContract();
        if (!contract) return null;

        const messageHash = ethers.keccak256(ethers.toUtf8Bytes(message));
        const sig = ethers.Signature.from(signature);

        const tx = await contract.verify(
          address,
          messageHash,
          sig.v,
          sig.r,
          sig.s
        );

        const receipt = await tx.wait();
        return { valid: true, txHash: receipt.hash as string };
      } catch (err) {
        console.error('[useContract] verifySignature error:', err);
        return { valid: false };
      }
    },
    [isConnected, address, getContract]
  );

  return { getContract, verifySignature };
}
