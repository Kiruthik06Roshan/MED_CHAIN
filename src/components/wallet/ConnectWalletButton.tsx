'use client';

import { useWallet } from '@/hooks/useWallet';
import { Wallet, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { cn } from '@/utils/cn';

interface ConnectWalletButtonProps {
  /** Visual style variant */
  variant?: 'primary' | 'outline' | 'ghost';
  /** Size variant */
  size?: 'sm' | 'default' | 'lg';
  className?: string;
  /** Show truncated address when connected */
  showAddress?: boolean;
}

function formatAddress(addr: string) {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

const BASE =
  'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary';

const VARIANTS = {
  primary:
    'bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm',
  outline:
    'border border-border bg-white text-foreground hover:bg-secondary',
  ghost:
    'bg-transparent text-foreground hover:bg-secondary',
} as const;

const SIZES = {
  sm: 'text-xs px-3 py-1.5 h-8',
  default: 'text-sm px-4 py-2 h-9',
  lg: 'text-base px-5 py-2.5 h-11',
} as const;

export function ConnectWalletButton({
  variant = 'primary',
  size = 'default',
  className,
  showAddress = true,
}: ConnectWalletButtonProps) {
  const {
    address,
    isConnected,
    isConnecting,
    error,
    connect,
    disconnect,
  } = useWallet();

  const buttonCls = cn(BASE, VARIANTS[variant], SIZES[size], className);

  if (isConnected && address) {
    return (
      <button
        onClick={disconnect}
        className={cn(
          BASE,
          VARIANTS['outline'],
          SIZES[size],
          'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100',
          className
        )}
        title="Click to disconnect"
      >
        <CheckCircle2 className={size === 'sm' ? 'w-3 h-3' : 'w-4 h-4'} />
        {showAddress && (
          <span className="font-mono">{formatAddress(address)}</span>
        )}
      </button>
    );
  }

  return (
    <div className="inline-flex flex-col items-start gap-1">
      <button
        onClick={connect}
        disabled={isConnecting}
        className={buttonCls}
      >
        {isConnecting ? (
          <Loader2 className={cn('animate-spin', size === 'sm' ? 'w-3 h-3' : 'w-4 h-4')} />
        ) : (
          <Wallet className={size === 'sm' ? 'w-3 h-3' : 'w-4 h-4'} />
        )}
        {isConnecting ? 'Connecting…' : 'Connect MetaMask'}
      </button>

      {error && (
        <p className="flex items-center gap-1 text-xs text-destructive">
          <AlertCircle className="w-3 h-3 shrink-0" />
          {error}
        </p>
      )}
    </div>
  );
}
