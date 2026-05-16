'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search, LayoutDashboard, ShoppingBag, UtensilsCrossed, Truck,
  Users, UserCog, BarChart3, Settings, Store, Star, CreditCard,
  Bike, MapPin, Monitor, ShoppingCart, QrCode, Tag, TableIcon,
  Package, Boxes, ArrowRight, Command,
} from 'lucide-react';
import { clsx } from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';

interface CommandItem {
  id: string;
  label: string;
  description?: string;
  icon: React.ElementType;
  href: string;
  keywords?: string[];
  section: string;
}

const COMMANDS: CommandItem[] = [
  { id: 'dashboard',    label: 'Tableau de bord',   icon: LayoutDashboard, href: '/dashboard',             section: 'Navigation', keywords: ['accueil', 'overview', 'home'] },
  { id: 'orders',       label: 'Commandes',          icon: ShoppingBag,     href: '/dashboard/orders',      section: 'Navigation', keywords: ['order', 'commande'] },
  { id: 'menu',         label: 'Menu',               icon: UtensilsCrossed, href: '/dashboard/menu',        section: 'Navigation', keywords: ['food', 'plat', 'article', 'carte'] },
  { id: 'delivery',     label: 'Livraisons',         icon: Truck,           href: '/dashboard/delivery',    section: 'Navigation', keywords: ['livraison', 'delivery'] },
  { id: 'drivers',      label: 'Livreurs',           icon: Bike,            href: '/dashboard/drivers',     section: 'Navigation', keywords: ['driver', 'livreur'] },
  { id: 'zones',        label: 'Zones livraison',    icon: MapPin,          href: '/dashboard/zones',       section: 'Navigation', keywords: ['zone', 'map'] },
  { id: 'inventory',    label: 'Inventaire',         icon: Boxes,           href: '/dashboard/inventory',   section: 'Navigation', keywords: ['stock', 'inventaire'] },
  { id: 'suppliers',    label: 'Fournisseurs',       icon: Package,         href: '/dashboard/suppliers',   section: 'Navigation', keywords: ['fournisseur', 'supplier'] },
  { id: 'staff',        label: 'Employés',           icon: UserCog,         href: '/dashboard/staff',       section: 'Navigation', keywords: ['employe', 'staff', 'team'] },
  { id: 'coupons',      label: 'Codes Promo',        icon: Tag,             href: '/dashboard/coupons',     section: 'Navigation', keywords: ['coupon', 'promo', 'code', 'remise'] },
  { id: 'tables',       label: 'Tables',             icon: TableIcon,       href: '/dashboard/tables',      section: 'Navigation', keywords: ['table', 'salle'] },
  { id: 'restaurants',  label: 'Restaurants',        icon: Store,           href: '/dashboard/restaurants', section: 'Navigation', keywords: ['restaurant'] },
  { id: 'customers',    label: 'Clients',            icon: Users,           href: '/dashboard/customers',   section: 'Navigation', keywords: ['client', 'customer'] },
  { id: 'loyalty',      label: 'Fidélité',           icon: Star,            href: '/dashboard/loyalty',     section: 'Navigation', keywords: ['fidelite', 'points', 'loyalty'] },
  { id: 'payments',     label: 'Paiements',          icon: CreditCard,      href: '/dashboard/payments',    section: 'Navigation', keywords: ['paiement', 'payment', 'stripe'] },
  { id: 'kiosk',        label: 'Borne de commande',  icon: Monitor,         href: '/dashboard/kiosk',       section: 'Navigation', keywords: ['kiosk', 'borne'] },
  { id: 'qrcodes',      label: 'QR Codes',           icon: QrCode,          href: '/dashboard/qrcodes',     section: 'Navigation', keywords: ['qr', 'qrcode'] },
  { id: 'analytics',    label: 'Analytiques',        icon: BarChart3,       href: '/dashboard/analytics',   section: 'Navigation', keywords: ['stats', 'rapport', 'analytics', 'graphique'] },
  { id: 'settings',     label: 'Paramètres',         icon: Settings,        href: '/dashboard/settings',    section: 'Navigation', keywords: ['settings', 'config', 'parametres'] },
  { id: 'pos',          label: 'Caisse POS',         icon: ShoppingCart,    href: '/pos',                   section: 'Navigation', keywords: ['pos', 'caisse', 'encaissement'] },
  // Customer area
  { id: 'menu-public',  label: 'Menu public',        icon: UtensilsCrossed, href: '/menu',                  section: 'Espace client', keywords: ['menu public'] },
  { id: 'orders-pub',   label: 'Mes commandes',      icon: ShoppingBag,     href: '/orders',                section: 'Espace client', keywords: [] },
  { id: 'profile',      label: 'Mon profil',         icon: Users,           href: '/profile',               section: 'Espace client', keywords: [] },
];

function normalize(str: string) {
  return str.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
}

function matches(item: CommandItem, query: string): boolean {
  if (!query) return true;
  const q = normalize(query);
  const haystack = normalize([item.label, item.description ?? '', ...(item.keywords ?? [])].join(' '));
  return haystack.includes(q);
}

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeIdx, setActiveIdx] = useState(0);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const filtered = COMMANDS.filter((c) => matches(c, query));

  const close = useCallback(() => {
    setOpen(false);
    setQuery('');
    setActiveIdx(0);
  }, []);

  const navigate = useCallback((href: string) => {
    router.push(href);
    close();
  }, [router, close]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen((v) => !v);
      }
      if (e.key === 'Escape') close();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [close]);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  useEffect(() => {
    setActiveIdx(0);
  }, [query]);

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIdx((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && filtered[activeIdx]) {
      navigate(filtered[activeIdx].href);
    }
  }

  // Group by section
  const sections = [...new Set(filtered.map((c) => c.section))];

  return (
    <>
      {/* Trigger hint in header (invisible — keyboard only) */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] px-4"
            onClick={close}
          >
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />

            {/* Panel */}
            <motion.div
              initial={{ opacity: 0, scale: 0.97, y: -8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97, y: -8 }}
              transition={{ duration: 0.12 }}
              onClick={(e) => e.stopPropagation()}
              className="relative z-10 w-full max-w-xl overflow-hidden rounded-2xl border border-surface-200 bg-white shadow-2xl dark:border-surface-700 dark:bg-surface-800"
            >
              {/* Search input */}
              <div className="flex items-center gap-3 border-b border-surface-100 px-4 py-3 dark:border-surface-700">
                <Search className="h-4 w-4 shrink-0 text-surface-400" />
                <input
                  ref={inputRef}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={onKeyDown}
                  placeholder="Rechercher une page, une action…"
                  className="flex-1 bg-transparent text-sm text-surface-900 outline-none placeholder:text-surface-400 dark:text-surface-100"
                />
                <kbd className="hidden rounded-lg border border-surface-200 bg-surface-50 px-1.5 py-0.5 text-[10px] font-medium text-surface-400 dark:border-surface-600 dark:bg-surface-700 sm:block">
                  ESC
                </kbd>
              </div>

              {/* Results */}
              <div ref={listRef} className="max-h-80 overflow-y-auto p-2 dark:[color-scheme:dark]">
                {filtered.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 text-surface-400">
                    <Search className="mb-2 h-6 w-6" />
                    <p className="text-sm">Aucun résultat pour «{query}»</p>
                  </div>
                ) : (
                  sections.map((section) => {
                    const items = filtered.filter((c) => c.section === section);
                    return (
                      <div key={section} className="mb-2">
                        <p className="mb-1 px-2 text-[10px] font-semibold uppercase tracking-wider text-surface-400 dark:text-surface-500">
                          {section}
                        </p>
                        {items.map((item) => {
                          const idx = filtered.indexOf(item);
                          const Icon = item.icon;
                          const isActive = idx === activeIdx;
                          return (
                            <button
                              key={item.id}
                              onMouseEnter={() => setActiveIdx(idx)}
                              onClick={() => navigate(item.href)}
                              className={clsx(
                                'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors',
                                isActive ? 'bg-brand-50 dark:bg-brand-500/10' : 'hover:bg-surface-50 dark:hover:bg-surface-700'
                              )}
                            >
                              <div className={clsx(
                                'flex h-7 w-7 items-center justify-center rounded-lg shrink-0',
                                isActive ? 'bg-brand-500/20' : 'bg-surface-100 dark:bg-surface-700'
                              )}>
                                <Icon className={clsx('h-3.5 w-3.5', isActive ? 'text-brand-600' : 'text-surface-500 dark:text-surface-400')} />
                              </div>
                              <span className={clsx('flex-1 text-sm font-medium', isActive ? 'text-brand-700 dark:text-brand-400' : 'text-surface-700 dark:text-surface-200')}>
                                {item.label}
                              </span>
                              {isActive && <ArrowRight className="h-3.5 w-3.5 text-brand-400" />}
                            </button>
                          );
                        })}
                      </div>
                    );
                  })
                )}
              </div>

              {/* Footer */}
              <div className="flex items-center gap-4 border-t border-surface-100 px-4 py-2.5 text-[10px] text-surface-400 dark:border-surface-700">
                <span className="flex items-center gap-1"><kbd className="rounded border border-surface-200 bg-surface-50 px-1 py-0.5 font-mono dark:border-surface-600 dark:bg-surface-700">↑↓</kbd> naviguer</span>
                <span className="flex items-center gap-1"><kbd className="rounded border border-surface-200 bg-surface-50 px-1 py-0.5 font-mono dark:border-surface-600 dark:bg-surface-700">↵</kbd> ouvrir</span>
                <span className="flex items-center gap-1"><kbd className="rounded border border-surface-200 bg-surface-50 px-1 py-0.5 font-mono dark:border-surface-600 dark:bg-surface-700">ESC</kbd> fermer</span>
                <span className="ml-auto flex items-center gap-1"><Command className="h-3 w-3" />K pour ouvrir</span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
