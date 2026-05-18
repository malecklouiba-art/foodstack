'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, Star, Clock, MapPin, Heart, Share2,
  Plus, Minus, ChevronRight, Info, Search, Flame,
  ShoppingBag, X, Phone,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { useCartStore } from '@/store/cart';
import { CartDrawer } from '@/components/cart/CartDrawer';
import api from '@/lib/api';

// ── Types ─────────────────────────────────────────────────────────────────────

interface Restaurant {
  id: string;
  name: string;
  description?: string;
  cuisine?: string;
  coverImage?: string;
  logo?: string;
  rating?: number;
  reviewCount?: number;
  deliveryTime?: number;
  deliveryFee?: number;
  minOrder?: number;
  isOpen?: boolean;
  address?: string;
  phone?: string;
  openingHours?: string;
  tags?: string[];
}

interface MenuItem {
  id: string;
  name: string;
  description?: string;
  price: number;
  image?: string;
  isAvailable?: boolean;
  isPopular?: boolean;
  calories?: number;
  allergens?: string[];
  categoryId?: string;
}

interface MenuCategory {
  id: string;
  name: string;
  description?: string;
  items: MenuItem[];
}

// ── Mock data fallback ─────────────────────────────────────────────────────────

function makeMockRestaurant(id: string): Restaurant {
  return {
    id,
    name: 'Burger Palace',
    description: 'Les meilleurs burgers artisanaux de Paris, préparés avec des ingrédients frais et locaux.',
    cuisine: 'Américain',
    rating: 4.7,
    reviewCount: 842,
    deliveryTime: 25,
    deliveryFee: 2.5,
    minOrder: 12,
    isOpen: true,
    address: '42 rue de la République, 75011 Paris',
    phone: '01 42 33 44 55',
    openingHours: '11h30 – 23h00',
    tags: ['Burger', 'Fast-food', 'Américain'],
    coverImage: '',
    logo: '',
  };
}

const MOCK_MENU: MenuCategory[] = [
  {
    id: 'c1',
    name: '🔥 Populaires',
    items: [
      { id: 'i1', name: 'Classic Burger', description: 'Steak haché, cheddar, laitue, tomate, cornichons, sauce maison', price: 14.90, isPopular: true, calories: 650, categoryId: 'c1' },
      { id: 'i2', name: 'Truffle Burger', description: 'Steak Angus, cheddar affiné, champignons, huile de truffe', price: 22.50, isPopular: true, calories: 720, categoryId: 'c1' },
      { id: 'i3', name: 'Veggie Burger', description: 'Steak de légumes, avocat, roquette, sauce yaourt-citron', price: 13.50, calories: 480, categoryId: 'c1' },
    ],
  },
  {
    id: 'c2',
    name: '🍟 Accompagnements',
    items: [
      { id: 'i4', name: 'Frites maison', description: 'Frites fraîches, sel de mer, romarin', price: 4.50, calories: 380, categoryId: 'c2' },
      { id: 'i5', name: 'Onion rings', description: 'Oignons caramélisés panés, sauce barbecue', price: 5.50, calories: 420, categoryId: 'c2' },
      { id: 'i6', name: 'Coleslaw', description: 'Salade crémeuse de chou, carottes, mayo citron', price: 3.90, calories: 180, categoryId: 'c2' },
    ],
  },
  {
    id: 'c3',
    name: '🥤 Boissons',
    items: [
      { id: 'i7', name: 'Coca-Cola', price: 3.50, calories: 150, categoryId: 'c3' },
      { id: 'i8', name: 'Limonade artisanale', description: 'Citron, menthe, eau gazeuse', price: 4.50, calories: 90, categoryId: 'c3' },
      { id: 'i9', name: 'Milkshake vanille', description: 'Glace artisanale, lait entier', price: 6.50, calories: 520, categoryId: 'c3' },
    ],
  },
  {
    id: 'c4',
    name: '🍮 Desserts',
    items: [
      { id: 'i10', name: 'Brownie fondant', description: 'Chocolat noir 70%, noix de pécan', price: 5.90, calories: 430, categoryId: 'c4' },
      { id: 'i11', name: 'Cheesecake NY', description: 'Fromage à la crème, coulis de fruits rouges', price: 6.90, calories: 480, categoryId: 'c4' },
    ],
  },
];

// ── Sub-components ─────────────────────────────────────────────────────────────

function QuantityBadge({ count, onAdd, onRemove }: { count: number; onAdd: () => void; onRemove: () => void }) {
  if (count === 0) {
    return (
      <button
        onClick={onAdd}
        className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-500 text-black shadow-md shadow-brand-500/30 transition-transform active:scale-90 hover:bg-brand-400"
      >
        <Plus className="h-5 w-5" />
      </button>
    );
  }
  return (
    <div className="flex items-center gap-2">
      <button onClick={onRemove} className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-600 hover:bg-gray-50">
        <Minus className="h-4 w-4" />
      </button>
      <span className="w-4 text-center text-sm font-bold text-gray-900">{count}</span>
      <button onClick={onAdd} className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-500 text-black hover:bg-brand-400">
        <Plus className="h-4 w-4" />
      </button>
    </div>
  );
}

function MenuItemCard({ item, restaurantId, restaurantName }: { item: MenuItem; restaurantId: string; restaurantName: string }) {
  const { items: cartItems, addItem, removeItem } = useCartStore();
  const count = cartItems.filter((c) => c.menuItemId === item.id).length;

  const handleAdd = () => {
    addItem({
      id: `${restaurantId}-${item.id}-${Date.now()}`,
      menuItemId: item.id,
      restaurantId,
      name: item.name,
      price: item.price,
    });
  };

  const handleRemove = () => {
    const last = [...cartItems].reverse().find((c) => c.menuItemId === item.id);
    if (last) removeItem(last.id);
  };

  return (
    <motion.div
      layout
      className="flex items-start gap-4 rounded-2xl bg-white p-4 shadow-sm"
    >
      {/* Image placeholder */}
      <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-xl bg-gradient-to-br from-brand-50 to-brand-100">
        {item.image ? (
          <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-3xl">
            🍔
          </div>
        )}
        {item.isPopular && (
          <div className="absolute left-1 top-1 flex items-center gap-0.5 rounded-full bg-amber-400 px-1.5 py-0.5 text-[9px] font-bold text-white">
            <Flame className="h-2.5 w-2.5" /> Pop
          </div>
        )}
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-gray-900">{item.name}</p>
        {item.description && (
          <p className="mt-0.5 text-xs leading-relaxed text-gray-500 line-clamp-2">{item.description}</p>
        )}
        <div className="mt-1.5 flex items-center gap-3">
          <span className="text-base font-bold text-gray-900">{item.price.toFixed(2)} €</span>
          {item.calories != null && (
            <span className="text-xs text-gray-400">{item.calories} kcal</span>
          )}
        </div>
      </div>

      {/* Quantity */}
      <div className="flex-shrink-0 self-center">
        <QuantityBadge count={count} onAdd={handleAdd} onRemove={handleRemove} />
      </div>
    </motion.div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function RestaurantDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params.id;

  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [menu, setMenu] = useState<MenuCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>('');
  const [search, setSearch] = useState('');
  const [cartOpen, setCartOpen] = useState(false);

  const categoryRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const { items: cartItems } = useCartStore();

  const cartCount = cartItems.reduce((sum, i) => sum + (i.quantity ?? 1), 0);

  const load = useCallback(async () => {
    try {
      const [r, m] = await Promise.all([
        api.get(`/restaurants/${id}`) as Promise<Restaurant>,
        api.get(`/menu?restaurantId=${id}`) as Promise<any>,
      ]);
      setRestaurant(r as Restaurant);
      const cats = (m as any).categories ?? m;
      setMenu(Array.isArray(cats) ? cats : []);
    } catch {
      setRestaurant(makeMockRestaurant(id));
      setMenu(MOCK_MENU);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  // Set initial active category
  useEffect(() => {
    if (menu.length > 0 && !activeCategory) {
      setActiveCategory(menu[0].id);
    }
  }, [menu, activeCategory]);

  const filteredMenu = search.trim()
    ? menu.map((cat) => ({
        ...cat,
        items: cat.items.filter(
          (item) =>
            item.name.toLowerCase().includes(search.toLowerCase()) ||
            item.description?.toLowerCase().includes(search.toLowerCase()),
        ),
      })).filter((cat) => cat.items.length > 0)
    : menu;

  const scrollToCategory = (catId: string) => {
    setActiveCategory(catId);
    categoryRefs.current[catId]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Skeleton header */}
        <div className="h-52 animate-pulse bg-gray-200" />
        <div className="mx-auto max-w-2xl px-4 py-6 space-y-4">
          <div className="h-8 w-48 animate-pulse rounded-xl bg-gray-200" />
          <div className="h-4 w-72 animate-pulse rounded-xl bg-gray-200" />
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex gap-4">
              <div className="h-20 w-20 flex-shrink-0 animate-pulse rounded-2xl bg-gray-200" />
              <div className="flex-1 space-y-2 pt-1">
                <div className="h-4 w-32 animate-pulse rounded bg-gray-200" />
                <div className="h-3 w-48 animate-pulse rounded bg-gray-200" />
                <div className="h-4 w-16 animate-pulse rounded bg-gray-200" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!restaurant) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── Cover image ── */}
      <div className="relative h-52 overflow-hidden bg-gradient-to-br from-brand-400 to-brand-600">
        {restaurant.coverImage && (
          <img src={restaurant.coverImage} alt={restaurant.name} className="h-full w-full object-cover opacity-70" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

        {/* Nav buttons */}
        <div className="absolute left-4 top-safe-top flex gap-2 pt-4">
          <button
            onClick={() => router.back()}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-gray-700 shadow backdrop-blur-sm hover:bg-white"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
        </div>
        <div className="absolute right-4 top-safe-top flex gap-2 pt-4">
          <button
            onClick={() => { setIsFavorite((v) => !v); toast.success(isFavorite ? 'Retiré des favoris' : 'Ajouté aux favoris'); }}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white/90 shadow backdrop-blur-sm hover:bg-white"
          >
            <Heart className={`h-5 w-5 transition-colors ${isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-600'}`} />
          </button>
          <button
            onClick={() => { navigator.clipboard?.writeText(window.location.href); toast.success('Lien copié !'); }}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white/90 shadow backdrop-blur-sm hover:bg-white"
          >
            <Share2 className="h-5 w-5 text-gray-600" />
          </button>
        </div>

        {/* Restaurant info overlay */}
        <div className="absolute bottom-4 left-4 right-4">
          <div className="flex items-end gap-3">
            {restaurant.logo ? (
              <img src={restaurant.logo} alt="" className="h-14 w-14 rounded-2xl border-2 border-white object-cover shadow-md" />
            ) : (
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl border-2 border-white bg-white text-2xl shadow-md">🍔</div>
            )}
            <div className="min-w-0 flex-1">
              <h1 className="text-xl font-black text-white drop-shadow">{restaurant.name}</h1>
              <p className="text-sm text-white/80">{restaurant.cuisine}</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Info bar ── */}
      <div className="bg-white border-b border-gray-100 shadow-sm">
        <div className="mx-auto max-w-2xl px-4 py-3">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
            {restaurant.isOpen !== undefined && (
              <span className={`flex items-center gap-1 text-sm font-semibold ${restaurant.isOpen ? 'text-green-600' : 'text-red-500'}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${restaurant.isOpen ? 'bg-green-500' : 'bg-red-400'}`} />
                {restaurant.isOpen ? 'Ouvert' : 'Fermé'}
              </span>
            )}
            {restaurant.rating != null && (
              <span className="flex items-center gap-1 text-sm text-gray-700">
                <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                <strong>{restaurant.rating}</strong>
                {restaurant.reviewCount && <span className="text-gray-400">({restaurant.reviewCount})</span>}
              </span>
            )}
            {restaurant.deliveryTime != null && (
              <span className="flex items-center gap-1 text-sm text-gray-600">
                <Clock className="h-3.5 w-3.5 text-gray-400" />
                {restaurant.deliveryTime} min
              </span>
            )}
            {restaurant.deliveryFee != null && (
              <span className="text-sm text-gray-600">
                Livraison {restaurant.deliveryFee === 0 ? <strong className="text-green-600">offerte</strong> : `${restaurant.deliveryFee.toFixed(2)} €`}
              </span>
            )}
            {restaurant.minOrder != null && (
              <span className="text-sm text-gray-500">Min. {restaurant.minOrder} €</span>
            )}
          </div>

          {restaurant.address && (
            <div className="mt-1.5 flex items-center gap-1 text-xs text-gray-400">
              <MapPin className="h-3 w-3" />
              <span>{restaurant.address}</span>
              {restaurant.phone && (
                <>
                  <span className="mx-1.5 text-gray-200">·</span>
                  <Phone className="h-3 w-3" />
                  <span>{restaurant.phone}</span>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Category nav + search ── */}
      <div className="sticky top-0 z-20 bg-white border-b border-gray-100 shadow-sm">
        <div className="mx-auto max-w-2xl">
          {/* Search */}
          <div className="px-4 pt-3 pb-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher dans le menu…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2.5 pl-9 pr-4 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-400/20"
              />
              {search && (
                <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2">
                  <X className="h-4 w-4 text-gray-400" />
                </button>
              )}
            </div>
          </div>

          {/* Category chips */}
          {!search && (
            <div className="flex gap-2 overflow-x-auto px-4 pb-3 scrollbar-hide">
              {menu.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => scrollToCategory(cat.id)}
                  className={`whitespace-nowrap rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all ${
                    activeCategory === cat.id
                      ? 'bg-brand-500 text-black'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Menu ── */}
      <div className="mx-auto max-w-2xl px-4 pb-32 pt-4 space-y-8">
        {filteredMenu.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Search className="h-10 w-10 text-gray-200 mb-3" />
            <p className="font-medium text-gray-500">Aucun résultat pour « {search} »</p>
            <button onClick={() => setSearch('')} className="mt-3 text-sm text-brand-600 hover:underline">Effacer la recherche</button>
          </div>
        )}

        {filteredMenu.map((cat) => (
          <div
            key={cat.id}
            ref={(el) => { categoryRefs.current[cat.id] = el; }}
          >
            <h2 className="mb-3 text-base font-black text-gray-900">{cat.name}</h2>
            <div className="space-y-3">
              {cat.items.map((item) => (
                <MenuItemCard
                  key={item.id}
                  item={item}
                  restaurantId={id}
                  restaurantName={restaurant.name}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* ── Cart FAB ── */}
      <AnimatePresence>
        {cartCount > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 80 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 80 }}
            className="fixed bottom-6 left-1/2 z-30 -translate-x-1/2"
          >
            <button
              onClick={() => setCartOpen(true)}
              className="flex items-center gap-3 rounded-2xl bg-brand-500 px-6 py-4 text-black shadow-xl shadow-brand-500/40 hover:bg-brand-400 transition-all"
            >
              <div className="relative">
                <ShoppingBag className="h-5 w-5" />
                <span className="absolute -right-2 -top-2 flex h-4 w-4 items-center justify-center rounded-full bg-black text-[10px] font-black text-brand-500">
                  {cartCount}
                </span>
              </div>
              <span className="font-bold">Voir le panier</span>
              <span className="font-bold">
                {cartItems.reduce((s, i) => s + i.price, 0).toFixed(2)} €
              </span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
    </div>
  );
}
