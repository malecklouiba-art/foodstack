'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Heart,
  ChevronRight,
  Star,
  Clock,
  ShoppingBag,
  UtensilsCrossed,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';
import { Button } from '@/components/ui/Button';
import api from '@/lib/api';

// ── Types ──────────────────────────────────────────────────────────────────

interface FavoriteRestaurant {
  id: string;
  name: string;
  cuisine: string;
  rating: number;
  deliveryTime: string;
  deliveryFee: number;
  minOrder: number;
  open: boolean;
  gradient: string;
}

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

// ── API response shape (may vary per backend) ────────────────────────────
interface ApiFavorite {
  id?: string;
  restaurantId?: string;
  restaurant?: {
    id?: string;
    name?: string;
    categories?: string[];
    settings?: { minOrderAmount?: number; estimatedPrepTime?: number; prepTime?: number; cuisine?: string; deliveryFee?: number };
    isOpen?: boolean;
    rating?: number;
  };
  name?: string;
  cuisine?: string;
  rating?: number;
  deliveryTime?: string;
  deliveryFee?: number;
  minOrder?: number;
  open?: boolean;
}

function normalizeFavorite(raw: ApiFavorite, idx: number): FavoriteRestaurant {
  const r = raw.restaurant ?? {};
  const id = r.id ?? raw.restaurantId ?? raw.id ?? String(idx);
  const name = r.name ?? raw.name ?? 'Restaurant';
  const cuisine = r.settings?.cuisine ?? r.categories?.[0] ?? raw.cuisine ?? '';
  const rating = r.rating ?? raw.rating ?? 0;
  const prepTime = r.settings?.prepTime ?? r.settings?.estimatedPrepTime ?? 25;
  const deliveryFee = r.settings?.deliveryFee ?? raw.deliveryFee ?? 0;
  const deliveryTime = raw.deliveryTime ?? `${prepTime}-${prepTime + 10}min`;
  const minOrder = r.settings?.minOrderAmount ?? raw.minOrder ?? 0;
  const open = r.isOpen ?? raw.open ?? false;
  const gradient = GRADIENT_POOL[idx % GRADIENT_POOL.length];
  return { id, name, cuisine, rating, deliveryTime, deliveryFee, minOrder, open, gradient };
}

// ── Component ─────────────────────────────────────────────────────────────

export default function FavoritesPage() {
  const router = useRouter();
  const [favorites, setFavorites] = useState<FavoriteRestaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Track IDs being removed to disable the button while in-flight
  const [removing, setRemoving] = useState<Set<string>>(new Set());
  // Track IDs being re-added
  const [adding, setAdding] = useState<Set<string>>(new Set());

  // ── Fetch ────────────────────────────────────────────────────────────────

  const fetchFavorites = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.get<ApiFavorite[]>('/users/favorites');
      const list = Array.isArray(data)
        ? (data as ApiFavorite[]).map(normalizeFavorite)
        : [];
      setFavorites(list);
    } catch (err: unknown) {
      const status = (err as { status?: number })?.status;
      if (status === 401) {
        // Interceptor already redirects; just set an empty list silently
        setFavorites([]);
      } else if (status === 404) {
        setFavorites([]);
      } else {
        setError('Impossible de charger vos favoris');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFavorites();
  }, [fetchFavorites]);

  // ── Remove favorite ───────────────────────────────────────────────────────

  async function removeFavorite(id: string) {
    // Optimistic update
    const previous = favorites;
    setFavorites((prev) => prev.filter((r) => r.id !== id));
    setRemoving((s) => new Set(s).add(id));

    try {
      await api.delete(`/users/favorites/${id}`);
    } catch (err: unknown) {
      const status = (err as { status?: number })?.status;
      // 404 → already removed on server, keep optimistic state
      if (status !== 404) {
        // Revert on other errors
        setFavorites(previous);
      }
    } finally {
      setRemoving((s) => {
        const next = new Set(s);
        next.delete(id);
        return next;
      });
    }
  }

  // ── Re-add favorite ───────────────────────────────────────────────────────

  async function addFavorite(restaurant: FavoriteRestaurant) {
    if (favorites.some((r) => r.id === restaurant.id)) return;
    // Optimistic update
    setFavorites((prev) => [...prev, restaurant]);
    setAdding((s) => new Set(s).add(restaurant.id));

    try {
      await api.post(`/users/favorites/${restaurant.id}`);
    } catch (err: unknown) {
      const status = (err as { status?: number })?.status;
      // 409 → already a favorite on server, keep optimistic state
      if (status !== 409) {
        // Revert on other errors
        setFavorites((prev) => prev.filter((r) => r.id !== restaurant.id));
      }
    } finally {
      setAdding((s) => {
        const next = new Set(s);
        next.delete(restaurant.id);
        return next;
      });
    }
  }

  // ── Navigate to restaurant menu ───────────────────────────────────────────

  function goToMenu(restaurant: FavoriteRestaurant) {
    if (!restaurant.open) return;
    router.push(`/restaurants/${restaurant.id}`);
  }

  // ── Loading skeleton ──────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white border-b border-gray-100 px-4 py-5 sm:px-6">
          <div className="mx-auto max-w-5xl">
            <div className="flex items-center gap-3">
              <div className="h-5 w-5 rounded-full bg-gray-200 animate-pulse" />
              <div className="h-4 w-4 rounded-full bg-gray-100 animate-pulse" />
              <div className="h-5 w-48 rounded-full bg-gray-200 animate-pulse" />
            </div>
          </div>
        </div>
        <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div key={n} className="rounded-2xl bg-white border border-gray-100 overflow-hidden shadow-sm">
                <div className="h-40 bg-gray-200 animate-pulse" />
                <div className="p-4 space-y-3">
                  <div className="h-5 w-32 rounded-full bg-gray-200 animate-pulse" />
                  <div className="h-4 w-20 rounded-full bg-gray-100 animate-pulse" />
                  <div className="h-10 w-full rounded-xl bg-gray-100 animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── Error state ───────────────────────────────────────────────────────────

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-5 px-4 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-red-100">
          <AlertCircle className="h-8 w-8 text-red-500" />
        </div>
        <div>
          <p className="text-lg font-bold text-gray-900">{error}</p>
          <p className="mt-1 text-sm text-gray-400">Impossible de charger vos favoris.</p>
        </div>
        <Button
          variant="primary"
          icon={<RefreshCw className="h-4 w-4" />}
          onClick={fetchFavorites}
        >
          Réessayer
        </Button>
      </div>
    );
  }

  // ── Main render ───────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 py-5 sm:px-6">
        <div className="mx-auto max-w-5xl">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-gray-400 hover:text-gray-600 transition-colors">
              <Heart className="h-5 w-5" />
            </Link>
            <ChevronRight className="h-4 w-4 text-gray-300" />
            <h1 className="text-lg font-bold text-gray-900">Mes restaurants favoris</h1>
            <span className="ml-1 rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-semibold text-gray-500">
              {favorites.length}
            </span>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
        {favorites.length === 0 ? (
          /* Empty state */
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center gap-4 py-24 text-center"
          >
            <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-gray-100">
              <UtensilsCrossed className="h-10 w-10 text-gray-300" />
            </div>
            <div>
              <p className="font-semibold text-gray-700">Vous n&apos;avez pas encore de favoris.</p>
              <p className="mt-1 text-sm text-gray-400">
                Ajoutez des restaurants pour les retrouver ici.
              </p>
            </div>
            <Link
              href="/menu"
              className="mt-2 flex items-center gap-1.5 rounded-xl px-5 py-2.5 text-sm font-semibold transition-opacity hover:opacity-90"
              style={{ backgroundColor: '#1EFF6A', color: '#000' }}
            >
              Découvrez nos restaurants
              <ChevronRight className="h-4 w-4" />
            </Link>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <AnimatePresence>
              {favorites.map((restaurant, idx) => (
                <motion.div
                  key={restaurant.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: idx * 0.05 }}
                  className={clsx(
                    'group rounded-2xl bg-white border border-gray-100 overflow-hidden shadow-sm hover:shadow-md transition-shadow',
                    !restaurant.open && 'opacity-60',
                  )}
                >
                  {/* Image placeholder */}
                  <div className={clsx('relative h-40 bg-gradient-to-br', restaurant.gradient)}>
                    {/* Open / Closed badge */}
                    <div className="absolute left-3 top-3">
                      {restaurant.open ? (
                        <span className="rounded-full bg-white/90 px-2.5 py-1 text-xs font-semibold text-green-600 backdrop-blur-sm">
                          Ouvert
                        </span>
                      ) : (
                        <span className="rounded-full bg-white/90 px-2.5 py-1 text-xs font-semibold text-gray-500 backdrop-blur-sm">
                          Fermé
                        </span>
                      )}
                    </div>

                    {/* Unfavorite button */}
                    <button
                      onClick={() => removeFavorite(restaurant.id)}
                      disabled={removing.has(restaurant.id)}
                      className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 shadow transition-transform hover:scale-110 backdrop-blur-sm disabled:opacity-50"
                      aria-label="Retirer des favoris"
                    >
                      <Heart className="h-4 w-4 fill-red-500 text-red-500" />
                    </button>

                    {/* Restaurant initial */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-4xl font-black text-white/30 select-none">
                        {restaurant.name.charAt(0)}
                      </span>
                    </div>
                  </div>

                  {/* Card body */}
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h2 className="font-bold text-gray-900">{restaurant.name}</h2>
                        {restaurant.cuisine && (
                          <span className="mt-0.5 inline-block rounded-lg bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500">
                            {restaurant.cuisine}
                          </span>
                        )}
                      </div>
                      {restaurant.rating > 0 && (
                        <div className="flex items-center gap-1 shrink-0">
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          <span className="text-sm font-semibold text-gray-800">{restaurant.rating}</span>
                        </div>
                      )}
                    </div>

                    <div className="mt-3 flex items-center gap-4 text-xs text-gray-500">
                      {restaurant.deliveryTime && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          {restaurant.deliveryTime}
                        </span>
                      )}
                      {restaurant.minOrder > 0 && (
                        <span className="flex items-center gap-1">
                          <ShoppingBag className="h-3.5 w-3.5" />
                          Min. {restaurant.minOrder}€
                        </span>
                      )}
                    </div>

                    <button
                      disabled={!restaurant.open || adding.has(restaurant.id)}
                      onClick={() => goToMenu(restaurant)}
                      className={clsx(
                        'mt-4 w-full rounded-xl py-2.5 text-sm font-bold transition-all',
                        restaurant.open && !adding.has(restaurant.id)
                          ? 'hover:opacity-90'
                          : 'cursor-not-allowed bg-gray-100 text-gray-400',
                      )}
                      style={
                        restaurant.open && !adding.has(restaurant.id)
                          ? { backgroundColor: '#1EFF6A', color: '#000' }
                          : undefined
                      }
                    >
                      {restaurant.open ? 'Commander' : 'Fermé'}
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
