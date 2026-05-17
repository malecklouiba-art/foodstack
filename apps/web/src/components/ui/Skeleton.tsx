import { clsx } from 'clsx';

interface SkeletonProps {
  className?: string;
  rounded?: 'sm' | 'md' | 'lg' | 'full';
}

export function Skeleton({ className, rounded = 'md' }: SkeletonProps) {
  return (
    <div
      className={clsx(
        'animate-pulse bg-surface-200 dark:bg-surface-700',
        {
          'rounded-sm': rounded === 'sm',
          'rounded-lg': rounded === 'md',
          'rounded-xl': rounded === 'lg',
          'rounded-full': rounded === 'full',
        },
        className
      )}
    />
  );
}

export function SkeletonText({ lines = 3, className }: { lines?: number; className?: string }) {
  return (
    <div className={clsx('space-y-2', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={clsx('h-4', i === lines - 1 ? 'w-3/4' : 'w-full')}
        />
      ))}
    </div>
  );
}

export function SkeletonCard() {
  return (
    <div className="rounded-2xl border border-surface-200 bg-white p-6 dark:border-surface-700 dark:bg-surface-800">
      <Skeleton className="mb-4 h-6 w-1/2" />
      <SkeletonText lines={3} />
    </div>
  );
}
