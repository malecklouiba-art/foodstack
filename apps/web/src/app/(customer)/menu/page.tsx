'use client';

import { useState } from 'react';
import { Search, Bell, MapPin, Star, Clock, Plus, ChevronRight, Flame } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { CartDrawer } from '@/components/cart/CartDrawer';
import { useCartStore } from '@/store/cart';

const categories = [
  { id: 'all',      label: 'Tout',     emoji: '🍽️' },
  { id: 'burgers',  label: 'Burgers',  emoji: '🍔' },
  { id: 'pizza',    label: 'Pizzas',   emoji: '🍕' },
  { id: 'salads',   label: 'Salades',  emoji: '🥗' },
  { id: 'sides',    label: 'Frites',   emoji: '🍟' },
  { id: 'drinks',   label: 'Boissons', emoji: '🥤' },
  { id: 'desserts', label: 'Desserts', emoji: '🍮' },
];

const menuItems = [
  { id: '1', menuItemId: 'mi-1', restaurantId: 'r-1', name: 'Classic Smash Burger', description: 'Double smash patty, cheddar fondu, sauce maison', price: 14.90, category: 'burgers', image: null, rating: 4.8, reviewCount: 234, prepTime: 12, tags: ['Bestseller'], allergens: ['gluten', 'lactose'], calories: 650 },
  { id: '2', menuItemId: 'mi-2', restaurantId: 'r-1', name: 'Truffle Cheeseburger', description: 'Beef wagyu, fromage de chèvre, huile de truffe', price: 22.50, category: 'burgers', image: null, rating: 4.9, reviewCount: 189, prepTime: 15, tags: ['Premium'], allergens: ['gluten', 'lactose'], calories: 780 },
  { id: '3', menuItemId: 'mi-3', restaurantId: 'r-1', name: 'Margherita Napoletana', description: 'Sauce tomate San Marzano, mozzarella, basilic', price: 13.90, category: 'pizza', image: null, rating: 4.7, reviewCount: 312, prepTime: 20, tags: ['Végétarien'], allergens: ['gluten', 'lactose'], calories: 820 },
  { id: '4', menuItemId: 'mi-4', restaurantId: 'r-1', name: 'Salade César Premium', description: 'Poulet grillé, romaine, parmesan, sauce César', price: 12.50, category: 'salads', image: null, rating: 4.6, reviewCount: 156, prepTime: 8, tags: ['Healthy'], allergens: ['gluten', 'lactose'], calories: 420 },
  { id: '5', menuItemId: 'mi-5', restaurantId: 'r-1', name: 'Frites Maison', description: 'Pommes de terre fraîches, fleur de sel', price: 4.50, category: 'sides', image: null, rating: 4.5, reviewCount: 445, prepTime: 8, tags: ['Vegan'], allergens: [], calories: 340 },
  { id: '6', menuItemId: 'mi-6', restaurantId: 'r-1', name: 'Tiramisu Classique', description: 'Mascarpone, espresso, biscuits Savoiardi', price: 7.50, category: 'desserts', image: null, rating: 4.9, reviewCount: 98, tags: ['Maison'], allergens: ['gluten', 'lactose'], calories: 380 },
  { id: '7', menuItemId: 'mi-7', restaurantId: 'r-1', name: 'Limonade Artisanale', description: 'Citrons pressés, menthe, sirop de canne', price: 4.90, category: 'drinks', image: null, rating: 4.7, reviewCount: 203, tags: ['Frais'], allergens: [], calories: 120 },
  { id: '8', menuItemId: 'mi-8', restaurantId: 'r-1', name: 'Diavola Épicée', description: 'Salami piquant, piment, mozzarella', price: 16.50, category: 'pizza', image: null, rating: 4.8, reviewCount: 174, tags: ['Épicé'], allergens: ['gluten', 'lactose'], calories: 920 },
  { id: '9', menuItemId: 'mi-9', restaurantId: 'r-1', name: 'Chicken Burger Crispy', description: 'Poulet frit croustillant, coleslaw, sauce sriracha', price: 13.90, category: 'burgers', image: null, rating: 4.7, reviewCount: 287, tags: ['Populaire'], allergens: ['gluten'], calories: 590 },
];

const EMOJI_BG: Record<string, string> = {
  burgers: 'bg-brand-100',
  pizza: 'bg-red-100',
  salads: 'bg-green-100',
  sides: 'bg-yellow-100',
  drinks: 'bg-blue-100',
  desserts: 'bg-pink-100',
  all: 'bg-gray-100',
};

type MenuItem = typeof menuItems[0];

function ItemDetailModal({ item, onClose, onAdd }: { item: MenuItem; onClose: () => void; onAdd: (item: MenuItem, qty: number) => void }) {
  const [qty, setQty] = useState(1);
  const emoji = categories.find(c => c.id === item.category)?.emoji ?? '🍽️';
  const bg = EMOJI_BG[item.category];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="w-full max-w-2xl rounded-t-3xl bg-white pb-safe"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Image area */}
          <div className={`flex h-48 items-center justify-center rounded-t-3xl text-7xl ${bg}`}>
            {emoji}
          </div>

          <div className="p-5">
            {/* Tags */}
            <div className="flex flex-wrap gap-1.5 mb-3">
              {item.tags.map(tag => (
                <span key={tag} className="rounded-full bg-brand-100 px-2.5 py-1 text-xs font-medium text-brand-600">{tag}</span>
              ))}
              {item.allergens.map(a => (
                <span key={a} className="rounded-full bg-orange-50 px-2.5 py-1 text-xs font-medium text-orange-600">⚠️ {a}</span>
              ))}
            </div>

            <h2 className="text-xl font-bold text-gray-900">{item.name}</h2>
            <p className="mt-1 text-sm text-gray-500">{item.description}</p>

            {/* Meta */}
            <div className="mt-3 flex items-center gap-4 text-xs text-gray-400">
              <span className="flex items-center gap-1">
                <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                <span className="font-semibold text-gray-700">{item.rating}</span>
                <span>({item.reviewCount} avis)</span>
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                {item.prepTime} min
              </span>
              {item.calories && (
                <span>{item.calories} kcal</span>
              )}
            </div>

            {/* Qty + Add */}
            <div className="mt-5 flex items-center gap-3">
              <div className="flex items-center gap-3 rounded-2xl border border-gray-200 px-4 py-2">
                <button onClick={() => setQty(q => Math.max(1, q - 1))} className="h-7 w-7 flex items-center justify-center rounded-full bg-gray-100 text-lg font-bold text-gray-700">−</button>
                <span className="w-5 text-center font-bold text-gray-900">{qty}</span>
                <button onClick={() => setQty(q => q + 1)} className="h-7 w-7 flex items-center justify-center rounded-full bg-brand-500 text-white font-bold">+</button>
              </div>
              <button
                onClick={() => { onAdd(item, qty); onClose(); }}
                className="flex-1 rounded-2xl bg-brand-500 py-3 text-sm font-bold text-white shadow-md shadow-brand active:scale-[0.98] transition-transform"
              >
                Ajouter · {(item.price * qty).toFixed(2)}€
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export default function MenuPage() {
  const [search, setSearch] = useState('');
  const [cat, setCat] = useState('all');
  const [cartOpen, setCartOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const { items, addItem, total } = useCartStore();
  const cartCount = items.reduce((a, i) => a + i.quantity, 0);

  const filtered = menuItems
    .filter((item) => (cat === 'all' || item.category === cat) &&
      (!search || item.name.toLowerCase().includes(search.toLowerCase())));

  const handleAdd = (item: MenuItem, qty = 1) => {
    for (let i = 0; i < qty; i++) {
      addItem({ id: `${item.menuItemId}-${Date.now()}-${i}`, menuItemId: item.menuItemId, restaurantId: item.restaurantId, name: item.name, price: item.price });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-white shadow-sm">
        <div className="mx-auto max-w-2xl px-4 py-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <MapPin className="h-3 w-3 text-brand-500" />
                <span>Livraison à</span>
              </div>
              <p className="text-sm font-semibold text-gray-900">Paris, France</p>
            </div>
            <button className="relative rounded-full bg-gray-100 p-2.5">
              <Bell className="h-5 w-5 text-gray-700" />
            </button>
          </div>

          {/* Search */}
          <div className="mt-3 flex items-center gap-2 rounded-2xl bg-gray-100 px-4 py-2.5">
            <Search className="h-4 w-4 text-gray-400 flex-shrink-0" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher un plat..."
              className="flex-1 bg-transparent text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none"
            />
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-2xl px-4 pb-32">
        {/* Promo banner */}
        <div className="mt-4 overflow-hidden rounded-3xl bg-gradient-to-r from-brand-500 to-brand-400 p-5 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-brand-100">Offre du jour</p>
              <h2 className="mt-1 text-xl font-bold leading-tight">
                Jusqu&apos;à 20% de<br />remise sur votre<br />restaurant favori
              </h2>
              <button className="mt-3 rounded-full bg-white px-4 py-1.5 text-sm font-semibold text-brand-500">
                Commander
              </button>
            </div>
            <div className="text-6xl">🌮</div>
          </div>
        </div>

        {/* Categories */}
        <div className="mt-5">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-gray-900">Catégories</h3>
            <button className="flex items-center gap-1 text-xs font-medium text-brand-500">
              Tout voir <ChevronRight className="h-3 w-3" />
            </button>
          </div>
          <div className="mt-3 flex gap-3 overflow-x-auto pb-1 no-scrollbar">
            {categories.map((c) => (
              <button
                key={c.id}
                onClick={() => setCat(c.id)}
                className="flex flex-shrink-0 flex-col items-center gap-1.5"
              >
                <div className={`relative flex h-14 w-14 items-center justify-center rounded-2xl text-2xl transition-all ${
                  cat === c.id
                    ? 'bg-brand-500 shadow-md shadow-brand'
                    : EMOJI_BG[c.id]
                }`}>
                  {cat === c.id && (
                    <motion.div layoutId="cat-bg" className="absolute inset-0 rounded-2xl bg-brand-500" />
                  )}
                  <span className="relative z-10">{c.emoji}</span>
                </div>
                <span className={`text-xs font-medium ${cat === c.id ? 'text-brand-500' : 'text-gray-600'}`}>
                  {c.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Popular section */}
        <div className="mt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Flame className="h-4 w-4 text-brand-500" />
              <h3 className="text-base font-bold text-gray-900">
                {cat === 'all' ? 'Populaires' : categories.find(c => c.id === cat)?.label}
              </h3>
            </div>
            <span className="text-xs text-gray-400">{filtered.length} plats</span>
          </div>

          <AnimatePresence mode="popLayout">
            <div className="mt-3 space-y-3">
              {filtered.length === 0 ? (
                <p className="py-10 text-center text-sm text-gray-400">Aucun résultat</p>
              ) : filtered.map((item, i) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.97 }}
                  transition={{ delay: i * 0.04 }}
                  className="flex gap-3 rounded-2xl bg-white p-3 shadow-sm cursor-pointer active:scale-[0.99] transition-transform"
                  onClick={() => setSelectedItem(item)}
                >
                  {/* Food emoji placeholder */}
                  <div className={`flex h-24 w-24 flex-shrink-0 items-center justify-center rounded-xl text-4xl ${EMOJI_BG[item.category]}`}>
                    {categories.find(c => c.id === item.category)?.emoji ?? '🍽️'}
                  </div>

                  <div className="flex flex-1 flex-col justify-between py-0.5">
                    <div>
                      {item.tags[0] && (
                        <span className="inline-block rounded-full bg-brand-100 px-2 py-0.5 text-xs font-medium text-brand-600">
                          {item.tags[0]}
                        </span>
                      )}
                      <h4 className="mt-1 text-sm font-semibold text-gray-900 leading-tight">{item.name}</h4>
                      <p className="mt-0.5 text-xs text-gray-400 line-clamp-1">{item.description}</p>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs text-gray-400">
                        <span className="flex items-center gap-0.5">
                          <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                          <span className="font-medium text-gray-700">{item.rating}</span>
                        </span>
                        <span>·</span>
                        <span className="flex items-center gap-0.5">
                          <Clock className="h-3 w-3" />
                          {item.prepTime} min
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-gray-900">{item.price.toFixed(2)}€</span>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleAdd(item); }}
                          className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-500 text-white shadow-sm shadow-brand active:scale-95 transition-transform"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </AnimatePresence>
        </div>
      </div>

      {/* Floating cart */}
      <AnimatePresence>
        {cartCount > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 80 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 80 }}
            className="fixed bottom-6 left-4 right-4 z-30 mx-auto max-w-2xl"
          >
            <button
              onClick={() => setCartOpen(true)}
              className="flex w-full items-center justify-between rounded-2xl bg-gray-900 px-5 py-4 text-white shadow-xl"
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-brand-500 text-xs font-bold">
                {cartCount}
              </span>
              <span className="font-semibold">Voir le panier</span>
              <span className="font-bold text-brand-400">{total().toFixed(2)}€</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {selectedItem && (
        <ItemDetailModal
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
          onAdd={handleAdd}
        />
      )}

      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
    </div>
  );
}
