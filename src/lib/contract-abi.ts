/**
 * contract-abi.ts
 *
 * Re-exports the SignatureVerifier ABI and contract address as named exports
 * so that hooks can import from '@/lib/contract-abi' (as documented in the
 * MetaMask integration guide).
 *
 * The canonical ABI source lives in:
 *   src/lib/contracts/abi/SignatureVerifier.json
 */
import ABI from '@/lib/contracts/abi/SignatureVerifier.json';

export const SIGNATURE_VERIFIER_ABI = ABI;

export const CONTRACT_ADDRESS =
  process.env.NEXT_PUBLIC_CONTRACT_ADDRESS ??
  '0x858711d89dc69EaF44Dc742502F841E927ca5C4a';
