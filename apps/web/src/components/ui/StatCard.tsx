import { clsx } from 'clsx';
import type { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon: LucideIcon;
  iconColor?: string;
  iconBg?: string;
  loading?: boolean;
}

export function StatCard({
  title,
  value,
  change,
  changeLabel = 'vs last period',
  icon: Icon,
  iconColor = 'text-brand-600',
  iconBg = 'bg-brand-50',
  loading = false,
}: StatCardProps) {
  const isPositive = change !== undefined && change >= 0;

  if (loading) {
    return (
      <div className="animate-pulse rounded-2xl border border-surface-200 bg-white p-6 dark:border-surface-700 dark:bg-surface-800">
        <div className="flex items-center justify-between">
          <div className="h-10 w-10 rounded-xl bg-surface-200 dark:bg-surface-700" />
          <div className="h-4 w-16 rounded bg-surface-200 dark:bg-surface-700" />
        </div>
        <div className="mt-4 h-8 w-24 rounded bg-surface-200 dark:bg-surface-700" />
        <div className="mt-2 h-4 w-32 rounded bg-surface-200 dark:bg-surface-700" />
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-surface-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md dark:border-surface-700 dark:bg-surface-800">
      <div className="flex items-center justify-between">
        <div className={clsx('flex h-10 w-10 items-center justify-center rounded-xl', iconBg)}>
          <Icon className={clsx('h-5 w-5', iconColor)} />
        </div>
        {change !== undefined && (
          <span
            className={clsx(
              'flex items-center gap-1 text-xs font-medium',
              isPositive ? 'text-green-600' : 'text-red-600'
            )}
          >
            {isPositive ? '↑' : '↓'} {Math.abs(change)}%
          </span>
        )}
      </div>
      <div className="mt-4">
        <p className="text-2xl font-bold text-surface-900 dark:text-white">{value}</p>
        <p className="mt-1 text-sm text-surface-500">{title}</p>
        {change !== undefined && (
          <p className="mt-0.5 text-xs text-surface-400">{changeLabel}</p>
        )}
      </div>
    </div>
  );
}
