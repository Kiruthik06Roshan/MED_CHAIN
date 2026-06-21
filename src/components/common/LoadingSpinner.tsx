import { cn } from '@/utils/cn';
import { Loader2 } from 'lucide-react';

interface Props {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  label?: string;
}

const sizes = { sm: 'w-4 h-4', md: 'w-6 h-6', lg: 'w-10 h-10' };

export function LoadingSpinner({ className, size = 'md', label = 'Loading...' }: Props) {
  return (
    <div className={cn('flex items-center justify-center gap-2', className)} role="status">
      <Loader2 className={cn('animate-spin text-primary', sizes[size])} />
      {label && <span className="text-sm text-muted-foreground">{label}</span>}
    </div>
  );
}

export function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <LoadingSpinner size="lg" />
    </div>
  );
}
