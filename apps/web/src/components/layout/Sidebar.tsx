'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { clsx } from 'clsx';
import {
  LayoutDashboard,
  UtensilsCrossed,
  ShoppingBag,
  Truck,
  Users,
  UserCog,
  BarChart3,
  Settings,
  Store,
  Star,
  CreditCard,
  ChevronLeft,
  ChevronRight,
  Bike,
  MapPin,
  Monitor,
  ShoppingCart,
  LogOut,
  RefreshCw,
  ChevronUp,
  QrCode,
  Globe,
  Tag,
  TableIcon,
  CalendarDays,
} from 'lucide-react';
import { useState, useEffect } from 'react';

type Role = 'admin' | 'owner' | 'staff' | 'driver' | 'customer';

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  badge?: number;
  section?: string;
  roles: Role[];
}

// Role × page matrix from FoodStack spec
const navItems: NavItem[] = [
  { href: '/dashboard', label: 'Tableau de bord', icon: LayoutDashboard, section: 'Général', roles: ['admin', 'owner', 'staff'] },
  { href: '/dashboard', label: 'Mon espace', icon: Bike, section: 'Général', roles: ['driver'] },
  { href: '/dashboard/orders', label: 'Commandes', icon: ShoppingBag, badge: 5, section: 'Général', roles: ['admin', 'owner', 'staff'] },
  { href: '/dashboard/menu', label: 'Menu', icon: UtensilsCrossed, section: 'Gestion', roles: ['admin', 'owner', 'staff'] },
  { href: '/dashboard/delivery', label: 'Livraisons', icon: Truck, badge: 2, section: 'Gestion', roles: ['admin', 'owner', 'staff'] },
  { href: '/dashboard/drivers', label: 'Livreurs', icon: Bike, section: 'Gestion', roles: ['admin', 'owner'] },
  { href: '/dashboard/zones', label: 'Zones livraison', icon: MapPin, section: 'Gestion', roles: ['admin', 'owner'] },
  { href: '/dashboard/staff', label: 'Employés', icon: UserCog, section: 'Gestion', roles: ['admin', 'owner'] },
  { href: '/dashboard/planning', label: 'Planning', icon: CalendarDays, section: 'Gestion', roles: ['admin', 'owner', 'staff'] },
  { href: '/dashboard/coupons', label: 'Codes Promo', icon: Tag, section: 'Gestion', roles: ['admin', 'owner'] },
  { href: '/dashboard/tables', label: 'Tables', icon: TableIcon, section: 'Gestion', roles: ['admin', 'owner', 'staff'] },
  { href: '/dashboard/restaurants', label: 'Restaurants', icon: Store, section: 'Administration', roles: ['admin', 'owner'] },
  { href: '/dashboard/customers', label: 'Clients', icon: Users, section: 'Administration', roles: ['admin', 'owner'] },
  { href: '/dashboard/payments', label: 'Paiements', icon: CreditCard, section: 'Administration', roles: ['admin', 'owner'] },
  { href: '/pos', label: 'Caisse POS', icon: ShoppingCart, section: 'Gestion', roles: ['owner', 'staff'] },
  { href: '/dashboard/kiosk', label: 'Borne de commande', icon: Monitor, section: 'Gestion', roles: ['admin', 'owner'] },
  { href: '/dashboard/qrcodes', label: 'QR Codes', icon: QrCode, section: 'Gestion', roles: ['owner'] },
  { href: '/dashboard/analytics', label: 'Analytiques', icon: BarChart3, section: 'Rapports', roles: ['admin', 'owner'] },
  { href: '/dashboard/settings', label: 'Paramètres', icon: Settings, section: 'Rapports', roles: ['admin', 'owner'] },
  { href: '/dashboard/settings', label: 'Paramètres', icon: Settings, section: 'Général', roles: ['driver'] },
];

const DEMO_ACCOUNTS = [
  { role: 'admin',    label: 'Super Admin',      emoji: '👑', redirect: '/dashboard' },
  { role: 'owner',    label: 'Restaurateur', emoji: '🍽️', redirect: '/dashboard' },
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
  const [locale, setLocale] = useState('fr');

  useEffect(() => {
    setCurrentRole(readDemoCookie());
    const match = document.cookie.match(/(?:^|; )fs_locale=([^;]*)/);
    if (match) setLocale(match[1]);
  }, []);

  function toggleLocale() {
    const next = locale === 'fr' ? 'en' : 'fr';
    const expires = new Date(Date.now() + 365 * 86400 * 1000).toUTCString();
    document.cookie = `fs_locale=${next}; path=/; expires=${expires}; SameSite=Lax`;
    setLocale(next);
    router.refresh();
  }

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

  const isActive = (href: string) =>
    href === '/dashboard' || href === '/pos'
      ? pathname === href
      : pathname === href || pathname.startsWith(href + '/');

  const role = (currentRole ?? 'owner') as Role;
  const visibleItems = navItems.filter((i) => i.roles.includes(role));
  const sections = [...new Set(visibleItems.map((i) => i.section))];

  return (
    <aside
      className={clsx(
        'relative flex h-full flex-col bg-zinc-900 dark:bg-surface-900 dark:border-r dark:border-surface-700 transition-all duration-300',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Logo */}
      <div className={clsx('flex h-16 items-center border-b border-white/10 dark:border-surface-700 px-4', collapsed && 'justify-center')}>
        {collapsed ? (
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/20">
            <span className="text-sm font-bold text-white">F</span>
          </div>
        ) : (
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/20">
              <span className="text-sm font-bold text-white">F</span>
            </div>
            <span className="text-lg font-bold text-white">FoodStack</span>
          </Link>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto p-2 thin-scrollbar no-scrollbar">
        {sections.map((section) => (
          <div key={section} className="mb-4">
            {!collapsed && (
              <p className="mb-1 px-3 text-xs font-semibold uppercase tracking-wider text-white/50 dark:text-surface-500">
                {section}
              </p>
            )}
            <div className="space-y-0.5">
              {visibleItems
                .filter((i) => i.section === section)
                .map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={clsx(
                      'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
                      isActive(item.href)
                        ? 'bg-brand-500/20 text-brand-400 font-semibold dark:bg-brand-950 dark:text-brand-400'
                        : 'text-white/70 hover:bg-white/10 hover:text-white dark:text-surface-400 dark:hover:bg-surface-800 dark:hover:text-surface-100',
                      collapsed && 'justify-center px-2'
                    )}
                    title={collapsed ? item.label : undefined}
                  >
                    <item.icon
                      className="flex-shrink-0"
                      style={{ width: '18px', height: '18px' }}
                    />
                    {!collapsed && (
                      <>
                        <span className="flex-1">{item.label}</span>
                        {item.badge !== undefined && (
                          <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-white/20 dark:bg-surface-700 px-1.5 text-xs font-bold text-white dark:text-surface-100">
                            {item.badge}
                          </span>
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
      <div className="border-t border-white/10 dark:border-surface-700 p-3 space-y-1">
        {/* Theme + Locale toggles */}
        <div className={`flex items-center gap-1 ${collapsed ? 'flex-col' : ''}`}>
          <ThemeToggle className="flex-1 text-white/50 hover:bg-white/10 hover:text-white dark:text-surface-400 dark:hover:bg-surface-800 dark:hover:text-surface-100" />
          <button
            onClick={toggleLocale}
            className="flex flex-1 items-center gap-2 rounded-xl px-3 py-1.5 text-white/50 hover:bg-white/10 hover:text-white dark:text-surface-400 dark:hover:bg-surface-800 dark:hover:text-surface-100 transition-colors text-xs font-medium"
            title="Switch language"
          >
            <Globe className="h-3.5 w-3.5 flex-shrink-0" />
            {!collapsed && <span>{locale === 'fr' ? '🇫🇷 FR → EN' : '🇬🇧 EN → FR'}</span>}
          </button>
        </div>
        {/* Account switcher dropdown */}
        {showSwitcher && !collapsed && (
          <div className="mb-2 rounded-xl border border-white/10 dark:border-surface-700 bg-white/10 dark:bg-surface-800 p-1.5 space-y-0.5">
            {DEMO_ACCOUNTS.filter(a => a.role !== currentRole).map((account) => (
              <button
                key={account.role}
                onClick={() => handleSwitch(account)}
                className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-white/80 dark:text-surface-200 hover:bg-white/10 dark:hover:bg-surface-700 transition-all"
              >
                <span className="text-base">{account.emoji}</span>
                <span className="font-medium">{account.label}</span>
                <RefreshCw className="ml-auto h-3 w-3 text-white/40 dark:text-surface-500" />
              </button>
            ))}
          </div>
        )}

        {/* Current user row */}
        {!collapsed ? (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSwitcher(s => !s)}
              className="flex flex-1 items-center gap-2.5 rounded-xl p-2 hover:bg-white/10 dark:hover:bg-surface-800 transition-colors min-w-0"
            >
              <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-white/20 dark:bg-surface-700 text-xs font-bold text-white dark:text-surface-100">
                {(ROLE_NAMES[currentRole ?? '']?.label ?? 'U')[0]}
              </div>
              <div className="flex-1 min-w-0 text-left">
                <p className="truncate text-sm font-medium text-white dark:text-surface-100">
                  {ROLE_NAMES[currentRole ?? '']?.emoji} {ROLE_NAMES[currentRole ?? '']?.label ?? 'Démo'}
                </p>
                <p className="truncate text-xs text-white/50 dark:text-surface-500">{currentRole ?? 'demo'}</p>
              </div>
              <ChevronUp className={clsx('h-3.5 w-3.5 flex-shrink-0 text-white/40 dark:text-surface-500 transition-transform', !showSwitcher && 'rotate-180')} />
            </button>
            <button
              onClick={handleLogout}
              title="Se déconnecter"
              className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl text-white/50 hover:bg-white/20 hover:text-white dark:text-surface-400 dark:hover:bg-surface-700 dark:hover:text-surface-100 transition-colors"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={handleLogout}
            title="Se déconnecter"
            className="flex w-full items-center justify-center rounded-xl py-2 text-white/50 hover:bg-white/20 hover:text-white dark:text-surface-400 dark:hover:bg-surface-700 dark:hover:text-surface-100 transition-colors"
          >
            <LogOut className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-20 flex h-6 w-6 items-center justify-center rounded-full border border-white/20 dark:border-surface-600 bg-zinc-900 dark:bg-surface-900 shadow-sm hover:bg-zinc-800 dark:hover:bg-surface-800"
      >
        {collapsed ? (
          <ChevronRight className="h-3 w-3 text-white/60 dark:text-surface-400" />
        ) : (
          <ChevronLeft className="h-3 w-3 text-white/60 dark:text-surface-400" />
        )}
      </button>
    </aside>
  );
}
