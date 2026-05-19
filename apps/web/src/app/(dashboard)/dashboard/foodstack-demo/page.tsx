'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Star, Clock, MapPin, ShoppingBag, ChevronRight, Flame,
  Leaf, Award, Truck, Tag, Heart, Search, Filter,
  UtensilsCrossed, Plus, Minus, X, Check,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';

// ── Demo data ─────────────────────────────────────────────────────────────────
const DEMO_RESTAURANT = {
  name: 'Le Gourmet Demo',
  cuisine: 'Cuisine française • Burgers • Pizzas',
  rating: 4.8,
  reviewCount: 312,
  deliveryTime: '20–35 min',
  deliveryFee: 'Livraison gratuite',
  minOrder: 15,
  address: '12 rue de la Paix, Paris 2e',
  cover: '🍽️',
  open: true,
  badges: ['Top restaurant', 'Livraison rapide', 'Bio & Local'],
};

const CATEGORIES = ['Tout', 'Populaires', 'Burgers', 'Pizzas', 'Salades', 'Desserts', 'Boissons'];

const MENU_ITEMS = [
  { id: 'm1', cat: 'Burgers',  name: 'Burger Classic',     desc: 'Steak haché, cheddar, salade, tomate, cornichon',    price: 14.90, badge: 'best-seller', emoji: '🍔', kcal: 680 },
  { id: 'm2', cat: 'Burgers',  name: 'Burger Truffe',      desc: 'Steak haché, truffe noire, comté affiné, roquette',  price: 19.90, badge: 'nouveau',     emoji: '🍔', kcal: 720 },
  { id: 'm3', cat: 'Pizzas',   name: 'Margherita',         desc: 'Sauce tomate, mozzarella di bufala, basilic frais',  price: 13.50, badge: null,          emoji: '🍕', kcal: 540 },
  { id: 'm4', cat: 'Pizzas',   name: 'Quatre Fromages',    desc: 'Mozzarella, gorgonzola, comté, chèvre',              price: 15.90, badge: 'populaire',   emoji: '🍕', kcal: 620 },
  { id: 'm5', cat: 'Salades',  name: 'Salade César',       desc: 'Poulet grillé, croûtons, parmesan, sauce césar',     price: 12.50, badge: null,          emoji: '🥗', kcal: 380 },
  { id: 'm6', cat: 'Salades',  name: 'Bowl Avocat',        desc: 'Avocat, quinoa, edamame, carotte, sauce sésame',     price: 13.90, badge: 'végan',       emoji: '🥗', kcal: 420 },
  { id: 'm7', cat: 'Desserts', name: 'Fondant Chocolat',   desc: 'Cœur coulant, glace vanille, coulis fruits rouges',  price: 7.90,  badge: 'best-seller', emoji: '🍫', kcal: 490 },
  { id: 'm8', cat: 'Desserts', name: 'Crème Brûlée',       desc: 'Recette traditionnelle, gousse de vanille de Madagascar', price: 6.50, badge: null,       emoji: '🍮', kcal: 350 },
  { id: 'm9', cat: 'Boissons', name: 'Limonade Maison',    desc: 'Citron pressé, menthe fraîche, sucre de canne',     price: 4.50,  badge: null,          emoji: '🍋', kcal: 120 },
  { id: 'm10',cat: 'Boissons', name: 'Smoothie Tropical',  desc: 'Mangue, ananas, coco, gingembre',                   price: 5.90,  badge: 'populaire',   emoji: '🥤', kcal: 210 },
];

const PROMO = { code: 'DEMO20', label: '-20% sur votre 1ère commande', color: 'bg-brand-500' };

interface CartItem { id: string; name: string; price: number; qty: number; emoji: string; }

// ── Badge ─────────────────────────────────────────────────────────────────────
const BADGE_STYLE: Record<string, string> = {
  'best-seller': 'bg-amber-50 text-amber-700 border border-amber-200',
  'nouveau':     'bg-blue-50 text-blue-700 border border-blue-200',
  'populaire':   'bg-purple-50 text-purple-700 border border-purple-200',
  'végan':       'bg-green-50 text-green-700 border border-green-200',
};

// ── Page ─────────────────────────────────────────────────────────────────────
export default function FoodStackDemoPage() {
  const [activeCategory, setActiveCategory] = useState('Tout');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [promoApplied, setPromoApplied] = useState(false);
  const [promoInput, setPromoInput] = useState('');
  const [favorited, setFavorited] = useState<Set<string>>(new Set());
  const [ordered, setOrdered] = useState(false);

  const visible = activeCategory === 'Tout' || activeCategory === 'Populaires'
    ? activeCategory === 'Populaires'
      ? MENU_ITEMS.filter((i) => i.badge === 'best-seller' || i.badge === 'populaire')
      : MENU_ITEMS
    : MENU_ITEMS.filter((i) => i.cat === activeCategory);

  const totalItems = cart.reduce((s, i) => s + i.qty, 0);
  const subtotal   = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const discount   = promoApplied ? subtotal * 0.2 : 0;
  const total      = subtotal - discount + 2.5;

  function addToCart(item: typeof MENU_ITEMS[0]) {
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
    if (promoInput.toUpperCase() === PROMO.code) { setPromoApplied(true); }
  }

  function placeOrder() { setOrdered(true); setCart([]); setTimeout(() => setOrdered(false), 4000); }

  const qtyInCart = (id: string) => cart.find((c) => c.id === id)?.qty ?? 0;

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
                  {DEMO_RESTAURANT.cover}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h1 className="text-2xl font-black text-gray-900">{DEMO_RESTAURANT.name}</h1>
                      <p className="text-sm text-gray-500">{DEMO_RESTAURANT.cuisine}</p>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-xs font-bold ${DEMO_RESTAURANT.open ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {DEMO_RESTAURANT.open ? 'Ouvert' : 'Fermé'}
                    </span>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-gray-600">
                    <span className="flex items-center gap-1 font-semibold text-amber-600">
                      <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                      {DEMO_RESTAURANT.rating} <span className="font-normal text-gray-400">({DEMO_RESTAURANT.reviewCount} avis)</span>
                    </span>
                    <span className="flex items-center gap-1"><Clock className="h-4 w-4 text-gray-400" />{DEMO_RESTAURANT.deliveryTime}</span>
                    <span className="flex items-center gap-1 text-brand-600 font-semibold"><Truck className="h-4 w-4" />{DEMO_RESTAURANT.deliveryFee}</span>
                    <span className="flex items-center gap-1"><MapPin className="h-4 w-4 text-gray-400" />{DEMO_RESTAURANT.address}</span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {DEMO_RESTAURANT.badges.map((b) => (
                      <span key={b} className="flex items-center gap-1 rounded-full bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-700">
                        <Award className="h-3 w-3" />{b}
                      </span>
                    ))}
                  </div>
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
              {CATEGORIES.map((cat) => (
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
                          <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${BADGE_STYLE[item.badge]}`}>
                            {item.badge}
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 text-xs text-gray-500 line-clamp-1">{item.desc}</p>
                      <div className="mt-1.5 flex items-center gap-3">
                        <span className="font-bold text-gray-900">{item.price.toFixed(2)} €</span>
                        <span className="text-xs text-gray-400">{item.kcal} kcal</span>
                        {item.badge === 'végan' && <Leaf className="h-3.5 w-3.5 text-green-500" />}
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
            </AnimatePresence>
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
              {/* Promo code */}
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
              {/* Summary */}
              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between text-gray-600"><span>Sous-total</span><span>{subtotal.toFixed(2)} €</span></div>
                {promoApplied && <div className="flex justify-between text-green-600 font-semibold"><span>Réduction -20%</span><span>-{discount.toFixed(2)} €</span></div>}
                <div className="flex justify-between text-gray-600"><span>Livraison</span><span className="text-brand-600 font-semibold">Gratuite</span></div>
                <div className="flex justify-between font-bold text-gray-900 border-t border-gray-100 pt-2"><span>Total</span><span>{(subtotal - discount).toFixed(2)} €</span></div>
              </div>
              <button
                onClick={placeOrder}
                className="w-full rounded-xl bg-brand-500 py-3 text-sm font-bold text-white hover:bg-brand-600 transition-colors"
              >
                Commander · {(subtotal - discount).toFixed(2)} €
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
              <p className="text-xs text-gray-400">Livraison estimée dans 25 min</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
