'use client';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';
import { clsx } from 'clsx';

interface ThemeToggleProps {
  className?: string;
}

export function ThemeToggle({ className }: ThemeToggleProps) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch — only render after client mount
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div
        className={clsx(
          'flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl',
          className
        )}
      />
    );
  }

  const isDark = theme === 'dark';

  return (
    <button
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      title={isDark ? 'Passer en mode clair' : 'Passer en mode sombre'}
      className={clsx(
        'flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl transition-colors',
        className
      )}
    >
      {/* Show Sun in dark mode (click to go light), Moon in light mode (click to go dark) */}
      {isDark ? (
        <Sun className="h-4 w-4" />
      ) : (
        <Moon className="h-4 w-4" />
      )}
    </button>
  );
}
