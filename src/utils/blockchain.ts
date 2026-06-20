export function formatAddress(address: string): string {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function formatHash(hash: string): string {
  if (!hash) return '';
  return `${hash.slice(0, 10)}...${hash.slice(-6)}`;
}

export function getExplorerUrl(hash: string, type: 'tx' | 'address' = 'tx'): string {
  const chainId = Number(process.env.NEXT_PUBLIC_CHAIN_ID ?? 11155111);
  const base = chainId === 11155111
    ? 'https://sepolia.etherscan.io'
    : 'https://etherscan.io';
  return `${base}/${type}/${hash}`;
}

export function toWei(amount: string | number): bigint {
  return BigInt(Math.floor(Number(amount) * 1e18));
}

export function fromWei(wei: bigint): string {
  return (Number(wei) / 1e18).toFixed(6);
}

export function splitSignature(sig: string): { v: number; r: string; s: string } {
  const clean = sig.startsWith('0x') ? sig.slice(2) : sig;
  const r = '0x' + clean.slice(0, 64);
  const s = '0x' + clean.slice(64, 128);
  const v = parseInt(clean.slice(128, 130), 16);
  return { v, r, s };
}
