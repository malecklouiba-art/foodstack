'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ShoppingBag, Award, User, UtensilsCrossed, Bell } from 'lucide-react';
import { clsx } from 'clsx';

const NAV = [
  { href: '/menu',          label: 'Menu',       icon: UtensilsCrossed },
  { href: '/orders',        label: 'Commandes',  icon: ShoppingBag     },
  { href: '/loyalty',       label: 'Fidélité',   icon: Award           },
  { href: '/notifications', label: 'Alertes',    icon: Bell            },
  { href: '/profile',       label: 'Profil',     icon: User            },
];

export default function CustomerLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + '/');

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <main className="flex-1 pb-20">{children}</main>

      {/* Bottom navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-200 bg-white">
        <div className="mx-auto flex max-w-2xl items-center justify-around px-2 py-2">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = isActive(href);
            return (
              <Link
                key={href}
                href={href}
                className={clsx(
                  'flex flex-col items-center gap-0.5 rounded-xl px-3 py-1.5 text-xs font-medium transition-colors',
                  active
                    ? 'text-brand-500'
                    : 'text-gray-400 hover:text-gray-600'
                )}
              >
                <Icon
                  className={clsx(
                    'h-5 w-5',
                    active ? 'text-brand-500' : 'text-gray-400'
                  )}
                  strokeWidth={active ? 2.5 : 1.8}
                />
                <span>{label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
