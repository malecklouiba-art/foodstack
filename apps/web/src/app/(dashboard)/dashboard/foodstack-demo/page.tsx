'use client';

import { useState, useEffect } from 'react';
import {
  Star, Clock, MapPin, ShoppingBag,
  Leaf, Award, Truck, Tag, Heart,
  UtensilsCrossed, Plus, Minus, Check, Flame,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';
import api from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import { useRestaurantId } from '@/contexts/restaurant-context';

// ── Types ─────────────────────────────────────────────────────────────────────
interface ApiRestaurant {
  id: string;
  name: string;
  cuisine?: string | null;
  rating?: number | null;
  deliveryTime?: string | null;
  deliveryFee?: number | null;
  minOrder?: number | null;
  address?: string | null;
  isOpen?: boolean;
  logo?: string | null;
  tags?: string[];
}

interface ApiMenuItem {
  id: string;
  name: string;
  description?: string | null;
  price: number;
  calories?: number | null;
  isActive?: boolean;
  isFeatured?: boolean;
  dietaryTags?: string[];
  image?: string | null;
}

interface ApiCategory {
  id: string;
  name: string;
  items: ApiMenuItem[];
}

interface DemoItem {
  id: string;
  cat: string;
  name: string;
  desc: string;
  price: number;
  badge: string | null;
  emoji: string;
  kcal: number;
  vegan: boolean;
}

// ── Fallbacks ─────────────────────────────────────────────────────────────────
const FALLBACK_RESTAURANT: ApiRestaurant = {
  id: '',
  name: 'Le Gourmet Demo',
  cuisine: 'Cuisine française • Burgers • Pizzas',
  rating: 4.8,
  deliveryTime: '20–35 min',
  deliveryFee: 0,
  minOrder: 15,
  address: '12 rue de la Paix, Paris 2e',
  isOpen: true,
  tags: ['Top restaurant', 'Livraison rapide', 'Bio & Local'],
};

const FALLBACK_ITEMS: DemoItem[] = [
  { id: 'm1', cat: 'Burgers',  name: 'Burger Classic',    desc: 'Steak haché, cheddar, salade, tomate, cornichon',    price: 14.90, badge: 'best-seller', emoji: '🍔', kcal: 680, vegan: false },
  { id: 'm2', cat: 'Pizzas',   name: 'Margherita',        desc: 'Sauce tomate, mozzarella di bufala, basilic frais',  price: 13.50, badge: null,          emoji: '🍕', kcal: 540, vegan: false },
  { id: 'm3', cat: 'Salades',  name: 'Bowl Avocat',       desc: 'Avocat, quinoa, edamame, carotte, sauce sésame',     price: 13.90, badge: 'végan',       emoji: '🥗', kcal: 420, vegan: true  },
  { id: 'm4', cat: 'Desserts', name: 'Fondant Chocolat',  desc: 'Cœur coulant, glace vanille, coulis fruits rouges',  price: 7.90,  badge: 'best-seller', emoji: '🍫', kcal: 490, vegan: false },
  { id: 'm5', cat: 'Boissons', name: 'Limonade Maison',   desc: 'Citron pressé, menthe fraîche, sucre de canne',      price: 4.50,  badge: null,          emoji: '🍋', kcal: 120, vegan: false },
];

// ── Helpers ───────────────────────────────────────────────────────────────────
const EMOJI_BY_CATEGORY: Record<string, string> = {
  burger: '🍔', pizza: '🍕', salade: '🥗', dessert: '🍫', boisson: '🥤',
  sushi: '🍣', pasta: '🍝', sandwich: '🥪', soup: '🍜', default: '🍽️',
};

function categoryEmoji(catName: string): string {
  const key = catName.toLowerCase();
  for (const [k, v] of Object.entries(EMOJI_BY_CATEGORY)) {
    if (key.includes(k)) return v;
  }
  return EMOJI_BY_CATEGORY.default;
}

function itemEmoji(item: ApiMenuItem, catName: string): string {
  if (item.dietaryTags?.includes('vegan') || item.dietaryTags?.includes('vegetarian')) return '🥗';
  return categoryEmoji(catName);
}

function mapToDemoItem(item: ApiMenuItem, catName: string): DemoItem {
  const vegan = !!(item.dietaryTags?.includes('vegan'));
  let badge: string | null = null;
  if (item.isFeatured) badge = 'best-seller';
  if (vegan) badge = 'végan';
  return {
    id: item.id,
    cat: catName,
    name: item.name,
    desc: item.description ?? '',
    price: item.price,
    badge,
    emoji: itemEmoji(item, catName),
    kcal: item.calories ?? 0,
    vegan,
  };
}

const PROMO = { code: 'DEMO20', label: '-20% sur votre 1ère commande', color: 'bg-brand-500' };

const BADGE_STYLE: Record<string, string> = {
  'best-seller': 'bg-amber-50 text-amber-700 border border-amber-200',
  'nouveau':     'bg-blue-50 text-blue-700 border border-blue-200',
  'populaire':   'bg-purple-50 text-purple-700 border border-purple-200',
  'végan':       'bg-green-50 text-green-700 border border-green-200',
};

interface CartItem { id: string; name: string; price: number; qty: number; emoji: string; }

// ── Page ─────────────────────────────────────────────────────────────────────
export default function FoodStackDemoPage() {
  const ctxId = useRestaurantId();
  const authUser = useAuthStore((s) => s.user);

  const [restaurant, setRestaurant] = useState<ApiRestaurant>(FALLBACK_RESTAURANT);
  const [items, setItems] = useState<DemoItem[]>(FALLBACK_ITEMS);
  const [categories, setCategories] = useState<string[]>(['Tout', 'Populaires']);
  const [loading, setLoading] = useState(true);

  const [activeCategory, setActiveCategory] = useState('Tout');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [promoApplied, setPromoApplied] = useState(false);
  const [promoInput, setPromoInput] = useState('');
  const [favorited, setFavorited] = useState<Set<string>>(new Set());
  const [ordered, setOrdered] = useState(false);

  useEffect(() => {
    const restaurantId = ctxId || authUser?.restaurantIds?.[0];
    if (!restaurantId) { setLoading(false); return; }

    Promise.all([
      api.get(`/restaurants/${restaurantId}`) as Promise<ApiRestaurant>,
      api.get(`/menu?restaurantId=${restaurantId}`) as Promise<{ categories: ApiCategory[]; items: ApiMenuItem[] } | ApiCategory[]>,
    ])
      .then(([r, menuData]) => {
        setRestaurant(r);

        const rawCats: ApiCategory[] = Array.isArray(menuData)
          ? menuData
          : (menuData as { categories: ApiCategory[] }).categories ?? [];

        const activeItems = rawCats.flatMap((cat) =>
          (cat.items ?? [])
            .filter((it) => it.isActive !== false)
            .map((it) => mapToDemoItem(it, cat.name))
        );

        if (activeItems.length > 0) {
          const catNames = ['Tout', 'Populaires', ...rawCats.filter((c) => c.items?.some((i) => i.isActive !== false)).map((c) => c.name)];
          setItems(activeItems);
          setCategories(catNames);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [ctxId, authUser?.restaurantIds]);

  const visible = activeCategory === 'Tout'
    ? items
    : activeCategory === 'Populaires'
      ? items.filter((i) => i.badge === 'best-seller' || i.badge === 'populaire')
      : items.filter((i) => i.cat === activeCategory);

  const totalItems = cart.reduce((s, i) => s + i.qty, 0);
  const subtotal   = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const discount   = promoApplied ? subtotal * 0.2 : 0;

  const deliveryFeeNum = restaurant.deliveryFee ?? 0;
  const deliveryFeeLabel = deliveryFeeNum === 0 ? 'Livraison gratuite' : `${deliveryFeeNum.toFixed(2)} €`;

  function addToCart(item: DemoItem) {
    setCart((prev) => {
      const existing = prev.find((c) => c.id === item.id);
      return existing
        ? prev.map((c) => c.id === item.id ? { ...c, qty: c.qty + 1 } : c)
        : [...prev, { id: item.id, name: item.name, price: item.price, qty: 1, emoji: item.emoji }];
    });
  }

  function updateQty(id: string, delta: number) {
    setCart((prev) => prev.map((c) => c.id === id ? { ...c, qty: c.qty + delta } : c).filter((c) => c.qty > 0));
  }

  function applyPromo() {
    if (promoInput.toUpperCase() === PROMO.code) setPromoApplied(true);
  }

  function placeOrder() { setOrdered(true); setCart([]); setTimeout(() => setOrdered(false), 4000); }

  const qtyInCart = (id: string) => cart.find((c) => c.id === id)?.qty ?? 0;

  const badges = restaurant.tags?.slice(0, 3) ?? [];

  return (
    <div className="flex h-full flex-col overflow-hidden bg-gray-50">
      {/* Demo banner */}
      <div className="shrink-0 bg-brand-600 px-6 py-2 text-center text-xs font-semibold text-white">
        🎭 Mode démo — Boutique de démonstration FoodStack · Aucun paiement réel
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Main content */}
        <div className="flex-1 overflow-auto">
          {/* Restaurant hero */}
          <div className="bg-white border-b border-gray-100 px-6 py-6">
            <div className="mx-auto max-w-3xl">
              <div className="flex items-start gap-5">
                <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-400 to-brand-600 text-4xl shadow-lg">
                  {restaurant.logo ? (
                    <img src={restaurant.logo} alt={restaurant.name} className="h-full w-full rounded-2xl object-cover" />
                  ) : (
                    <UtensilsCrossed className="h-9 w-9 text-white" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h1 className="text-2xl font-black text-gray-900">
                        {loading ? <span className="inline-block h-7 w-48 animate-pulse rounded-lg bg-gray-200" /> : restaurant.name}
                      </h1>
                      <p className="text-sm text-gray-500">
                        {loading ? <span className="inline-block h-4 w-36 animate-pulse rounded bg-gray-100 mt-1" /> : (restaurant.cuisine ?? '—')}
                      </p>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-xs font-bold ${restaurant.isOpen ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {restaurant.isOpen ? 'Ouvert' : 'Fermé'}
                    </span>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-gray-600">
                    {restaurant.rating != null && (
                      <span className="flex items-center gap-1 font-semibold text-amber-600">
                        <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                        {restaurant.rating.toFixed(1)}
                      </span>
                    )}
                    {restaurant.deliveryTime && (
                      <span className="flex items-center gap-1"><Clock className="h-4 w-4 text-gray-400" />{restaurant.deliveryTime}</span>
                    )}
                    <span className="flex items-center gap-1 text-brand-600 font-semibold">
                      <Truck className="h-4 w-4" />{deliveryFeeLabel}
                    </span>
                    {restaurant.address && (
                      <span className="flex items-center gap-1"><MapPin className="h-4 w-4 text-gray-400" />{restaurant.address}</span>
                    )}
                    {(restaurant.minOrder ?? 0) > 0 && (
                      <span className="text-gray-500 text-xs">Min. {restaurant.minOrder} €</span>
                    )}
                  </div>
                  {badges.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {badges.map((b) => (
                        <span key={b} className="flex items-center gap-1 rounded-full bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-700">
                          <Award className="h-3 w-3" />{b}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Promo banner */}
              <div className={`mt-4 flex items-center justify-between rounded-2xl ${PROMO.color} px-4 py-3`}>
                <div className="flex items-center gap-2">
                  <Tag className="h-4 w-4 text-white" />
                  <span className="text-sm font-semibold text-white">{PROMO.label}</span>
                </div>
                <span className="rounded-lg bg-white/20 px-3 py-1 font-mono text-sm font-bold text-white">{PROMO.code}</span>
              </div>
            </div>
          </div>

          {/* Category nav */}
          <div className="sticky top-0 z-10 bg-white border-b border-gray-100 px-6 py-3">
            <div className="mx-auto max-w-3xl flex gap-2 overflow-x-auto no-scrollbar">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={clsx(
                    'shrink-0 rounded-xl px-4 py-2 text-sm font-medium transition-all',
                    activeCategory === cat ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  )}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Menu items */}
          <div className="mx-auto max-w-3xl px-6 py-6 space-y-3">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 rounded-2xl border border-gray-100 bg-white p-4">
                  <div className="h-16 w-16 shrink-0 animate-pulse rounded-xl bg-gray-200" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-40 animate-pulse rounded bg-gray-200" />
                    <div className="h-3 w-64 animate-pulse rounded bg-gray-100" />
                    <div className="h-4 w-16 animate-pulse rounded bg-gray-200" />
                  </div>
                </div>
              ))
            ) : (
              <AnimatePresence mode="popLayout">
                {visible.map((item) => {
                  const qty = qtyInCart(item.id);
                  return (
                    <motion.div
                      key={item.id}
                      layout
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      className="flex items-center gap-4 rounded-2xl border border-gray-100 bg-white p-4 hover:shadow-sm transition-shadow"
                    >
                      <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-gray-50 text-3xl">
                        {item.emoji}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start gap-2">
                          <p className="font-semibold text-gray-900">{item.name}</p>
                          {item.badge && (
                            <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${BADGE_STYLE[item.badge] ?? ''}`}>
                              {item.badge}
                            </span>
                          )}
                        </div>
                        {item.desc && <p className="mt-0.5 text-xs text-gray-500 line-clamp-1">{item.desc}</p>}
                        <div className="mt-1.5 flex items-center gap-3">
                          <span className="font-bold text-gray-900">{item.price.toFixed(2)} €</span>
                          {item.kcal > 0 && <span className="text-xs text-gray-400">{item.kcal} kcal</span>}
                          {item.vegan && <Leaf className="h-3.5 w-3.5 text-green-500" />}
                          {item.badge === 'best-seller' && <Flame className="h-3.5 w-3.5 text-orange-500" />}
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => setFavorited(prev => { const n = new Set(prev); n.has(item.id) ? n.delete(item.id) : n.add(item.id); return n; })}
                          className="p-1.5 text-gray-300 hover:text-red-400 transition-colors"
                        >
                          <Heart className={`h-4 w-4 ${favorited.has(item.id) ? 'fill-red-400 text-red-400' : ''}`} />
                        </button>
                        {qty === 0 ? (
                          <button
                            onClick={() => addToCart(item)}
                            className="flex items-center gap-1.5 rounded-xl bg-brand-500 px-3 py-2 text-sm font-semibold text-white hover:bg-brand-600 transition-colors"
                          >
                            <Plus className="h-4 w-4" /> Ajouter
                          </button>
                        ) : (
                          <div className="flex items-center gap-2 rounded-xl border border-gray-200 px-2 py-1.5">
                            <button onClick={() => updateQty(item.id, -1)} className="text-gray-500 hover:text-gray-800"><Minus className="h-4 w-4" /></button>
                            <span className="w-5 text-center text-sm font-bold">{qty}</span>
                            <button onClick={() => addToCart(item)} className="text-brand-600 hover:text-brand-700"><Plus className="h-4 w-4" /></button>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
                {visible.length === 0 && (
                  <div className="py-16 text-center text-gray-400">
                    <UtensilsCrossed className="mx-auto mb-3 h-10 w-10 opacity-30" />
                    <p className="text-sm">Aucun article dans cette catégorie</p>
                  </div>
                )}
              </AnimatePresence>
            )}
          </div>
        </div>

        {/* Cart sidebar */}
        <div className="w-80 shrink-0 border-l border-gray-100 bg-white flex flex-col overflow-hidden">
          <div className="border-b border-gray-100 px-5 py-4">
            <div className="flex items-center gap-2">
              <ShoppingBag className="h-4 w-4 text-brand-600" />
              <h2 className="font-bold text-gray-900">Panier</h2>
              {totalItems > 0 && (
                <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-500 px-1.5 text-xs font-bold text-white">
                  {totalItems}
                </span>
              )}
            </div>
          </div>

          <div className="flex-1 overflow-auto px-5 py-4">
            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
                <div className="text-4xl">🛒</div>
                <p className="text-sm font-medium text-gray-500">Votre panier est vide</p>
                <p className="text-xs text-gray-400">Ajoutez des articles depuis le menu</p>
              </div>
            ) : (
              <div className="space-y-3">
                {cart.map((item) => (
                  <div key={item.id} className="flex items-center gap-3">
                    <span className="text-2xl">{item.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-sm font-medium text-gray-900">{item.name}</p>
                      <p className="text-xs text-gray-400">{(item.price * item.qty).toFixed(2)} €</p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => updateQty(item.id, -1)} className="flex h-6 w-6 items-center justify-center rounded-full border border-gray-200 text-gray-500 hover:border-red-300 hover:text-red-500">
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="w-4 text-center text-sm font-bold">{item.qty}</span>
                      <button onClick={() => updateQty(item.id, +1)} className="flex h-6 w-6 items-center justify-center rounded-full border border-gray-200 text-gray-500 hover:border-brand-300 hover:text-brand-600">
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {cart.length > 0 && (
            <div className="border-t border-gray-100 px-5 py-4 space-y-3">
              {!promoApplied ? (
                <div className="flex gap-2">
                  <input
                    value={promoInput}
                    onChange={(e) => setPromoInput(e.target.value)}
                    placeholder="Code promo"
                    className="flex-1 rounded-xl border border-gray-200 px-3 py-2 text-xs focus:border-brand-400 focus:outline-none"
                  />
                  <button onClick={applyPromo} className="rounded-xl bg-gray-100 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-200">
                    Appliquer
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2 rounded-xl bg-green-50 px-3 py-2">
                  <Check className="h-3.5 w-3.5 text-green-600" />
                  <span className="text-xs font-semibold text-green-700">DEMO20 appliqué — -20%</span>
                </div>
              )}
              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between text-gray-600"><span>Sous-total</span><span>{subtotal.toFixed(2)} €</span></div>
                {promoApplied && <div className="flex justify-between text-green-600 font-semibold"><span>Réduction -20%</span><span>-{discount.toFixed(2)} €</span></div>}
                <div className="flex justify-between text-gray-600">
                  <span>Livraison</span>
                  <span className={deliveryFeeNum === 0 ? 'text-brand-600 font-semibold' : ''}>
                    {deliveryFeeNum === 0 ? 'Gratuite' : `${deliveryFeeNum.toFixed(2)} €`}
                  </span>
                </div>
                <div className="flex justify-between font-bold text-gray-900 border-t border-gray-100 pt-2">
                  <span>Total</span>
                  <span>{(subtotal - discount + deliveryFeeNum).toFixed(2)} €</span>
                </div>
              </div>
              <button
                onClick={placeOrder}
                className="w-full rounded-xl bg-brand-500 py-3 text-sm font-bold text-white hover:bg-brand-600 transition-colors"
              >
                Commander · {(subtotal - discount + deliveryFeeNum).toFixed(2)} €
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Order success toast */}
      <AnimatePresence>
        {ordered && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3 rounded-2xl bg-gray-900 px-6 py-4 shadow-2xl"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-500">
              <Check className="h-4 w-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-white">Commande passée ! 🎉</p>
              <p className="text-xs text-gray-400">
                Livraison estimée dans {restaurant.deliveryTime ?? '25 min'}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
