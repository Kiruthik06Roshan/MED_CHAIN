'use client';

import { Loader2, CheckCircle, XCircle, ExternalLink } from 'lucide-react';
import { getExplorerUrl, formatHash } from '@/utils/blockchain';
import { cn } from '@/utils/cn';

type TxStatus = 'pending' | 'confirmed' | 'failed';

interface Props {
  txHash: string;
  status: TxStatus;
  confirmations?: number;
  className?: string;
}

const statusConfig: Record<TxStatus, { icon: React.ElementType; color: string; label: string }> = {
  pending: { icon: Loader2, color: 'text-amber-600', label: 'Pending' },
  confirmed: { icon: CheckCircle, color: 'text-emerald-600', label: 'Confirmed' },
  failed: { icon: XCircle, color: 'text-destructive', label: 'Failed' },
};

export function TransactionStatus({ txHash, status, confirmations, className }: Props) {
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <div className={cn('bg-white border border-border rounded-xl p-4', className)}>
      <div className="flex items-center gap-2 mb-2">
        <Icon className={cn('w-4 h-4', config.color, status === 'pending' && 'animate-spin')} />
        <span className={cn('text-sm font-medium', config.color)}>{config.label}</span>
        {confirmations !== undefined && status === 'confirmed' && (
          <span className="text-xs text-muted-foreground">({confirmations} confirmations)</span>
        )}
      </div>
      <div className="flex items-center gap-2">
        <span className="text-xs font-mono text-muted-foreground">{formatHash(txHash)}</span>
        <a href={getExplorerUrl(txHash)} target="_blank" rel="noreferrer"
          className="text-xs text-primary hover:underline flex items-center gap-1">
          <ExternalLink className="w-3 h-3" />
          Explorer
        </a>
      </div>
    </div>
  );
}
