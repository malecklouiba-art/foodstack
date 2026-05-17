'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Globe } from 'lucide-react';

const LOCALES = [
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
  { code: 'en', label: 'English',  flag: '🇬🇧' },
] as const;

interface Props {
  currentLocale?: string;
  variant?: 'icon' | 'full';
  className?: string;
}

export function LanguageSwitcher({ currentLocale = 'fr', variant = 'full', className = '' }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function switchLocale(locale: string) {
    const expires = new Date(Date.now() + 365 * 86400 * 1000).toUTCString();
    document.cookie = `fs_locale=${locale}; path=/; expires=${expires}; SameSite=Lax`;
    startTransition(() => {
      router.refresh();
    });
  }

  const next = LOCALES.find(l => l.code !== currentLocale) ?? LOCALES[0];

  if (variant === 'icon') {
    return (
      <button
        onClick={() => switchLocale(next.code)}
        disabled={isPending}
        title={`Switch to ${next.label}`}
        className={`flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm font-medium transition-colors hover:bg-white/10 dark:text-surface-100 dark:hover:bg-surface-800 disabled:opacity-50 ${className}`}
      >
        <Globe className="h-4 w-4" />
        <span className="text-xs">{next.flag}</span>
      </button>
    );
  }

  return (
    <div className={`flex items-center gap-1 rounded-xl border border-gray-200 dark:border-surface-600 bg-white dark:bg-surface-800 p-1 ${className}`}>
      {LOCALES.map(locale => (
        <button
          key={locale.code}
          onClick={() => switchLocale(locale.code)}
          disabled={isPending}
          className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-all disabled:opacity-50 ${
            currentLocale === locale.code
              ? 'bg-gray-900 dark:bg-surface-600 text-white shadow-sm'
              : 'text-gray-600 dark:text-surface-300 hover:bg-gray-100 dark:hover:bg-surface-700'
          }`}
        >
          <span>{locale.flag}</span>
          <span>{locale.code.toUpperCase()}</span>
        </button>
      ))}
    </div>
  );
}
