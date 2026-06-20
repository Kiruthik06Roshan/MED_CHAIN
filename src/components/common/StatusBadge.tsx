import { cn } from '@/utils/cn';
import type { StatusType, SeverityLevel } from '@/types';

const statusStyles: Record<StatusType, string> = {
  active: 'bg-emerald-100 text-emerald-700',
  inactive: 'bg-gray-100 text-gray-600',
  pending: 'bg-yellow-100 text-yellow-700',
  expired: 'bg-red-100 text-red-600',
  revoked: 'bg-red-100 text-red-700',
};

const severityStyles: Record<SeverityLevel, string> = {
  low: 'bg-emerald-100 text-emerald-700',
  medium: 'bg-yellow-100 text-yellow-700',
  high: 'bg-orange-100 text-orange-700',
  critical: 'bg-red-100 text-red-700',
};

interface StatusBadgeProps {
  status: StatusType;
  className?: string;
}

interface SeverityBadgeProps {
  severity: SeverityLevel;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize', statusStyles[status], className)}>
      {status}
    </span>
  );
}

export function SeverityBadge({ severity, className }: SeverityBadgeProps) {
  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize', severityStyles[severity], className)}>
      {severity}
    </span>
  );
}
