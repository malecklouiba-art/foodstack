'use client';

import { useState } from 'react';
import { Search, SlidersHorizontal, Star, Clock, ChevronDown, Filter } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { MenuItemCard } from '@/components/menu/MenuItemCard';
import { CategoryFilter } from '@/components/menu/CategoryFilter';
import { CartDrawer } from '@/components/cart/CartDrawer';
import { Navbar } from '@/components/layout/Navbar';
import { useCartStore } from '@/store/cart';

const categories = [
  { id: 'all', label: 'Tout', count: 48 },
  { id: 'burgers', label: 'Burgers', count: 12 },
  { id: 'pizza', label: 'Pizzas', count: 8 },
  { id: 'salads', label: 'Salades', count: 6 },
  { id: 'sides', label: 'Accompagnements', count: 8 },
  { id: 'drinks', label: 'Boissons', count: 10 },
  { id: 'desserts', label: 'Desserts', count: 4 },
];

const menuItems = [
  {
    id: '1',
    menuItemId: 'mi-1',
    restaurantId: 'r-1',
    name: 'Classic Smash Burger',
    description: 'Double smash patty, cheddar fondu, salade croquante, tomate fraîche, cornichons, sauce maison',
    price: 14.90,
    category: 'burgers',
    image: null,
    rating: 4.8,
    reviewCount: 234,
    prepTime: 12,
    tags: ['Bestseller', 'Populaire'],
    allergens: ['gluten', 'lactose', 'oeufs'],
    calories: 650,
  },
  {
    id: '2',
    menuItemId: 'mi-2',
    restaurantId: 'r-1',
    name: 'Truffle Cheeseburger',
    description: 'Beef wagyu, fromage de chèvre, huile de truffe, roquette, oignon caramélisé',
    price: 22.50,
    category: 'burgers',
    image: null,
    rating: 4.9,
    reviewCount: 189,
    prepTime: 15,
    tags: ['Premium', 'Nouveau'],
    allergens: ['gluten', 'lactose'],
    calories: 780,
  },
  {
    id: '3',
    menuItemId: 'mi-3',
    restaurantId: 'r-1',
    name: 'Margherita Napoletana',
    description: 'Sauce tomate San Marzano, mozzarella fior di latte, basilic frais, huile d\'olive',
    price: 13.90,
    category: 'pizza',
    image: null,
    rating: 4.7,
    reviewCount: 312,
    prepTime: 20,
    tags: ['Végétarien'],
    allergens: ['gluten', 'lactose'],
    calories: 820,
  },
  {
    id: '4',
    menuItemId: 'mi-4',
    restaurantId: 'r-1',
    name: 'Salade César Premium',
    description: 'Poulet grillé, laitue romaine, croûtons artisanaux, parmesan 24 mois, sauce César maison',
    price: 12.50,
    category: 'salads',
    image: null,
    rating: 4.6,
    reviewCount: 156,
    prepTime: 8,
    tags: ['Healthy'],
    allergens: ['gluten', 'lactose', 'oeufs', 'poisson'],
    calories: 420,
  },
  {
    id: '5',
    menuItemId: 'mi-5',
    restaurantId: 'r-1',
    name: 'Frites Maison',
    description: 'Pommes de terre fraîches, fleur de sel, herbes de Provence',
    price: 4.50,
    category: 'sides',
    image: null,
    rating: 4.5,
    reviewCount: 445,
    prepTime: 8,
    tags: ['Vegan'],
    allergens: [],
    calories: 340,
  },
  {
    id: '6',
    menuItemId: 'mi-6',
    restaurantId: 'r-1',
    name: 'Tiramisu Classique',
    description: 'Mascarpone onctueux, espresso, biscuits Savoiardi, cacao amer',
    price: 7.50,
    category: 'desserts',
    image: null,
    rating: 4.9,
    reviewCount: 98,
    prepTime: 5,
    tags: ['Maison'],
    allergens: ['gluten', 'lactose', 'oeufs'],
    calories: 380,
  },
  {
    id: '7',
    menuItemId: 'mi-7',
    restaurantId: 'r-1',
    name: 'Limonade Artisanale',
    description: 'Citrons frais pressés, menthe fraîche, sirop de canne, eau pétillante',
    price: 4.90,
    category: 'drinks',
    image: null,
    rating: 4.7,
    reviewCount: 203,
    prepTime: 3,
    tags: ['Frais', 'Sans alcool'],
    allergens: [],
    calories: 120,
  },
  {
    id: '8',
    menuItemId: 'mi-8',
    restaurantId: 'r-1',
    name: 'Diavola Épicée',
    description: 'Sauce tomate, mozzarella, salami piquant, piment, huile d\'olive pimentée',
    price: 16.50,
    category: 'pizza',
    image: null,
    rating: 4.8,
    reviewCount: 174,
    prepTime: 20,
    tags: ['Épicé'],
    allergens: ['gluten', 'lactose'],
    calories: 920,
  },
];

export default function MenuPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [cartOpen, setCartOpen] = useState(false);
  const [sortBy, setSortBy] = useState<'popular' | 'rating' | 'price_asc' | 'price_desc'>('popular');
  const cartCount = useCartStore((s) => s.items.reduce((acc, i) => acc + i.quantity, 0));

  const filteredItems = menuItems
    .filter((item) => {
      const matchesSearch =
        !searchQuery ||
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = activeCategory === 'all' || item.category === activeCategory;
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      if (sortBy === 'rating') return b.rating - a.rating;
      if (sortBy === 'price_asc') return a.price - b.price;
      if (sortBy === 'price_desc') return b.price - a.price;
      return b.reviewCount - a.reviewCount;
    });

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-surface-50">
        {/* Restaurant header */}
        <div className="bg-gradient-to-br from-surface-900 to-surface-800 px-4 py-12 text-white sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm text-3xl">
                🍔
              </div>
              <div>
                <h1 className="text-2xl font-bold sm:text-3xl">Le Comptoir Moderne</h1>
                <div className="mt-1 flex flex-wrap items-center gap-3">
                  <span className="flex items-center gap-1 text-sm text-white/80">
                    <Star className="h-3.5 w-3.5 fill-brand-400 text-brand-400" />
                    4.8 (634 avis)
                  </span>
                  <span className="text-white/40">·</span>
                  <span className="flex items-center gap-1 text-sm text-white/80">
                    <Clock className="h-3.5 w-3.5" />
                    20–35 min
                  </span>
                  <span className="text-white/40">·</span>
                  <Badge variant="success" size="sm">Ouvert</Badge>
                  <span className="text-white/40">·</span>
                  <span className="text-sm text-white/80">Livraison gratuite dès 30€</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          {/* Search & Sort */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="max-w-md flex-1">
              <Input
                placeholder="Rechercher un plat..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                leftIcon={<Search className="h-4 w-4" />}
              />
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" icon={<Filter className="h-4 w-4" />}>
                Filtres
              </Button>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                className="rounded-xl border border-surface-200 bg-white px-3 py-2 text-sm text-surface-700 focus:border-brand-500 focus:outline-none"
              >
                <option value="popular">Les plus populaires</option>
                <option value="rating">Mieux notés</option>
                <option value="price_asc">Prix croissant</option>
                <option value="price_desc">Prix décroissant</option>
              </select>
            </div>
          </div>

          {/* Category filter */}
          <CategoryFilter
            categories={categories}
            active={activeCategory}
            onChange={setActiveCategory}
          />

          {/* Items grid */}
          <div className="mt-6">
            {filteredItems.length === 0 ? (
              <div className="py-16 text-center">
                <p className="text-surface-400">Aucun article trouvé pour votre recherche.</p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                <AnimatePresence mode="popLayout">
                  {filteredItems.map((item, index) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.2, delay: index * 0.05 }}
                    >
                      <MenuItemCard item={item} onCartOpen={() => setCartOpen(true)} />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>

        {/* Floating cart button */}
        {cartCount > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="fixed bottom-6 left-1/2 z-30 -translate-x-1/2"
          >
            <button
              onClick={() => setCartOpen(true)}
              className="flex items-center gap-3 rounded-2xl bg-surface-900 px-6 py-4 text-white shadow-glass-lg transition-all hover:bg-surface-800"
            >
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-500 text-xs font-bold">
                {cartCount}
              </span>
              <span className="font-medium">Voir le panier</span>
              <span className="text-white/70">
                {useCartStore.getState().total().toFixed(2)}€
              </span>
            </button>
          </motion.div>
        )}
      </div>

      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
    </>
  );
}
