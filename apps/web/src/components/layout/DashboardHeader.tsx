'use client';

import { useState, useRef, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import {
  Bell, Search, X, CheckCircle2, AlertTriangle,
  ShoppingBag, Package, Users, Info, Check,
} from 'lucide-react';
import { clsx } from 'clsx';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
type _Unused = typeof ShoppingBag; // icons used via ICON_MAP lookup

type NotifType = 'order' | 'stock' | 'user' | 'system' | 'success';

interface Notification {
  id: string;
  type: NotifType;
  title: string;
  body: string;
  ts: Date;
  read: boolean;
}

const ICON_MAP: Record<NotifType, { icon: React.ElementType; bg: string; color: string }> = {
  order:   { icon: ShoppingBag,    bg: 'bg-brand-50',  color: 'text-brand-600'  },
  stock:   { icon: AlertTriangle,  bg: 'bg-amber-50',  color: 'text-amber-600'  },
  user:    { icon: Users,          bg: 'bg-blue-50',   color: 'text-blue-600'   },
  system:  { icon: Info,           bg: 'bg-purple-50', color: 'text-purple-600' },
  success: { icon: CheckCircle2,   bg: 'bg-green-50',  color: 'text-green-600'  },
};

const INITIAL_NOTIFS: Notification[] = [
  { id: 'n1', type: 'order',   title: 'Nouvelle commande',        body: 'ORD-8830 — Marie L. — 42,50 €', ts: new Date(Date.now() - 2 * 60000),  read: false },
  { id: 'n2', type: 'stock',   title: 'Stock critique',           body: 'Tomates cerises < 10% du seuil', ts: new Date(Date.now() - 8 * 60000),  read: false },
  { id: 'n3', type: 'order',   title: 'Commande livrée',          body: 'ORD-8825 confirmée par le client', ts: new Date(Date.now() - 15 * 60000), read: false },
  { id: 'n4', type: 'user',    title: 'Nouvel employé',           body: 'Camille T. a rejoint l\'équipe',   ts: new Date(Date.now() - 60 * 60000), read: true  },
  { id: 'n5', type: 'system',  title: 'Mise à jour disponible',   body: 'FoodStack v2.1.0 prête à déployer', ts: new Date(Date.now() - 3 * 3600000), read: true },
  { id: 'n6', type: 'success', title: 'Export terminé',           body: 'Rapport mensuel CSV généré',     ts: new Date(Date.now() - 5 * 3600000), read: true  },
  { id: 'n7', type: 'stock',   title: 'Réapprovisionnement reçu', body: 'Fournisseur Fraichia — 24 articles', ts: new Date(Date.now() - 8 * 3600000), read: true },
];

const PAGE_LABELS: Record<string, string> = {
  '/dashboard':             'Tableau de bord',
  '/dashboard/orders':      'Commandes',
  '/dashboard/menu':        'Menu',
  '/dashboard/delivery':    'Livraisons',
  '/dashboard/drivers':     'Livreurs',
  '/dashboard/zones':       'Zones livraison',
  '/dashboard/inventory':   'Inventaire',
  '/dashboard/suppliers':   'Fournisseurs',
  '/dashboard/staff':       'Employés',
  '/dashboard/coupons':     'Codes Promo',
  '/dashboard/tables':      'Tables',
  '/dashboard/restaurants': 'Restaurants',
  '/dashboard/customers':   'Clients',
  '/dashboard/loyalty':     'Fidélité',
  '/dashboard/payments':    'Paiements',
  '/dashboard/kiosk':       'Borne de commande',
  '/dashboard/qrcodes':     'QR Codes',
  '/dashboard/analytics':   'Analytiques',
  '/dashboard/settings':    'Paramètres',
};

function relativeTime(date: Date): string {
  const diff = Math.floor((Date.now() - date.getTime()) / 1000);
  if (diff < 60)  return 'À l\'instant';
  if (diff < 3600) return `Il y a ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `Il y a ${Math.floor(diff / 3600)} h`;
  return `Il y a ${Math.floor(diff / 86400)} j`;
}

export function DashboardHeader() {
  const pathname = usePathname();
  const [notifs, setNotifs] = useState<Notification[]>(INITIAL_NOTIFS);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const unread = notifs.filter((n) => !n.read).length;
  const pageLabel = PAGE_LABELS[pathname] ?? 'Dashboard';

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  function markAllRead() {
    setNotifs((prev) => prev.map((n) => ({ ...n, read: true })));
  }

  function markRead(id: string) {
    setNotifs((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n));
  }

  function dismiss(id: string) {
    setNotifs((prev) => prev.filter((n) => n.id !== id));
  }

  return (
    <header className="flex h-14 items-center justify-between border-b border-surface-100 bg-white px-6 shrink-0 dark:border-surface-700 dark:bg-surface-800">
      {/* Page title */}
      <h2 className="text-sm font-semibold text-surface-700 dark:text-surface-200">{pageLabel}</h2>

      <div className="flex items-center gap-3">
        {/* Search — triggers command palette */}
        <button
          onClick={() => {
            const ev = new KeyboardEvent('keydown', { key: 'k', metaKey: true, bubbles: true });
            window.dispatchEvent(ev);
          }}
          className="flex items-center gap-2 rounded-xl border border-surface-200 bg-surface-50 px-3 py-1.5 w-44 text-left hover:border-brand-300 hover:bg-white transition-all dark:border-surface-600 dark:bg-surface-700 dark:hover:bg-surface-600"
        >
          <Search className="h-3.5 w-3.5 text-surface-400 shrink-0" />
          <span className="flex-1 text-xs text-surface-400">Rechercher…</span>
          <kbd className="rounded border border-surface-200 bg-white px-1 py-0.5 text-[9px] font-medium text-surface-400 leading-none">
            ⌘K
          </kbd>
        </button>

        {/* Notification bell */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setOpen((v) => !v)}
            className="relative flex h-8 w-8 items-center justify-center rounded-xl text-surface-500 hover:bg-surface-100 transition-colors"
          >
            <Bell className="h-4 w-4" />
            {unread > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white leading-none">
                {unread > 9 ? '9+' : unread}
              </span>
            )}
          </button>

          {open && (
            <div className="absolute right-0 top-10 z-50 w-80 rounded-2xl border border-surface-100 bg-white shadow-xl dark:border-surface-700 dark:bg-surface-800">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-surface-100 px-4 py-3 dark:border-surface-700">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-surface-900 dark:text-white">Notifications</span>
                  {unread > 0 && (
                    <span className="rounded-full bg-red-50 px-1.5 py-0.5 text-xs font-bold text-red-600">
                      {unread} non lues
                    </span>
                  )}
                </div>
                {unread > 0 && (
                  <button
                    onClick={markAllRead}
                    className="flex items-center gap-1 text-xs font-medium text-brand-600 hover:text-brand-700"
                  >
                    <Check className="h-3 w-3" />
                    Tout lire
                  </button>
                )}
              </div>

              {/* List */}
              <div className="max-h-80 overflow-y-auto">
                {notifs.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 text-surface-400">
                    <Bell className="mb-2 h-6 w-6" />
                    <p className="text-sm">Aucune notification</p>
                  </div>
                ) : (
                  notifs.map((n) => {
                    const cfg = ICON_MAP[n.type];
                    const Icon = cfg.icon;
                    return (
                      <div
                        key={n.id}
                        onClick={() => markRead(n.id)}
                        className={clsx(
                          'flex cursor-pointer items-start gap-3 px-4 py-3 transition-colors hover:bg-surface-50 group',
                          !n.read && 'bg-brand-50/30'
                        )}
                      >
                        <div className={`mt-0.5 rounded-xl p-1.5 shrink-0 ${cfg.bg}`}>
                          <Icon className={`h-3.5 w-3.5 ${cfg.color}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p className={`text-xs font-semibold ${n.read ? 'text-surface-600' : 'text-surface-900'}`}>
                              {n.title}
                            </p>
                            <button
                              onClick={(e) => { e.stopPropagation(); dismiss(n.id); }}
                              className="opacity-0 group-hover:opacity-100 shrink-0 text-surface-300 hover:text-surface-500 transition-opacity"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                          <p className="mt-0.5 text-xs text-surface-400 leading-relaxed">{n.body}</p>
                          <p className="mt-1 text-[10px] text-surface-300">{relativeTime(n.ts)}</p>
                        </div>
                        {!n.read && (
                          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500" />
                        )}
                      </div>
                    );
                  })
                )}
              </div>

              {/* Footer */}
              <div className="border-t border-surface-100 px-4 py-2.5">
                <button className="w-full text-center text-xs font-medium text-brand-600 hover:text-brand-700">
                  Voir toutes les notifications →
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
