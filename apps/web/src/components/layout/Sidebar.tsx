'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { clsx } from 'clsx';
import {
  LayoutDashboard,
  UtensilsCrossed,
  ShoppingBag,
  Package,
  Truck,
  Users,
  BarChart3,
  Settings,
  Store,
  Star,
  CreditCard,
  ChevronLeft,
  ChevronRight,
  Bike,
  Monitor,
  ShoppingCart,
  LogOut,
  RefreshCw,
  ChevronUp,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  badge?: number;
  section?: string;
}

const navItems: NavItem[] = [
  { href: '/dashboard', label: 'Tableau de bord', icon: LayoutDashboard, section: 'Général' },
  { href: '/dashboard/orders', label: 'Commandes', icon: ShoppingBag, badge: 5, section: 'Général' },
  { href: '/dashboard/menu', label: 'Menu', icon: UtensilsCrossed, section: 'Gestion' },
  { href: '/dashboard/inventory', label: 'Inventaire', icon: Package, section: 'Gestion' },
  { href: '/dashboard/delivery', label: 'Livraisons', icon: Truck, badge: 2, section: 'Gestion' },
  { href: '/dashboard/drivers', label: 'Livreurs', icon: Bike, section: 'Gestion' },
  { href: '/dashboard/restaurants', label: 'Restaurants', icon: Store, section: 'Administration' },
  { href: '/dashboard/customers', label: 'Clients', icon: Users, section: 'Administration' },
  { href: '/dashboard/loyalty', label: 'Fidélité', icon: Star, section: 'Administration' },
  { href: '/dashboard/payments', label: 'Paiements', icon: CreditCard, section: 'Administration' },
  { href: '/pos', label: 'Caisse POS', icon: ShoppingCart, section: 'Gestion' },
  { href: '/dashboard/kiosk', label: 'Borne de commande', icon: Monitor, section: 'Gestion' },
  { href: '/dashboard/analytics', label: 'Analytiques', icon: BarChart3, section: 'Rapports' },
  { href: '/dashboard/settings', label: 'Paramètres', icon: Settings, section: 'Rapports' },
];

const DEMO_ACCOUNTS = [
  { role: 'admin',    label: 'Super Admin',      emoji: '👑', redirect: '/dashboard' },
  { role: 'owner',    label: 'Restaurant Owner', emoji: '🍽️', redirect: '/dashboard' },
  { role: 'staff',    label: 'Staff',            emoji: '👷', redirect: '/dashboard' },
  { role: 'driver',   label: 'Livreur',          emoji: '🛵', redirect: '/dashboard' },
  { role: 'customer', label: 'Client',           emoji: '🛒', redirect: '/menu' },
];

const ROLE_NAMES: Record<string, { label: string; emoji: string }> = Object.fromEntries(
  DEMO_ACCOUNTS.map(a => [a.role, { label: a.label, emoji: a.emoji }])
);

function readDemoCookie(): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(/(?:^|; )fs_demo=([^;]*)/);
  return match ? decodeURIComponent(match[1]) : null;
}

function setDemoCookie(role: string) {
  const expires = new Date(Date.now() + 86400 * 1000).toUTCString();
  document.cookie = `fs_demo=${role}; path=/; expires=${expires}; SameSite=Lax`;
}

function clearDemoCookie() {
  document.cookie = 'fs_demo=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
}

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [currentRole, setCurrentRole] = useState<string | null>(null);
  const [showSwitcher, setShowSwitcher] = useState(false);

  useEffect(() => {
    setCurrentRole(readDemoCookie());
  }, []);

  function handleLogout() {
    clearDemoCookie();
    router.push('/login');
  }

  function handleSwitch(account: typeof DEMO_ACCOUNTS[number]) {
    setDemoCookie(account.role);
    setCurrentRole(account.role);
    setShowSwitcher(false);
    router.push(account.redirect);
    router.refresh();
  }

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/');

  const sections = [...new Set(navItems.map((i) => i.section))];

  return (
    <aside
      className={clsx(
        'relative flex h-full flex-col border-r border-surface-200 bg-white transition-all duration-300',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Logo */}
      <div className={clsx('flex h-16 items-center border-b border-surface-200 px-4', collapsed && 'justify-center')}>
        {collapsed ? (
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-brand shadow-brand">
            <span className="text-sm font-bold text-white">F</span>
          </div>
        ) : (
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-brand shadow-brand">
              <span className="text-sm font-bold text-white">F</span>
            </div>
            <span className="text-lg font-bold text-surface-900">FoodStack</span>
          </Link>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto p-2 thin-scrollbar">
        {sections.map((section) => (
          <div key={section} className="mb-4">
            {!collapsed && (
              <p className="mb-1 px-3 text-xs font-semibold uppercase tracking-wider text-surface-400">
                {section}
              </p>
            )}
            <div className="space-y-0.5">
              {navItems
                .filter((i) => i.section === section)
                .map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={clsx(
                      'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
                      isActive(item.href)
                        ? 'bg-brand-50 text-brand-700'
                        : 'text-surface-600 hover:bg-surface-100 hover:text-surface-900',
                      collapsed && 'justify-center px-2'
                    )}
                    title={collapsed ? item.label : undefined}
                  >
                    <item.icon
                      className={clsx(
                        'h-4.5 w-4.5 flex-shrink-0',
                        isActive(item.href) ? 'text-brand-600' : 'text-surface-400'
                      )}
                      style={{ width: '18px', height: '18px' }}
                    />
                    {!collapsed && (
                      <>
                        <span className="flex-1">{item.label}</span>
                        {item.badge !== undefined && (
                          <Badge variant="brand" size="sm">
                            {item.badge}
                          </Badge>
                        )}
                      </>
                    )}
                  </Link>
                ))}
            </div>
          </div>
        ))}
      </nav>

      {/* User section */}
      <div className="border-t border-surface-200 p-3 space-y-1">
        {/* Account switcher dropdown */}
        {showSwitcher && !collapsed && (
          <div className="mb-2 rounded-xl border border-surface-200 bg-surface-50 p-1.5 space-y-0.5">
            {DEMO_ACCOUNTS.filter(a => a.role !== currentRole).map((account) => (
              <button
                key={account.role}
                onClick={() => handleSwitch(account)}
                className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-surface-700 hover:bg-white hover:shadow-sm transition-all"
              >
                <span className="text-base">{account.emoji}</span>
                <span className="font-medium">{account.label}</span>
                <RefreshCw className="ml-auto h-3 w-3 text-surface-400" />
              </button>
            ))}
          </div>
        )}

        {/* Current user row */}
        {!collapsed ? (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSwitcher(s => !s)}
              className="flex flex-1 items-center gap-2.5 rounded-xl p-2 hover:bg-surface-100 transition-colors min-w-0"
            >
              <Avatar name={ROLE_NAMES[currentRole ?? '']?.label ?? 'User'} size="sm" />
              <div className="flex-1 min-w-0 text-left">
                <p className="truncate text-sm font-medium text-surface-900">
                  {ROLE_NAMES[currentRole ?? '']?.emoji} {ROLE_NAMES[currentRole ?? '']?.label ?? 'Démo'}
                </p>
                <p className="truncate text-xs text-surface-400">{currentRole ?? 'demo'}</p>
              </div>
              <ChevronUp className={clsx('h-3.5 w-3.5 flex-shrink-0 text-surface-400 transition-transform', !showSwitcher && 'rotate-180')} />
            </button>
            <button
              onClick={handleLogout}
              title="Se déconnecter"
              className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl text-surface-400 hover:bg-red-50 hover:text-red-500 transition-colors"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={handleLogout}
            title="Se déconnecter"
            className="flex w-full items-center justify-center rounded-xl py-2 text-surface-400 hover:bg-red-50 hover:text-red-500 transition-colors"
          >
            <LogOut className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-20 flex h-6 w-6 items-center justify-center rounded-full border border-surface-200 bg-white shadow-sm hover:bg-surface-50"
      >
        {collapsed ? (
          <ChevronRight className="h-3 w-3 text-surface-400" />
        ) : (
          <ChevronLeft className="h-3 w-3 text-surface-400" />
        )}
      </button>
    </aside>
  );
}
