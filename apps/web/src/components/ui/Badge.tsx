import { clsx } from 'clsx';

type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'brand';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  size?: 'sm' | 'md';
  dot?: boolean;
}

const variantClasses: Record<BadgeVariant, string> = {
  default: 'bg-surface-100 text-surface-700 dark:bg-surface-700 dark:text-surface-200',
  success: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-400',
  warning: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-400',
  danger: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-400',
  info: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-400',
  brand: 'bg-brand-100 text-brand-800 dark:bg-brand-900/40 dark:text-brand-400',
};

const dotClasses: Record<BadgeVariant, string> = {
  default: 'bg-surface-500',
  success: 'bg-green-500',
  warning: 'bg-yellow-500',
  danger: 'bg-red-500',
  info: 'bg-blue-500',
  brand: 'bg-brand-500',
};

export function Badge({ children, variant = 'default', size = 'md', dot = false }: BadgeProps) {
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 rounded-full font-medium',
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-0.5 text-xs',
        variantClasses[variant]
      )}
    >
      {dot && (
        <span className={clsx('h-1.5 w-1.5 rounded-full', dotClasses[variant])} />
      )}
      {children}
    </span>
  );
}
