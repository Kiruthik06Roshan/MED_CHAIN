import { Contract, BrowserProvider, type Signer } from 'ethers';
import ABI from './abi/SignatureVerifier.json';

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS ?? '';

export function initializeContract(provider: BrowserProvider | Signer) {
  return new Contract(CONTRACT_ADDRESS, ABI, provider);
}

export async function verifySignatureOnChain(
  signer: string,
  messageHash: string,
  v: number,
  r: string,
  s: string,
  provider: BrowserProvider
): Promise<boolean> {
  const contract = initializeContract(await provider.getSigner());
  return contract.verify(signer, messageHash, v, r, s) as Promise<boolean>;
}
