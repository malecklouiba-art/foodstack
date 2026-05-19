'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Bell, ShoppingBag, Tag, Settings, ChevronRight, Check, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';
import api from '@/lib/api';

// ── Types ──────────────────────────────────────────────────────────────────

type NotifType = 'order' | 'promo' | 'system';

interface Notification {
  id: string;
  type: NotifType;
  title: string;
  body?: string;
  time: string;
  read: boolean;
  createdAt?: string;
}

interface ApiNotif {
  id: string;
  type?: string;
  title?: string;
  body?: string;
  read?: boolean;
  isRead?: boolean;
  createdAt?: string;
}

function relativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60_000);
  if (mins < 1)   return 'À l\'instant';
  if (mins < 60)  return `Il y a ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `Il y a ${hours}h`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'Hier';
  if (days < 7)   return `Il y a ${days}j`;
  return `Il y a ${Math.floor(days / 7)} sem`;
}

function normaliseType(raw?: string): NotifType {
  if (raw === 'ORDER' || raw === 'order' || raw?.includes('order')) return 'order';
  if (raw === 'PROMO' || raw === 'promo' || raw?.includes('promo')) return 'promo';
  return 'system';
}

function normaliseNotif(raw: ApiNotif): Notification {
  return {
    id:    raw.id,
    type:  normaliseType(raw.type),
    title: raw.title ?? raw.body ?? 'Notification',
    body:  raw.body,
    time:  raw.createdAt ? relativeTime(raw.createdAt) : '',
    read:  raw.read ?? raw.isRead ?? false,
    createdAt: raw.createdAt,
  };
}

// ── Fallback mocks ─────────────────────────────────────────────────────────

const MOCK_NOTIFS: Notification[] = [
  { id: 'n1',  type: 'order',  title: 'Commande #8821 livrée ✅',                      time: 'Il y a 5 min',  read: false },
  { id: 'n2',  type: 'order',  title: 'Votre commande #8820 est en route 🛵',          time: 'Il y a 18 min', read: false },
  { id: 'n3',  type: 'promo',  title: 'Promotion : -20% ce weekend 🎉',                time: 'Il y a 2h',     read: true  },
  { id: 'n4',  type: 'order',  title: 'Points fidélité : +47 points gagnés ⭐',        time: 'Il y a 3h',     read: false },
  { id: 'n5',  type: 'system', title: 'Nouveau restaurant disponible dans votre zone', time: 'Il y a 1j',     read: true  },
  { id: 'n6',  type: 'order',  title: 'Commande #8815 annulée',                        time: 'Hier',          read: true  },
  { id: 'n7',  type: 'promo',  title: 'Offre spéciale burger du mois 🍔',              time: 'Il y a 2j',     read: true  },
  { id: 'n8',  type: 'system', title: 'Mise à jour des CGU',                           time: 'Il y a 3j',     read: true  },
  { id: 'n9',  type: 'order',  title: 'Commande #8810 livrée ✅',                      time: 'Il y a 4j',     read: true  },
  { id: 'n10', type: 'promo',  title: '-15% sur votre prochaine commande 🎁',          time: 'Il y a 5j',     read: true  },
  { id: 'n11', type: 'system', title: 'Rappel : votre adresse a été mise à jour',      time: 'Il y a 1sem',   read: true  },
  { id: 'n12', type: 'system', title: 'Bienvenue chez FoodStack ! 🎉',                 time: 'Il y a 2sem',   read: true  },
];

type FilterTab = 'all' | NotifType;

const TABS: { key: FilterTab; label: string }[] = [
  { key: 'all',    label: 'Toutes'     },
  { key: 'order',  label: 'Commandes'  },
  { key: 'promo',  label: 'Promotions' },
  { key: 'system', label: 'Système'    },
];

const TYPE_CONFIG: Record<NotifType, { icon: React.ElementType; borderColor: string; bgColor: string; iconColor: string }> = {
  order:  { icon: ShoppingBag, borderColor: 'border-l-green-500',  bgColor: 'bg-green-50',   iconColor: 'text-green-500'  },
  promo:  { icon: Tag,         borderColor: 'border-l-[#1EFF6A]',  bgColor: 'bg-emerald-50', iconColor: 'text-[#1EFF6A]'  },
  system: { icon: Settings,    borderColor: 'border-l-blue-500',   bgColor: 'bg-blue-50',    iconColor: 'text-blue-500'   },
};

export default function NotificationsPage() {
  const [notifs, setNotifs]       = useState<Notification[]>([]);
  const [loading, setLoading]     = useState(true);
  const [activeTab, setActiveTab] = useState<FilterTab>('all');

  const fetchNotifs = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.get<ApiNotif[]>('/notifications');
      const list = Array.isArray(data) ? data.map(normaliseNotif) : [];
      setNotifs(list);
    } catch {
      setNotifs([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchNotifs(); }, [fetchNotifs]);

  const unreadCount = notifs.filter((n) => !n.read).length;
  const filtered    = activeTab === 'all' ? notifs : notifs.filter((n) => n.type === activeTab);

  async function markRead(id: string) {
    setNotifs((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    try { await api.patch(`/notifications/${id}/read`, {}); } catch { /* silently ignore */ }
  }

  async function markAllRead() {
    setNotifs((prev) => prev.map((n) => ({ ...n, read: true })));
    try { await api.patch('/notifications/read-all', {}); } catch { /* silently ignore */ }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 py-5 sm:px-6">
        <div className="mx-auto max-w-3xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/" className="text-gray-400 hover:text-gray-600 transition-colors">
                <Bell className="h-5 w-5" />
              </Link>
              <ChevronRight className="h-4 w-4 text-gray-300" />
              <h1 className="text-lg font-bold text-gray-900">Notifications</h1>
              {unreadCount > 0 && (
                <span
                  className="flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-xs font-bold"
                  style={{ backgroundColor: '#1EFF6A', color: '#000' }}
                >
                  {unreadCount}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={fetchNotifs}
                className="flex items-center gap-1.5 rounded-xl bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-200"
                title="Actualiser"
              >
                <RefreshCw className="h-3.5 w-3.5" />
              </button>
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  className="flex items-center gap-1.5 rounded-xl bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-200"
                >
                  <Check className="h-3.5 w-3.5" />
                  Tout marquer
                </button>
              )}
            </div>
          </div>

          {/* Filter tabs */}
          <div className="mt-4 flex gap-1 overflow-x-auto pb-0.5">
            {TABS.map((tab) => {
              const tabUnread = tab.key === 'all'
                ? unreadCount
                : notifs.filter((n) => n.type === tab.key && !n.read).length;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={clsx(
                    'relative flex shrink-0 items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-medium transition-all',
                    activeTab === tab.key
                      ? 'bg-gray-900 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200',
                  )}
                >
                  {tab.label}
                  {tabUnread > 0 && (
                    <span
                      className="flex h-4 min-w-[16px] items-center justify-center rounded-full px-1 text-[10px] font-bold"
                      style={activeTab === tab.key
                        ? { backgroundColor: '#1EFF6A', color: '#000' }
                        : { backgroundColor: '#e5e7eb', color: '#374151' }}
                    >
                      {tabUnread}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* List */}
      <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 space-y-2">
        {loading ? (
          // Skeleton
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map((n) => (
              <div key={n} className="rounded-2xl bg-white border border-gray-100 border-l-4 border-l-gray-200 px-5 py-4">
                <div className="flex items-start gap-4">
                  <div className="h-9 w-9 rounded-xl bg-gray-100 animate-pulse shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-3/4 rounded-full bg-gray-100 animate-pulse" />
                    <div className="h-3 w-1/4 rounded-full bg-gray-50 animate-pulse" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
            <Bell className="h-12 w-12 text-gray-200" />
            <p className="font-medium text-gray-500">Aucune notification</p>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {filtered.map((notif, idx) => {
              const cfg  = TYPE_CONFIG[notif.type];
              const Icon = cfg.icon;
              return (
                <motion.div
                  key={notif.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ delay: idx * 0.03 }}
                >
                  <button
                    onClick={() => markRead(notif.id)}
                    className={clsx(
                      'group w-full text-left rounded-2xl border border-gray-100 bg-white overflow-hidden',
                      'border-l-4 px-5 py-4 transition-all hover:shadow-sm',
                      cfg.borderColor,
                      !notif.read && 'shadow-sm',
                    )}
                  >
                    <div className="flex items-start gap-4">
                      <div className={clsx('mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl', cfg.bgColor)}>
                        <Icon className={clsx('h-4 w-4', cfg.iconColor)} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={clsx('text-sm leading-snug', notif.read ? 'text-gray-600 font-normal' : 'text-gray-900 font-semibold')}>
                          {notif.title}
                        </p>
                        {notif.body && notif.body !== notif.title && (
                          <p className="mt-0.5 text-xs text-gray-500 line-clamp-2">{notif.body}</p>
                        )}
                        <p className="mt-1 text-xs text-gray-400">{notif.time}</p>
                      </div>
                      {!notif.read && (
                        <span
                          className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full"
                          style={{ backgroundColor: '#1EFF6A' }}
                        />
                      )}
                    </div>
                  </button>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
