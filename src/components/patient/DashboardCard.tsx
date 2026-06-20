import { cn } from '@/utils/cn';
import type { LucideIcon } from 'lucide-react';

interface Props {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
  trendUp?: boolean;
  color?: 'blue' | 'green' | 'indigo' | 'amber';
  className?: string;
}

const colorMap = {
  blue: { bg: 'bg-blue-50', icon: 'text-blue-600', trend: 'text-blue-600' },
  green: { bg: 'bg-emerald-50', icon: 'text-emerald-600', trend: 'text-emerald-600' },
  indigo: { bg: 'bg-indigo-50', icon: 'text-indigo-600', trend: 'text-indigo-600' },
  amber: { bg: 'bg-amber-50', icon: 'text-amber-600', trend: 'text-amber-600' },
};

export function DashboardCard({ title, value, icon: Icon, trend, trendUp, color = 'blue', className }: Props) {
  const colors = colorMap[color];
  return (
    <div className={cn('bg-white rounded-xl p-6 border border-border shadow-card hover:shadow-card-hover transition-shadow', className)}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-3xl font-bold text-foreground mt-1">{value}</p>
          {trend && (
            <p className={cn('text-xs mt-1 font-medium', trendUp ? 'text-emerald-600' : 'text-muted-foreground')}>
              {trend}
            </p>
          )}
        </div>
        <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center', colors.bg)}>
          <Icon className={cn('w-6 h-6', colors.icon)} />
        </div>
      </div>
    </div>
  );
}
