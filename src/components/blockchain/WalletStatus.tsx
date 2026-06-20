'use client';

import { useWallet } from '@/hooks/useWallet';
import { formatAddress } from '@/utils/blockchain';
import { Wallet, Loader2 } from 'lucide-react';
import { cn } from '@/utils/cn';

interface Props {
  className?: string;
}

export function WalletStatus({ className }: Props) {
  const { address, isConnected, isConnecting, connectWallet, error } = useWallet();

  return (
    <div className={cn('bg-white border border-border rounded-xl p-4', className)}>
      <h3 className="font-semibold mb-3 flex items-center gap-2 text-sm">
        <Wallet className="w-4 h-4 text-primary" />
        Wallet
      </h3>

      {isConnected && address ? (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 bg-emerald-500 rounded-full" />
            <span className="text-sm text-emerald-700 font-medium">Connected</span>
          </div>
          <p className="text-xs font-mono text-muted-foreground break-all">{address}</p>
          <p className="text-xs text-muted-foreground mt-1 font-mono">{formatAddress(address)}</p>
        </div>
      ) : (
        <div>
          <p className="text-sm text-muted-foreground mb-3">No wallet connected</p>
          {error && <p className="text-xs text-destructive mb-2">{error}</p>}
          <button onClick={connectWallet} disabled={isConnecting}
            className="flex items-center gap-2 bg-primary text-primary-foreground px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors">
            {isConnecting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Wallet className="w-3 h-3" />}
            {isConnecting ? 'Connecting…' : 'Connect MetaMask'}
          </button>
        </div>
      )}
    </div>
  );
}
