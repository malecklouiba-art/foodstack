'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Store, Star, TrendingUp, Clock, MapPin, Settings,
  Plus, X, Pause, ChevronRight, Edit2,
} from 'lucide-react';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

// ── Types ────────────────────────────────────────────────────────────────────

type RestaurantStatus = 'open' | 'paused';

interface Restaurant {
  id: string;
  name: string;
  address: string;
  cuisine: string;
  status: RestaurantStatus;
  rating: number;
  ordersToday: number;
  revenue: number;
  openTime: string;
  closeTime: string;
  image: string;
  color: string;
}

interface AddRestaurantForm {
  name: string;
  address: string;
  cuisine: string;
  openTime: string;
  closeTime: string;
}

// ── Mock data ────────────────────────────────────────────────────────────────

const RESTAURANTS: Restaurant[] = [
  {
    id: 'r1',
    name: 'FoodStack Bastille',
    address: '12 place de la Bastille, Paris 75011',
    cuisine: 'Française · Fusion',
    status: 'open',
    rating: 4.8,
    ordersToday: 84,
    revenue: 12450,
    openTime: '11:00',
    closeTime: '23:00',
    image: 'FB',
    color: 'from-brand-400 to-brand-600',
  },
  {
    id: 'r2',
    name: 'FoodStack Marais',
    address: '34 rue des Archives, Paris 75004',
    cuisine: 'Méditerranéenne',
    status: 'open',
    rating: 4.6,
    ordersToday: 61,
    revenue: 8920,
    openTime: '12:00',
    closeTime: '22:30',
    image: 'FM',
    color: 'from-blue-400 to-purple-500',
  },
  {
    id: 'r3',
    name: 'FoodStack Nation',
    address: '78 av du Trône, Paris 75012',
    cuisine: 'Asiatique · Sushi',
    status: 'paused',
    rating: 4.4,
    ordersToday: 23,
    revenue: 3210,
    openTime: '11:30',
    closeTime: '23:30',
    image: 'FN',
    color: 'from-green-400 to-teal-500',
  },
];

const STATUS_CONFIG: Record<RestaurantStatus, { label: string; variant: 'success' | 'warning' }> = {
  open: { label: 'Ouvert', variant: 'success' },
  paused: { label: 'En pause', variant: 'warning' },
};

const EMPTY_FORM: AddRestaurantForm = {
  name: '',
  address: '',
  cuisine: '',
  openTime: '',
  closeTime: '',
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatRevenue(n: number): string {
  return n.toLocaleString('fr-FR') + ' €';
}

function RatingStars({ rating }: { rating: number }) {
  const full = Math.floor(rating);
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`h-3.5 w-3.5 ${i < full ? 'fill-yellow-400 text-yellow-400' : 'text-surface-200'}`}
        />
      ))}
      <span className="ml-1 text-xs font-semibold text-surface-700">{rating}</span>
    </div>
  );
}

// ── Add restaurant modal ──────────────────────────────────────────────────────

function AddRestaurantModal({ onClose, onAdd }: { onClose: () => void; onAdd: (r: Restaurant) => void }) {
  const [form, setForm] = useState<AddRestaurantForm>(EMPTY_FORM);

  const handleSubmit = () => {
    if (!form.name.trim()) return;
    const initials = form.name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0])
      .join('')
      .toUpperCase();
    const colors = ['from-pink-400 to-rose-500', 'from-cyan-400 to-blue-500', 'from-violet-400 to-purple-500'];
    const newR: Restaurant = {
      id: `r${Date.now()}`,
      name: form.name,
      address: form.address,
      cuisine: form.cuisine,
      status: 'open',
      rating: 0,
      ordersToday: 0,
      revenue: 0,
      openTime: form.openTime || '12:00',
      closeTime: form.closeTime || '22:00',
      image: initials || 'FS',
      color: colors[Math.floor(Math.random() * colors.length)],
    };
    onAdd(newR);
    onClose();
  };

  const fields: { key: keyof AddRestaurantForm; label: string; placeholder: string; type?: string }[] = [
    { key: 'name', label: 'Nom du restaurant', placeholder: 'FoodStack République' },
    { key: 'address', label: 'Adresse', placeholder: '1 place de la République, Paris' },
    { key: 'cuisine', label: 'Type de cuisine', placeholder: 'Italienne · Pizza' },
    { key: 'openTime', label: 'Heure d\'ouverture', placeholder: '11:00', type: 'time' },
    { key: 'closeTime', label: 'Heure de fermeture', placeholder: '23:00', type: 'time' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-surface-900/60 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 8 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className="relative w-full max-w-md rounded-2xl border border-surface-200 bg-white shadow-xl"
      >
        {/* Header */}
        <div className="border-b border-surface-100 px-6 py-5">
          <h2 className="text-lg font-semibold text-surface-900">Ajouter un restaurant</h2>
          <p className="mt-1 text-sm text-surface-500">Renseignez les informations de votre nouvel établissement</p>
        </div>

        {/* Close */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1.5 text-surface-400 transition-colors hover:bg-surface-100 hover:text-surface-600"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Body */}
        <div className="space-y-4 px-6 py-5">
          {fields.map((f) => (
            <div key={f.key}>
              <label className="mb-1.5 block text-xs font-semibold text-surface-600">{f.label}</label>
              <input
                type={f.type ?? 'text'}
                placeholder={f.placeholder}
                value={form[f.key]}
                onChange={(e) => setForm((prev) => ({ ...prev, [f.key]: e.target.value }))}
                className="w-full rounded-xl border border-surface-200 px-3 py-2.5 text-sm text-surface-900 placeholder-surface-400 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
              />
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="flex gap-3 border-t border-surface-100 px-6 py-4">
          <button
            onClick={onClose}
            className="flex-1 rounded-xl border border-surface-200 py-2.5 text-sm font-semibold text-surface-600 transition-colors hover:bg-surface-50"
          >
            Annuler
          </button>
          <button
            onClick={handleSubmit}
            className="flex-1 rounded-xl bg-brand-500 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-600"
          >
            Créer le restaurant
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ── Restaurant card ───────────────────────────────────────────────────────────

function RestaurantCard({ restaurant }: { restaurant: Restaurant }) {
  const statusCfg = STATUS_CONFIG[restaurant.status];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
    >
      <Card padding="none" className="overflow-hidden">
        {/* Gradient header */}
        <div className={`flex items-center gap-4 bg-gradient-to-r ${restaurant.color} px-5 py-5`}>
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm">
            <span className="text-xl font-black text-white">{restaurant.image}</span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-base font-bold text-white">{restaurant.name}</p>
            <p className="mt-0.5 truncate text-xs text-white/80">{restaurant.cuisine}</p>
          </div>
          <Badge variant={statusCfg.variant} dot>{statusCfg.label}</Badge>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          {/* Address */}
          <div className="flex items-start gap-2 text-xs text-surface-500">
            <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-surface-400" />
            <span>{restaurant.address}</span>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-surface-50 p-3 text-center">
              <p className="text-lg font-bold text-surface-900">{restaurant.ordersToday}</p>
              <p className="text-xs text-surface-400">Commandes aujourd&apos;hui</p>
            </div>
            <div className="rounded-xl bg-surface-50 p-3 text-center">
              <p className="text-lg font-bold text-surface-900">{formatRevenue(restaurant.revenue)}</p>
              <p className="text-xs text-surface-400">Chiffre d&apos;affaires</p>
            </div>
          </div>

          {/* Rating + hours */}
          <div className="flex items-center justify-between">
            <RatingStars rating={restaurant.rating} />
            <div className="flex items-center gap-1 text-xs text-surface-500">
              <Clock className="h-3.5 w-3.5" />
              {restaurant.openTime} – {restaurant.closeTime}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-2 pt-1">
            <button className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-brand-500 py-2 text-xs font-semibold text-white transition-colors hover:bg-brand-600">
              <Store className="h-3.5 w-3.5" />
              Gérer
            </button>
            <button className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-surface-200 py-2 text-xs font-semibold text-surface-600 transition-colors hover:bg-surface-50">
              <Settings className="h-3.5 w-3.5" />
              Paramètres
            </button>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function RestaurantsPage() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>(RESTAURANTS);
  const [showModal, setShowModal] = useState(false);
  const [editingHours, setEditingHours] = useState<string | null>(null);
  const [hoursForm, setHoursForm] = useState({ openTime: '', closeTime: '' });

  const openCount = restaurants.filter((r) => r.status === 'open').length;
  const pausedCount = restaurants.filter((r) => r.status === 'paused').length;
  const avgRating = restaurants.length
    ? (restaurants.reduce((s, r) => s + r.rating, 0) / restaurants.length).toFixed(1)
    : '—';

  const handleAddRestaurant = (r: Restaurant) => {
    setRestaurants((prev) => [...prev, r]);
  };

  const startEditHours = (r: Restaurant) => {
    setEditingHours(r.id);
    setHoursForm({ openTime: r.openTime, closeTime: r.closeTime });
  };

  const saveHours = (id: string) => {
    setRestaurants((prev) =>
      prev.map((r) =>
        r.id === id ? { ...r, openTime: hoursForm.openTime, closeTime: hoursForm.closeTime } : r
      )
    );
    setEditingHours(null);
  };

  const KPI_STATS = [
    { label: 'Total', value: String(restaurants.length), icon: Store, iconColor: 'text-brand-600', iconBg: 'bg-brand-50' },
    { label: 'Ouverts maintenant', value: String(openCount), icon: TrendingUp, iconColor: 'text-green-600', iconBg: 'bg-green-50' },
    { label: 'En pause', value: String(pausedCount), icon: Pause, iconColor: 'text-yellow-600', iconBg: 'bg-yellow-50' },
    { label: 'Note moy.', value: String(avgRating), icon: Star, iconColor: 'text-yellow-500', iconBg: 'bg-yellow-50' },
  ];

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-surface-900">Restaurants</h1>
          <p className="mt-1 text-sm text-surface-500">Gérez vos établissements</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-600"
        >
          <Plus className="h-4 w-4" />
          Ajouter
        </button>
      </div>

      {/* Stats strip */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {KPI_STATS.map(({ label, value, icon: Icon, iconColor, iconBg }, i) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
          >
            <Card padding="md" className="flex items-center gap-3">
              <div className={`rounded-xl p-2.5 ${iconBg}`}>
                <Icon className={`h-5 w-5 ${iconColor}`} />
              </div>
              <div>
                <p className="text-xl font-bold text-surface-900">{value}</p>
                <p className="text-xs text-surface-400">{label}</p>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Restaurant cards grid */}
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        <AnimatePresence mode="popLayout">
          {restaurants.map((restaurant) => (
            <RestaurantCard key={restaurant.id} restaurant={restaurant} />
          ))}
        </AnimatePresence>
      </div>

      {/* Opening hours quick edit */}
      <Card padding="none">
        <CardHeader className="border-b border-surface-100 px-6 py-5">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-brand-500" />
            <CardTitle>Horaires d&apos;ouverture</CardTitle>
          </div>
          <span className="text-sm text-surface-400">Modification rapide</span>
        </CardHeader>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-surface-100 text-left">
                {['Restaurant', 'Statut', 'Ouverture', 'Fermeture', ''].map((h) => (
                  <th key={h} className="px-6 py-3 text-xs font-semibold uppercase tracking-wide text-surface-400">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-50">
              {restaurants.map((r) => {
                const isEditing = editingHours === r.id;
                const statusCfg = STATUS_CONFIG[r.status];
                return (
                  <tr key={r.id} className="hover:bg-surface-50 transition-colors">
                    {/* Name */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${r.color}`}>
                          <span className="text-xs font-bold text-white">{r.image}</span>
                        </div>
                        <div>
                          <p className="font-medium text-surface-900">{r.name}</p>
                          <p className="text-xs text-surface-400">{r.cuisine}</p>
                        </div>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="px-6 py-4">
                      <Badge variant={statusCfg.variant} dot>{statusCfg.label}</Badge>
                    </td>

                    {/* Open time */}
                    <td className="px-6 py-4">
                      {isEditing ? (
                        <input
                          type="time"
                          value={hoursForm.openTime}
                          onChange={(e) => setHoursForm((f) => ({ ...f, openTime: e.target.value }))}
                          className="w-28 rounded-lg border border-surface-200 px-2 py-1 text-sm focus:border-brand-400 focus:outline-none"
                        />
                      ) : (
                        <span className="font-medium text-surface-900">{r.openTime}</span>
                      )}
                    </td>

                    {/* Close time */}
                    <td className="px-6 py-4">
                      {isEditing ? (
                        <input
                          type="time"
                          value={hoursForm.closeTime}
                          onChange={(e) => setHoursForm((f) => ({ ...f, closeTime: e.target.value }))}
                          className="w-28 rounded-lg border border-surface-200 px-2 py-1 text-sm focus:border-brand-400 focus:outline-none"
                        />
                      ) : (
                        <span className="font-medium text-surface-900">{r.closeTime}</span>
                      )}
                    </td>

                    {/* Action */}
                    <td className="px-6 py-4">
                      {isEditing ? (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => saveHours(r.id)}
                            className="rounded-lg bg-brand-500 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-brand-600"
                          >
                            Enregistrer
                          </button>
                          <button
                            onClick={() => setEditingHours(null)}
                            className="rounded-lg border border-surface-200 px-3 py-1.5 text-xs font-semibold text-surface-600 transition-colors hover:bg-surface-50"
                          >
                            Annuler
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => startEditHours(r)}
                          className="flex items-center gap-1.5 rounded-lg bg-surface-100 px-3 py-1.5 text-xs font-semibold text-surface-600 transition-colors hover:bg-surface-200"
                        >
                          <Edit2 className="h-3 w-3" />
                          Modifier
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Quick actions strip */}
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: 'Voir toutes les commandes', icon: ChevronRight, desc: 'Commandes groupées par restaurant' },
          { label: 'Gestion des menus', icon: ChevronRight, desc: 'Articles, prix, disponibilités' },
          { label: 'Rapports & analytics', icon: ChevronRight, desc: 'Ventes, tendances, comparatifs' },
        ].map((item) => (
          <button
            key={item.label}
            className="flex items-center justify-between rounded-2xl border border-surface-200 bg-white px-5 py-4 text-left shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5"
          >
            <div>
              <p className="text-sm font-semibold text-surface-900">{item.label}</p>
              <p className="text-xs text-surface-400">{item.desc}</p>
            </div>
            <item.icon className="h-4 w-4 text-surface-400" />
          </button>
        ))}
      </div>

      {/* Add restaurant modal */}
      <AnimatePresence>
        {showModal && (
          <AddRestaurantModal
            onClose={() => setShowModal(false)}
            onAdd={handleAddRestaurant}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
