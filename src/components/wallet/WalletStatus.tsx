'use client';

import { useWallet } from '@/hooks/useWallet';
import { Wallet, AlertCircle, Wifi, WifiOff } from 'lucide-react';
import { cn } from '@/utils/cn';

const SEPOLIA_CHAIN_ID = 11155111;

interface WalletStatusBadgeProps {
  className?: string;
}

function formatAddress(addr: string) {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

/**
 * Compact badge / pill that shows wallet connection state.
 * - Not connected  → grey "Not Connected" badge
 * - Connected + Sepolia → green badge with address
 * - Connected + wrong network → red "Wrong Network" badge
 */
export function WalletStatusBadge({ className }: WalletStatusBadgeProps) {
  const { address, isConnected, chainId } = useWallet();

  if (!isConnected) {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium bg-secondary text-muted-foreground border border-border',
          className
        )}
      >
        <WifiOff className="w-3 h-3" />
        Not Connected
      </span>
    );
  }

  const onSepolia = chainId === SEPOLIA_CHAIN_ID;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium border',
        onSepolia
          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
          : 'bg-red-50 text-red-700 border-red-200',
        className
      )}
    >
      {onSepolia ? (
        <Wifi className="w-3 h-3" />
      ) : (
        <AlertCircle className="w-3 h-3" />
      )}
      {onSepolia ? 'Sepolia' : 'Wrong Network'}
      {address && (
        <span className="ml-1 font-mono opacity-80">
          ({formatAddress(address)})
        </span>
      )}
    </span>
  );
}

/**
 * Re-export as `WalletStatus` so the integration docs naming is also valid.
 */
export { WalletStatusBadge as WalletStatus };

/**
 * Convenience named export for the full block-style wallet widget.
 * Re-exports the existing blockchain/WalletStatus component so you can
 * import either path without duplication.
 */
export { WalletStatus as BlockWalletStatus } from '@/components/blockchain/WalletStatus';
