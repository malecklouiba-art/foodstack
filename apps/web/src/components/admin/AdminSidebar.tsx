'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { clsx } from 'clsx';
import {
  LayoutDashboard,
  Store,
  CreditCard,
  Activity,
  Settings,
  Shield,
  ChevronLeft,
} from 'lucide-react';

const navItems = [
  { href: '/admin', label: 'Vue globale', icon: LayoutDashboard, exact: true },
  { href: '/admin/restaurants', label: 'Restaurants', icon: Store },
  { href: '/admin/subscriptions', label: 'Abonnements', icon: CreditCard },
  { href: '/admin/monitoring', label: 'Monitoring', icon: Activity },
  { href: '/admin/settings', label: 'Configuration', icon: Settings },
];

export function AdminSidebar() {
  const pathname = usePathname();

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname.startsWith(href);

  return (
    <aside className="flex h-full w-60 flex-col border-r border-surface-200 bg-surface-900">
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 border-b border-surface-700 px-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand-500 shadow-brand">
          <Shield className="h-4 w-4 text-white" />
        </div>
        <div>
          <p className="text-sm font-bold text-white">Super Admin</p>
          <p className="text-xs text-surface-400">FoodStack Platform</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-0.5 p-3">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={clsx(
              'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
              isActive(item.href, item.exact)
                ? 'bg-brand-500/20 text-brand-400'
                : 'text-surface-400 hover:bg-surface-800 hover:text-white'
            )}
          >
            <item.icon className="h-4 w-4 flex-shrink-0" />
            {item.label}
          </Link>
        ))}
      </nav>

      {/* Back to restaurant */}
      <div className="border-t border-surface-700 p-3">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-surface-500 transition-colors hover:bg-surface-800 hover:text-white"
        >
          <ChevronLeft className="h-4 w-4" />
          Retour au dashboard
        </Link>
      </div>
    </aside>
  );
}
