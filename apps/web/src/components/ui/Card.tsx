import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  glass?: boolean;
  hover?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  onClick?: () => void;
}

const paddingClasses = {
  none: '',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
};

export function Card({
  children,
  className,
  glass = false,
  hover = false,
  padding = 'md',
  onClick,
}: CardProps) {
  return (
    <div
      onClick={onClick}
      className={twMerge(
        clsx(
          'rounded-2xl border',
          glass
            ? 'border-white/20 bg-white/80 dark:bg-surface-900/80 shadow-glass backdrop-blur-xl'
            : 'border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 shadow-sm',
          hover && 'cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md',
          paddingClasses[padding],
          onClick && 'cursor-pointer',
          className
        )
      )}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={twMerge('mb-4 flex items-center justify-between', className)}>{children}</div>
  );
}

export function CardTitle({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <h3 className={twMerge('text-lg font-semibold text-surface-900 dark:text-surface-50', className)}>{children}</h3>
  );
}

export function CardDescription({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <p className={twMerge('text-sm text-surface-500 dark:text-surface-400', className)}>{children}</p>
  );
}
