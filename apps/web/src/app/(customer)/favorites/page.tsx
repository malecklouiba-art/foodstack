'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Heart, ChevronRight, Star, Clock, ShoppingBag, UtensilsCrossed } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';

// ── Types ──────────────────────────────────────────────────────────────────

interface Restaurant {
  id: string;
  name: string;
  cuisine: string;
  rating: number;
  deliveryTime: string;
  minOrder: number;
  open: boolean;
  gradient: string;
}

// ── Mock data ──────────────────────────────────────────────────────────────

const INITIAL_FAVORITES: Restaurant[] = [
  {
    id: 'r1', name: 'Burger Palace',  cuisine: 'Fast Food',    rating: 4.8,
    deliveryTime: '20-30min', minOrder: 15, open: true,
    gradient: 'from-orange-400 to-red-500',
  },
  {
    id: 'r2', name: 'Sushi Zen',      cuisine: 'Japonais',     rating: 4.9,
    deliveryTime: '25-35min', minOrder: 20, open: true,
    gradient: 'from-rose-400 to-pink-600',
  },
  {
    id: 'r3', name: 'Pizza Roma',     cuisine: 'Italien',      rating: 4.6,
    deliveryTime: '15-25min', minOrder: 12, open: true,
    gradient: 'from-green-400 to-emerald-600',
  },
  {
    id: 'r4', name: 'Thai Garden',    cuisine: 'Thaïlandais',  rating: 4.7,
    deliveryTime: '30-40min', minOrder: 18, open: false,
    gradient: 'from-yellow-400 to-orange-500',
  },
  {
    id: 'r5', name: 'Le Bistrot',     cuisine: 'Français',     rating: 4.5,
    deliveryTime: '20-30min', minOrder: 15, open: true,
    gradient: 'from-blue-400 to-indigo-600',
  },
  {
    id: 'r6', name: 'Tacos Express',  cuisine: 'Mexicain',     rating: 4.4,
    deliveryTime: '15-20min', minOrder: 10, open: true,
    gradient: 'from-purple-400 to-violet-600',
  },
];

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState<Restaurant[]>(INITIAL_FAVORITES);

  function removeFavorite(id: string) {
    setFavorites((prev) => prev.filter((r) => r.id !== id));
  }

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
              <p className="mt-1 text-sm text-gray-400">Ajoutez des restaurants pour les retrouver ici.</p>
            </div>
            <Link
              href="/menu"
              className="mt-2 flex items-center gap-1.5 rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
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
                  className={clsx('group rounded-2xl bg-white border border-gray-100 overflow-hidden shadow-sm hover:shadow-md transition-shadow', !restaurant.open && 'opacity-60')}
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
                      className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 shadow transition-transform hover:scale-110 backdrop-blur-sm"
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
                        <span className="mt-0.5 inline-block rounded-lg bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500">
                          {restaurant.cuisine}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span className="text-sm font-semibold text-gray-800">{restaurant.rating}</span>
                      </div>
                    </div>

                    <div className="mt-3 flex items-center gap-4 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        {restaurant.deliveryTime}
                      </span>
                      <span className="flex items-center gap-1">
                        <ShoppingBag className="h-3.5 w-3.5" />
                        Min. {restaurant.minOrder}€
                      </span>
                    </div>

                    <button
                      disabled={!restaurant.open}
                      className={clsx(
                        'mt-4 w-full rounded-xl py-2.5 text-sm font-bold transition-all',
                        restaurant.open
                          ? 'hover:opacity-90'
                          : 'cursor-not-allowed bg-gray-100 text-gray-400',
                      )}
                      style={restaurant.open ? { backgroundColor: '#1EFF6A', color: '#000' } : undefined}
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
