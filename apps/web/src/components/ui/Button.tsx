'use client';

import { forwardRef } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Loader2 } from 'lucide-react';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'glass';
type ButtonSize = 'sm' | 'md' | 'lg' | 'xl';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: [
    'bg-brand-500 text-white shadow-brand',
    'hover:bg-brand-600 hover:shadow-brand-lg',
    'active:bg-brand-700',
    'disabled:bg-brand-300 disabled:shadow-none',
  ].join(' '),
  secondary: [
    'bg-surface-900 text-white',
    'hover:bg-surface-800',
    'active:bg-surface-700',
    'disabled:bg-surface-400',
    'dark:bg-surface-700 dark:hover:bg-surface-600',
  ].join(' '),
  ghost: [
    'bg-transparent text-surface-700 border border-surface-200',
    'hover:bg-surface-100 hover:text-surface-900',
    'active:bg-surface-200',
    'disabled:text-surface-400',
    'dark:text-surface-300 dark:border-surface-700',
    'dark:hover:bg-surface-800 dark:hover:text-surface-100',
    'dark:active:bg-surface-700',
  ].join(' '),
  danger: [
    'bg-red-500 text-white',
    'hover:bg-red-600',
    'active:bg-red-700',
    'disabled:bg-red-300',
  ].join(' '),
  glass: [
    'bg-white/20 text-white border border-white/30 backdrop-blur-md',
    'hover:bg-white/30',
    'active:bg-white/40',
    'disabled:opacity-50',
  ].join(' '),
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-xs gap-1.5 rounded-lg',
  md: 'h-10 px-4 text-sm gap-2 rounded-xl',
  lg: 'h-12 px-6 text-base gap-2.5 rounded-xl',
  xl: 'h-14 px-8 text-lg gap-3 rounded-2xl',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      loading = false,
      icon,
      iconPosition = 'left',
      fullWidth = false,
      children,
      className,
      disabled,
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || loading;

    return (
      <button
        ref={ref}
        disabled={isDisabled}
        className={twMerge(
          clsx(
            'inline-flex items-center justify-center font-medium transition-all duration-200',
            'focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2',
            'select-none whitespace-nowrap',
            variantClasses[variant],
            sizeClasses[size],
            fullWidth && 'w-full',
            isDisabled && 'cursor-not-allowed opacity-60',
            className
          )
        )}
        {...props}
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          icon && iconPosition === 'left' && icon
        )}
        {children}
        {!loading && icon && iconPosition === 'right' && icon}
      </button>
    );
  }
);

Button.displayName = 'Button';
