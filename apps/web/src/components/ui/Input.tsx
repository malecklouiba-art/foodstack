import { forwardRef } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  onRightIconClick?: () => void;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, leftIcon, rightIcon, onRightIconClick, className, id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s/g, '-');

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-surface-700">
            {label}
            {props.required && <span className="ml-1 text-red-500">*</span>}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-surface-400">
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            className={twMerge(
              clsx(
                'h-10 w-full rounded-xl border bg-white px-3 text-sm text-surface-900',
                'placeholder:text-surface-400',
                'transition-all duration-200',
                'focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20',
                error
                  ? 'border-red-400 focus:border-red-500 focus:ring-red-500/20'
                  : 'border-surface-200',
                leftIcon && 'pl-10',
                rightIcon && 'pr-10',
                props.disabled && 'cursor-not-allowed bg-surface-50 text-surface-400',
                className
              )
            )}
            {...props}
          />
          {rightIcon && (
            <div
              className={clsx(
                'absolute right-3 top-1/2 -translate-y-1/2 text-surface-400',
                onRightIconClick && 'cursor-pointer hover:text-surface-600'
              )}
              onClick={onRightIconClick}
            >
              {rightIcon}
            </div>
          )}
        </div>
        {error && <p className="text-xs text-red-500">{error}</p>}
        {hint && !error && <p className="text-xs text-surface-400">{hint}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
