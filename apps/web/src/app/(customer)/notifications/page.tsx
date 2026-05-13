'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell, ShoppingBag, Star, Truck, Tag, X,
  CheckCheck, Package,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Navbar } from '@/components/layout/Navbar';
import { Badge } from '@/components/ui/Badge';
import { subscribeToPush } from '@/lib/push';

type NotifType = 'order' | 'promo' | 'loyalty' | 'delivery' | 'system';
type Filter = 'all' | NotifType;

interface Notif {
  id: string;
  type: NotifType;
  title: string;
  body: string;
  time: string;
  read: boolean;
  actionLabel?: string;
  actionHref?: string;
}

const INITIAL: Notif[] = [
  { id: 'n1', type: 'order', title: 'Commande confirmée', body: 'Votre commande #1042 a été acceptée par Le Gourmet Parisien.', time: 'il y a 5 min', read: false, actionLabel: 'Suivre', actionHref: '/orders/1042/track' },
  { id: 'n2', type: 'delivery', title: 'Livreur en route', body: 'Karim est à 8 minutes de chez vous. Commande #1042.', time: 'il y a 12 min', read: false, actionLabel: 'Voir carte', actionHref: '/orders/1042/track' },
  { id: 'n3', type: 'promo', title: 'Offre flash 🔥', body: '-20% sur toute la carte de Bella Italia ce soir de 19h à 21h.', time: 'il y a 1h', read: false, actionLabel: 'Commander', actionHref: '/menu' },
  { id: 'n4', type: 'loyalty', title: 'Points crédités', body: 'Vous avez gagné 85 points sur votre dernière commande. Total : 760 pts.', time: 'il y a 2h', read: true },
  { id: 'n5', type: 'order', title: 'Commande livrée', body: 'Votre commande #1041 a été livrée. Bon appétit ! 🍕', time: 'Hier 20:14', read: true, actionLabel: 'Laisser un avis', actionHref: '/orders' },
  { id: 'n6', type: 'loyalty', title: 'Niveau Silver atteint !', body: 'Félicitations ! Vous avez rejoint le niveau Silver et débloquez de nouveaux avantages.', time: 'Il y a 3 jours', read: true, actionLabel: 'Voir avantages', actionHref: '/loyalty' },
  { id: 'n7', type: 'promo', title: 'Nouveau restaurant', body: 'Taco Loco vient d\'ouvrir près de chez vous avec 15% de réduction pour les premiers.', time: 'Il y a 4 jours', read: true, actionLabel: 'Découvrir', actionHref: '/menu' },
  { id: 'n8', type: 'system', title: 'Mise à jour de l\'app', body: 'FoodStack v2.4 — suivi GPS en temps réel et nouveau programme de fidélité disponibles.', time: 'Il y a 1 sem.', read: true },
  { id: 'n9', type: 'delivery', title: 'Commande récupérée', body: 'Le livreur a récupéré votre commande #1040 au restaurant.', time: 'Il y a 1 sem.', read: true },
  { id: 'n10', type: 'order', title: 'Remboursement traité', body: 'Le remboursement de 12,90 € pour la commande #1039 a été traité (3-5 jours ouvrés).', time: 'Il y a 2 sem.', read: true },
];

const TYPE_CONFIG: Record<NotifType, { icon: React.ElementType; color: string; bg: string; label: string }> = {
  order: { icon: ShoppingBag, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-100 dark:bg-blue-900/30', label: 'Commande' },
  delivery: { icon: Truck, color: 'text-brand-600 dark:text-brand-400', bg: 'bg-brand-100 dark:bg-brand-900/30', label: 'Livraison' },
  promo: { icon: Tag, color: 'text-green-600 dark:text-green-400', bg: 'bg-green-100 dark:bg-green-900/30', label: 'Promo' },
  loyalty: { icon: Star, color: 'text-yellow-600 dark:text-yellow-400', bg: 'bg-yellow-100 dark:bg-yellow-900/30', label: 'Fidélité' },
  system: { icon: Bell, color: 'text-surface-500', bg: 'bg-surface-100 dark:bg-surface-800', label: 'Système' },
};

const FILTER_LABELS: Record<Filter, string> = {
  all: 'Toutes',
  order: 'Commandes',
  delivery: 'Livraisons',
  promo: 'Promos',
  loyalty: 'Fidélité',
  system: 'Système',
};

export default function NotificationsPage() {
  const [notifs, setNotifs] = useState<Notif[]>(INITIAL);
  const [filter, setFilter] = useState<Filter>('all');
  const [pushSubscribed, setPushSubscribed] = useState<boolean>(
    typeof window !== 'undefined' && localStorage.getItem('push-subscribed') === 'true',
  );
  const [subscribing, setSubscribing] = useState(false);

  async function handleSubscribePush() {
    setSubscribing(true);
    try {
      const sub = await subscribeToPush();
      if (sub) {
        setPushSubscribed(true);
        toast.success('Notifications push activées !');
      } else {
        toast.error('Impossible d\'activer les notifications push.');
      }
    } finally {
      setSubscribing(false);
    }
  }

  const unreadCount = notifs.filter((n) => !n.read).length;

  const filtered = filter === 'all' ? notifs : notifs.filter((n) => n.type === filter);

  const markAllRead = () => setNotifs((prev) => prev.map((n) => ({ ...n, read: true })));
  const markRead = (id: string) => setNotifs((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n));
  const dismiss = (id: string) => setNotifs((prev) => prev.filter((n) => n.id !== id));

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-surface-50 dark:bg-surface-950 py-8">
        <div className="mx-auto max-w-2xl px-4 sm:px-6">
          {/* Push subscription banner */}
          {!pushSubscribed && (
            <div className="mb-6 flex items-center justify-between rounded-2xl border border-brand-200 dark:border-brand-800/50 bg-brand-50 dark:bg-brand-900/10 px-4 py-3">
              <p className="text-sm text-surface-700 dark:text-surface-300">
                Recevez les mises à jour de commandes en temps réel.
              </p>
              <button
                onClick={handleSubscribePush}
                disabled={subscribing}
                className="ml-4 flex-shrink-0 rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60 transition-colors"
              >
                {subscribing ? 'Activation…' : '🔔 Activer les notifications push'}
              </button>
            </div>
          )}

          {/* Header */}
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-50">Notifications</h1>
              {unreadCount > 0 && (
                <p className="mt-1 text-sm text-surface-500 dark:text-surface-400">{unreadCount} non lue{unreadCount > 1 ? 's' : ''}</p>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="flex items-center gap-1.5 text-sm text-brand-600 dark:text-brand-400 font-medium hover:underline"
              >
                <CheckCheck className="h-4 w-4" />
                Tout marquer lu
              </button>
            )}
          </div>

          {/* Filters */}
          <div className="mb-5 flex gap-2 overflow-x-auto pb-1">
            {(Object.keys(FILTER_LABELS) as Filter[]).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`flex-shrink-0 rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                  filter === f
                    ? 'bg-surface-900 dark:bg-surface-100 text-white dark:text-surface-900'
                    : 'bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-700 text-surface-600 dark:text-surface-400 hover:bg-surface-50 dark:hover:bg-surface-800'
                }`}
              >
                {FILTER_LABELS[f]}
                {f === 'all' && unreadCount > 0 && (
                  <span className="ml-1.5 inline-flex h-4 w-4 items-center justify-center rounded-full bg-brand-500 text-xs text-white">
                    {unreadCount}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Notifications list */}
          <div className="space-y-2">
            <AnimatePresence initial={false}>
              {filtered.length === 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="rounded-2xl border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 p-12 text-center"
                >
                  <Package className="mx-auto mb-3 h-10 w-10 text-surface-300" />
                  <p className="text-sm text-surface-500 dark:text-surface-400">Aucune notification</p>
                </motion.div>
              )}
              {filtered.map((notif) => {
                const cfg = TYPE_CONFIG[notif.type];
                const Icon = cfg.icon;
                return (
                  <motion.div
                    key={notif.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20, height: 0 }}
                    transition={{ duration: 0.2 }}
                    onClick={() => markRead(notif.id)}
                    className={`relative flex gap-4 rounded-2xl border p-4 transition-colors cursor-pointer ${
                      notif.read
                        ? 'border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900'
                        : 'border-brand-200 dark:border-brand-800/50 bg-brand-50/50 dark:bg-brand-900/10'
                    }`}
                  >
                    {/* Unread dot */}
                    {!notif.read && (
                      <span className="absolute right-4 top-4 h-2 w-2 rounded-full bg-brand-500" />
                    )}

                    {/* Icon */}
                    <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl ${cfg.bg}`}>
                      <Icon className={`h-5 w-5 ${cfg.color}`} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0 pr-6">
                      <div className="flex items-start justify-between gap-2">
                        <p className={`text-sm font-semibold ${notif.read ? 'text-surface-700 dark:text-surface-300' : 'text-surface-900 dark:text-surface-50'}`}>
                          {notif.title}
                        </p>
                      </div>
                      <p className="mt-0.5 text-sm text-surface-500 dark:text-surface-400 leading-relaxed">{notif.body}</p>
                      <div className="mt-2 flex items-center gap-3">
                        <span className="text-xs text-surface-400">{notif.time}</span>
                        {notif.actionLabel && notif.actionHref && (
                          <a
                            href={notif.actionHref}
                            onClick={(e) => e.stopPropagation()}
                            className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline"
                          >
                            {notif.actionLabel} →
                          </a>
                        )}
                      </div>
                    </div>

                    {/* Dismiss */}
                    <button
                      onClick={(e) => { e.stopPropagation(); dismiss(notif.id); }}
                      className="absolute right-4 bottom-4 rounded-lg p-1 text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-800 hover:text-surface-500"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </>
  );
}
