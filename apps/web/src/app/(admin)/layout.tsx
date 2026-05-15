'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { clsx } from 'clsx';
import {
  LayoutDashboard,
  Store,
  CreditCard,
  Activity,
  Settings,
  LogOut,
  ShieldCheck,
  ScrollText,
} from 'lucide-react';

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
}

const navItems: NavItem[] = [
  { href: '/admin',               label: 'Vue globale',    icon: LayoutDashboard },
  { href: '/admin/restaurants',   label: 'Restaurants',    icon: Store           },
  { href: '/admin/subscriptions', label: 'Abonnements',    icon: CreditCard      },
  { href: '/admin/monitoring',    label: 'Monitoring',     icon: Activity        },
  { href: '/admin/audit-logs',    label: 'Audit logs',     icon: ScrollText      },
  { href: '/admin/config',        label: 'Configuration',  icon: Settings        },
];

function AdminSidebar() {
  const pathname = usePathname();
  const router   = useRouter();

  const isActive = (href: string) =>
    href === '/admin'
      ? pathname === '/admin'
      : pathname === href || pathname.startsWith(href + '/');

  function handleLogout() {
    router.push('/login');
  }

  return (
    <aside className="relative flex h-full w-64 flex-shrink-0 flex-col bg-brand-500">
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 border-b border-black/10 px-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-black/20">
          <ShieldCheck className="h-4 w-4 text-black" />
        </div>
        <span className="text-lg font-bold text-black">FS Admin</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-0.5">
        <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-black/50">
          Super Admin
        </p>
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={clsx(
              'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
              isActive(item.href)
                ? 'bg-black/15 text-black font-semibold'
                : 'text-black/70 hover:bg-black/10 hover:text-black'
            )}
          >
            <item.icon className="h-[18px] w-[18px] flex-shrink-0" />
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>

      {/* User section */}
      <div className="border-t border-black/10 p-3">
        <div className="flex items-center gap-2">
          <div className="flex flex-1 items-center gap-2.5 rounded-xl p-2">
            <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-black/20 text-xs font-bold text-black">
              S
            </div>
            <div className="flex-1 min-w-0">
              <p className="truncate text-sm font-medium text-black">Super Admin</p>
              <p className="truncate text-xs text-black/50">admin@foodstack.io</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            title="Se déconnecter"
            className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl text-black/50 hover:bg-black/20 hover:text-black transition-colors"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="dark flex h-screen overflow-hidden bg-[#0A0A0A]">
      <AdminSidebar />
      <main className="flex-1 overflow-y-auto bg-[#0A0A0A]">
        {children}
      </main>
    </div>
  );
}
