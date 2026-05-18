'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search, Star, Clock, ShoppingBag, MapPin, Filter, X, ChevronRight, Flame } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';
import api from '@/lib/api';

// ── Types ──────────────────────────────────────────────────────────────────

interface Restaurant {
  id: string;
  name: string;
  description?: string;
  cuisine?: string;
  categories?: string[];
  address?: string;
  rating?: number;
  reviewCount?: number;
  deliveryTime?: string;
  deliveryFee?: number;
  minOrder?: number;
  isOpen?: boolean;
  isFeatured?: boolean;
  tags?: string[];
  logo?: string;
  image?: string;
}

// ── Fallback mocks ─────────────────────────────────────────────────────────

const GRADIENT_POOL = [
  'from-orange-400 to-red-500',
  'from-rose-400 to-pink-600',
  'from-green-400 to-emerald-600',
  'from-yellow-400 to-orange-500',
  'from-blue-400 to-indigo-600',
  'from-purple-400 to-violet-600',
  'from-teal-400 to-cyan-600',
  'from-amber-400 to-yellow-600',
];

const MOCK_RESTAURANTS: Restaurant[] = [
  { id: 'r1', name: 'Burger Palace',  cuisine: 'Fast Food',   rating: 4.8, reviewCount: 234, deliveryTime: '20-30min', deliveryFee: 2.5, minOrder: 15, isOpen: true,  isFeatured: true,  tags: ['Bestseller', 'Livraison rapide'] },
  { id: 'r2', name: 'Sushi Zen',      cuisine: 'Japonais',    rating: 4.9, reviewCount: 189, deliveryTime: '25-35min', deliveryFee: 0,   minOrder: 20, isOpen: true,  isFeatured: true,  tags: ['Top noté', 'Livraison offerte'] },
  { id: 'r3', name: 'Pizza Roma',     cuisine: 'Italien',     rating: 4.6, reviewCount: 312, deliveryTime: '15-25min', deliveryFee: 1.9, minOrder: 12, isOpen: true,  isFeatured: false, tags: ['Populaire'] },
  { id: 'r4', name: 'Thai Garden',    cuisine: 'Thaïlandais', rating: 4.7, reviewCount: 98,  deliveryTime: '30-40min', deliveryFee: 2.9, minOrder: 18, isOpen: false, isFeatured: false, tags: ['Authentique'] },
  { id: 'r5', name: 'Le Bistrot',     cuisine: 'Français',    rating: 4.5, reviewCount: 156, deliveryTime: '20-30min', deliveryFee: 2,   minOrder: 15, isOpen: true,  isFeatured: false, tags: ['Traditionnel'] },
  { id: 'r6', name: 'Tacos Express',  cuisine: 'Mexicain',    rating: 4.4, reviewCount: 445, deliveryTime: '15-20min', deliveryFee: 1.5, minOrder: 10, isOpen: true,  isFeatured: false, tags: ['Rapide'] },
  { id: 'r7', name: 'Crêpe Bretonne', cuisine: 'Crêperie',    rating: 4.7, reviewCount: 203, deliveryTime: '20-25min', deliveryFee: 0,   minOrder: 8,  isOpen: true,  isFeatured: true,  tags: ['Livraison offerte'] },
  { id: 'r8', name: 'Kebab Sultan',   cuisine: 'Turc',        rating: 4.3, reviewCount: 567, deliveryTime: '10-20min', deliveryFee: 1,   minOrder: 8,  isOpen: true,  isFeatured: false, tags: ['Ultra rapide'] },
];

const CUISINE_FILTERS = ['Tous', 'Fast Food', 'Japonais', 'Italien', 'Thaïlandais', 'Français', 'Mexicain', 'Crêperie', 'Turc'];

type SortKey = 'rating' | 'deliveryTime' | 'deliveryFee' | 'name';
const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: 'rating',       label: 'Mieux notés'  },
  { key: 'deliveryTime', label: 'Livraison rapide' },
  { key: 'deliveryFee',  label: 'Livraison gratuite' },
  { key: 'name',         label: 'Alphabétique' },
];

// ── Helpers ────────────────────────────────────────────────────────────────

function deliveryTimeMinutes(t?: string): number {
  if (!t) return 999;
  const m = t.match(/(\d+)/);
  return m ? parseInt(m[1]) : 999;
}

// ── Component ──────────────────────────────────────────────────────────────

export default function RestaurantsPage() {
  const router = useRouter();

  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading]         = useState(true);
  const [search, setSearch]           = useState('');
  const [cuisine, setCuisine]         = useState('Tous');
  const [sort, setSort]               = useState<SortKey>('rating');
  const [openOnly, setOpenOnly]       = useState(false);
  const [freeDelivery, setFreeDelivery] = useState(false);

  const fetchRestaurants = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (openOnly) params.set('isOpen', 'true');
      if (cuisine !== 'Tous') params.set('cuisine', cuisine);
      params.set('limit', '100');
      const qs = params.toString();
      const data = await api.get<Restaurant[]>(`/restaurants${qs ? `?${qs}` : ''}`);
      setRestaurants(Array.isArray(data) && data.length > 0 ? data : MOCK_RESTAURANTS);
    } catch {
      setRestaurants(MOCK_RESTAURANTS);
    } finally {
      setLoading(false);
    }
  }, [openOnly, cuisine]);

  useEffect(() => { fetchRestaurants(); }, [fetchRestaurants]);

  const filtered = useMemo(() => {
    let list = [...restaurants];

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (r) => r.name.toLowerCase().includes(q) || r.cuisine?.toLowerCase().includes(q) || r.categories?.some((c) => c.toLowerCase().includes(q)),
      );
    }

    if (cuisine !== 'Tous') {
      list = list.filter((r) => r.cuisine === cuisine || r.categories?.includes(cuisine));
    }

    if (openOnly)     list = list.filter((r) => r.isOpen !== false);
    if (freeDelivery) list = list.filter((r) => (r.deliveryFee ?? 1) === 0);

    list.sort((a, b) => {
      if (sort === 'rating')       return (b.rating ?? 0) - (a.rating ?? 0);
      if (sort === 'deliveryTime') return deliveryTimeMinutes(a.deliveryTime) - deliveryTimeMinutes(b.deliveryTime);
      if (sort === 'deliveryFee')  return (a.deliveryFee ?? 0) - (b.deliveryFee ?? 0);
      return a.name.localeCompare(b.name);
    });

    return list;
  }, [restaurants, search, cuisine, sort, openOnly, freeDelivery]);

  const featured = filtered.filter((r) => r.isFeatured && r.isOpen !== false);

  const clearFilters = () => { setCuisine('Tous'); setOpenOnly(false); setFreeDelivery(false); setSearch(''); };
  const hasFilters   = cuisine !== 'Tous' || openOnly || freeDelivery || search.trim();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <div className="bg-gradient-to-br from-brand-600 via-brand-500 to-amber-500 px-4 py-10 sm:px-6">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="text-3xl font-black text-white sm:text-4xl">Nos restaurants 🍽️</h1>
          <p className="mt-2 text-brand-100">Livraison rapide, qualité garantie</p>
          <div className="mx-auto mt-5 flex max-w-xl items-center gap-3 rounded-2xl bg-white px-4 py-3 shadow-lg">
            <Search className="h-5 w-5 shrink-0 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher restaurant ou cuisine…"
              className="flex-1 bg-transparent text-sm font-medium text-gray-900 placeholder-gray-400 outline-none"
            />
            {search && (
              <button onClick={() => setSearch('')} className="text-gray-400 hover:text-gray-600">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
        {/* Filters row */}
        <div className="flex flex-wrap items-center gap-2 mb-5">
          {/* Cuisine chips */}
          <div className="flex gap-1.5 overflow-x-auto pb-1">
            {CUISINE_FILTERS.map((c) => (
              <button
                key={c}
                onClick={() => setCuisine(c)}
                className={clsx(
                  'shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all',
                  cuisine === c
                    ? 'bg-gray-900 text-white'
                    : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50',
                )}
              >
                {c}
              </button>
            ))}
          </div>

          <div className="ml-auto flex items-center gap-2">
            {/* Toggle filters */}
            <button
              onClick={() => setOpenOnly(!openOnly)}
              className={clsx(
                'flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-all border',
                openOnly ? 'bg-green-500 text-white border-green-500' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50',
              )}
            >
              ✅ Ouvert maintenant
            </button>
            <button
              onClick={() => setFreeDelivery(!freeDelivery)}
              className={clsx(
                'flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-all border',
                freeDelivery ? 'bg-blue-500 text-white border-blue-500' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50',
              )}
            >
              🆓 Livraison offerte
            </button>
            {/* Sort */}
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
              className="rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 outline-none"
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.key} value={o.key}>{o.label}</option>
              ))}
            </select>
            {hasFilters && (
              <button onClick={clearFilters} className="rounded-full bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-500 hover:bg-red-100">
                <X className="h-3.5 w-3.5 inline mr-1" />Réinitialiser
              </button>
            )}
          </div>
        </div>

        {loading ? (
          /* Skeleton */
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="overflow-hidden rounded-2xl bg-white shadow-sm">
                <div className="h-40 bg-gray-200 animate-pulse" />
                <div className="p-4 space-y-2">
                  <div className="h-4 w-3/4 rounded-full bg-gray-200 animate-pulse" />
                  <div className="h-3 w-1/2 rounded-full bg-gray-100 animate-pulse" />
                  <div className="h-8 w-full rounded-xl bg-gray-100 animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <>
            {/* Featured section */}
            {featured.length > 0 && !search && cuisine === 'Tous' && (
              <div className="mb-8">
                <div className="flex items-center gap-2 mb-3">
                  <Flame className="h-5 w-5 text-orange-500" />
                  <h2 className="text-lg font-bold text-gray-900">Coups de cœur</h2>
                </div>
                <div className="flex gap-4 overflow-x-auto pb-2">
                  {featured.map((r, idx) => (
                    <FeaturedCard key={r.id} restaurant={r} idx={idx} onClick={() => router.push(`/restaurants/${r.id}`)} />
                  ))}
                </div>
              </div>
            )}

            {/* Results count */}
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-medium text-gray-500">
                {filtered.length} restaurant{filtered.length !== 1 ? 's' : ''}
                {search ? ` pour "${search}"` : ''}
              </p>
            </div>

            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
                <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-gray-100">
                  <Search className="h-10 w-10 text-gray-300" />
                </div>
                <p className="font-semibold text-gray-600">Aucun restaurant trouvé</p>
                <button
                  onClick={clearFilters}
                  className="rounded-xl px-4 py-2 text-sm font-semibold text-brand-600 hover:bg-brand-50"
                >
                  Effacer les filtres
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                <AnimatePresence>
                  {filtered.map((r, idx) => (
                    <RestaurantCard
                      key={r.id}
                      restaurant={r}
                      idx={idx}
                      gradient={GRADIENT_POOL[idx % GRADIENT_POOL.length]}
                      onClick={() => router.push(`/restaurants/${r.id}`)}
                    />
                  ))}
                </AnimatePresence>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────

function FeaturedCard({ restaurant: r, idx, onClick }: { restaurant: Restaurant; idx: number; onClick: () => void }) {
  const gradient = GRADIENT_POOL[idx % GRADIENT_POOL.length];
  return (
    <motion.button
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: idx * 0.05 }}
      onClick={onClick}
      className="shrink-0 w-56 overflow-hidden rounded-2xl bg-white shadow-sm hover:shadow-md transition-shadow text-left"
    >
      <div className={`h-28 bg-gradient-to-br ${gradient} relative flex items-center justify-center`}>
        <span className="text-5xl font-black text-white/20 select-none">{r.name.charAt(0)}</span>
        {(r.deliveryFee ?? 1) === 0 && (
          <span className="absolute top-2 left-2 rounded-full bg-white/90 px-2 py-0.5 text-xs font-bold text-green-600">Livraison offerte</span>
        )}
      </div>
      <div className="p-3">
        <p className="font-bold text-gray-900 truncate">{r.name}</p>
        <p className="text-xs text-gray-400 mt-0.5">{r.cuisine}</p>
        <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
          {r.rating && <span>⭐ {r.rating}</span>}
          {r.deliveryTime && <span>🕐 {r.deliveryTime}</span>}
        </div>
      </div>
    </motion.button>
  );
}

function RestaurantCard({
  restaurant: r, idx, gradient, onClick,
}: {
  restaurant: Restaurant;
  idx: number;
  gradient: string;
  onClick: () => void;
}) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ delay: idx * 0.04 }}
      className={clsx(
        'group overflow-hidden rounded-2xl bg-white shadow-sm hover:shadow-md transition-shadow cursor-pointer',
        r.isOpen === false && 'opacity-60',
      )}
      onClick={onClick}
    >
      {/* Banner */}
      <div className={`relative h-40 bg-gradient-to-br ${gradient}`}>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-5xl font-black text-white/20 select-none">{r.name.charAt(0)}</span>
        </div>
        {/* Open / closed */}
        <div className="absolute left-3 top-3">
          {r.isOpen !== false ? (
            <span className="rounded-full bg-white/90 backdrop-blur-sm px-2.5 py-1 text-xs font-semibold text-green-600">Ouvert</span>
          ) : (
            <span className="rounded-full bg-white/90 backdrop-blur-sm px-2.5 py-1 text-xs font-semibold text-gray-500">Fermé</span>
          )}
        </div>
        {/* Free delivery badge */}
        {(r.deliveryFee ?? 1) === 0 && (
          <div className="absolute right-3 top-3">
            <span className="rounded-full bg-blue-500 px-2.5 py-1 text-xs font-bold text-white">🆓</span>
          </div>
        )}
      </div>

      {/* Body */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h3 className="font-bold text-gray-900 truncate">{r.name}</h3>
          {r.rating != null && r.rating > 0 && (
            <div className="flex items-center gap-1 shrink-0">
              <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
              <span className="text-sm font-bold text-gray-800">{r.rating}</span>
            </div>
          )}
        </div>

        {r.cuisine && (
          <span className="inline-block rounded-lg bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500 mb-3">
            {r.cuisine}
          </span>
        )}

        <div className="flex items-center gap-3 text-xs text-gray-500 mb-4">
          {r.deliveryTime && (
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />{r.deliveryTime}
            </span>
          )}
          {r.deliveryFee != null && (
            <span className="flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" />
              {r.deliveryFee === 0 ? 'Livraison offerte' : `${r.deliveryFee.toFixed(2)}€`}
            </span>
          )}
          {r.minOrder != null && r.minOrder > 0 && (
            <span className="flex items-center gap-1">
              <ShoppingBag className="h-3.5 w-3.5" />Min. {r.minOrder}€
            </span>
          )}
        </div>

        {/* Tags */}
        {r.tags && r.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {r.tags.slice(0, 2).map((tag) => (
              <span key={tag} className="rounded-full bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-600">{tag}</span>
            ))}
          </div>
        )}

        <button
          disabled={r.isOpen === false}
          className={clsx(
            'w-full rounded-xl py-2.5 text-sm font-bold transition-all',
            r.isOpen !== false
              ? 'hover:opacity-90'
              : 'cursor-not-allowed bg-gray-100 text-gray-400',
          )}
          style={r.isOpen !== false ? { backgroundColor: '#1EFF6A', color: '#000' } : undefined}
        >
          {r.isOpen !== false ? 'Commander' : 'Fermé'}
        </button>
      </div>
    </motion.div>
  );
}
