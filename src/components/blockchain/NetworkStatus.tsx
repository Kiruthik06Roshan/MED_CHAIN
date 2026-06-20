'use client';

import { useWallet } from '@/hooks/useWallet';
import { cn } from '@/utils/cn';
import { Network } from 'lucide-react';

const EXPECTED_CHAIN_ID = Number(process.env.NEXT_PUBLIC_CHAIN_ID ?? 11155111);
const CHAIN_NAMES: Record<number, string> = {
  1: 'Ethereum Mainnet',
  11155111: 'Sepolia Testnet',
  31337: 'Hardhat Local',
};

interface Props {
  className?: string;
}

export function NetworkStatus({ className }: Props) {
  const { chainId, isConnected } = useWallet();
  const isCorrectNetwork = chainId === EXPECTED_CHAIN_ID;
  const networkName = chainId ? (CHAIN_NAMES[chainId] ?? `Chain ${chainId}`) : 'Not connected';

  return (
    <div className={cn('bg-white border border-border rounded-xl p-4', className)}>
      <h3 className="font-semibold mb-3 flex items-center gap-2 text-sm">
        <Network className="w-4 h-4 text-primary" />
        Network
      </h3>

      {isConnected ? (
        <div className="flex items-center gap-2">
          <div className={cn('w-2 h-2 rounded-full', isCorrectNetwork ? 'bg-emerald-500' : 'bg-amber-500')} />
          <span className={cn('text-sm font-medium', isCorrectNetwork ? 'text-emerald-700' : 'text-amber-700')}>
            {networkName}
          </span>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">Connect wallet to see network</p>
      )}

      {isConnected && !isCorrectNetwork && (
        <p className="text-xs text-amber-600 mt-2">
          Please switch to {CHAIN_NAMES[EXPECTED_CHAIN_ID]} for signature verification.
        </p>
      )}
    </div>
  );
}
