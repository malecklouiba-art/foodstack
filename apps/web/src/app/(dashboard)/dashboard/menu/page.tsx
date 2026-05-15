'use client';

import { useState } from 'react';
import {
  Plus, Search, Pencil, Trash2, GripVertical,
  ChevronRight, Clock, Flame, Star, Eye, EyeOff,
  UtensilsCrossed, Store, X, ShoppingBag, Leaf,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { CategoryModal } from '@/components/dashboard/menu/CategoryModal';
import { ItemModal } from '@/components/dashboard/menu/ItemModal';
import type { MenuCategory, MenuItem } from '@foodstack/shared';

// ── Mock data ──────────────────────────────────────────────────────────────
const INIT_CATEGORIES: MenuCategory[] = [
  { id: 'cat-1', restaurantId: 'r1', name: 'Burgers', description: 'Nos burgers maison', position: 0, isActive: true },
  { id: 'cat-2', restaurantId: 'r1', name: 'Pizzas', description: 'Cuites au feu de bois', position: 1, isActive: true },
  { id: 'cat-3', restaurantId: 'r1', name: 'Salades', description: 'Fraîches & légères', position: 2, isActive: true },
  { id: 'cat-4', restaurantId: 'r1', name: 'Desserts', description: 'Nos douceurs', position: 3, isActive: true },
  { id: 'cat-5', restaurantId: 'r1', name: 'Boissons', description: '', position: 4, isActive: false },
];

const INIT_ITEMS: MenuItem[] = [
  { id: 'i-1', restaurantId: 'r1', categoryId: 'cat-1', name: 'Classic Burger', description: 'Steak haché, cheddar, salade, tomate, oignons', price: 14.90, prepTime: 12, dietaryTags: [], allergens: ['Gluten', 'Lait', 'Oeufs'], modifierGroups: [], isActive: true, isFeatured: true, position: 0, rating: 4.8, reviewCount: 124, soldCount: 843, createdAt: new Date(), updatedAt: new Date() },
  { id: 'i-2', restaurantId: 'r1', categoryId: 'cat-1', name: 'Truffle Burger', description: 'Huile de truffe, champignons, emmental, mayo maison', price: 22.50, compareAtPrice: 26.00, prepTime: 15, dietaryTags: [], allergens: ['Gluten', 'Lait', 'Oeufs'], modifierGroups: [], isActive: true, isFeatured: false, position: 1, rating: 4.9, reviewCount: 67, soldCount: 312, createdAt: new Date(), updatedAt: new Date() },
  { id: 'i-3', restaurantId: 'r1', categoryId: 'cat-1', name: 'Chicken Burger', description: 'Poulet croustillant, coleslaw, sauce BBQ', price: 12.90, prepTime: 14, dietaryTags: [], allergens: ['Gluten', 'Lait'], modifierGroups: [], isActive: true, isFeatured: false, position: 2, rating: 4.6, reviewCount: 89, soldCount: 445, createdAt: new Date(), updatedAt: new Date() },
  { id: 'i-4', restaurantId: 'r1', categoryId: 'cat-1', name: 'Veggie Burger', description: 'Steak de légumes, avocat, tomate, roquette', price: 13.50, prepTime: 10, dietaryTags: ['vegetarian', 'vegan'], allergens: ['Gluten'], modifierGroups: [], isActive: false, isFeatured: false, position: 3, rating: 4.3, reviewCount: 34, soldCount: 156, createdAt: new Date(), updatedAt: new Date() },
  { id: 'i-5', restaurantId: 'r1', categoryId: 'cat-2', name: 'Margherita', description: 'Tomate, mozzarella, basilic frais', price: 13.90, prepTime: 18, dietaryTags: ['vegetarian'], allergens: ['Gluten', 'Lait'], modifierGroups: [], isActive: true, isFeatured: true, position: 0, rating: 4.7, reviewCount: 201, soldCount: 934, createdAt: new Date(), updatedAt: new Date() },
  { id: 'i-6', restaurantId: 'r1', categoryId: 'cat-2', name: 'Diavola', description: 'Tomate, mozzarella, salami piquant', price: 15.90, prepTime: 18, dietaryTags: ['spicy'], allergens: ['Gluten', 'Lait'], modifierGroups: [], isActive: true, isFeatured: false, position: 1, rating: 4.5, reviewCount: 88, soldCount: 421, createdAt: new Date(), updatedAt: new Date() },
  { id: 'i-7', restaurantId: 'r1', categoryId: 'cat-3', name: 'Salade César', description: 'Romaine, parmesan, croûtons, poulet grillé', price: 12.50, prepTime: 8, dietaryTags: [], allergens: ['Gluten', 'Lait', 'Oeufs'], modifierGroups: [], isActive: true, isFeatured: false, position: 0, rating: 4.4, reviewCount: 56, soldCount: 234, createdAt: new Date(), updatedAt: new Date() },
  { id: 'i-8', restaurantId: 'r1', categoryId: 'cat-4', name: 'Tiramisu', description: 'Recette traditionnelle italienne', price: 7.50, prepTime: 0, dietaryTags: ['vegetarian'], allergens: ['Oeufs', 'Lait', 'Gluten'], modifierGroups: [], isActive: true, isFeatured: false, position: 0, rating: 4.9, reviewCount: 145, soldCount: 678, createdAt: new Date(), updatedAt: new Date() },
];

// ── helpers ────────────────────────────────────────────────────────────────
function uid() { return `id-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`; }

const DIETARY_LABEL: Record<string, string> = {
  vegetarian: '🥦', vegan: '🌱', gluten_free: '🌾', halal: '☪️',
  kosher: '✡️', dairy_free: '🥛', nut_free: '🥜', spicy: '🌶️',
};

// ── Page ────────────────────────────────────────────────────────────────────
export default function MenuPage() {
  const [categories, setCategories] = useState<MenuCategory[]>(INIT_CATEGORIES);
  const [items, setItems] = useState<MenuItem[]>(INIT_ITEMS);
  const [selectedCatId, setSelectedCatId] = useState<string>(INIT_CATEGORIES[0].id);
  const [search, setSearch] = useState('');

  const [catModalOpen, setCatModalOpen] = useState(false);
  const [editingCat, setEditingCat] = useState<MenuCategory | null>(null);

  const [itemModalOpen, setItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);

  const [deleteConfirm, setDeleteConfirm] = useState<{ type: 'cat' | 'item'; id: string } | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  // ── derived ──
  const selectedCat = categories.find((c) => c.id === selectedCatId);
  const visibleItems = items
    .filter((i) => i.categoryId === selectedCatId)
    .filter((i) => !search || i.name.toLowerCase().includes(search.toLowerCase()));

  const itemCount = (catId: string) => items.filter((i) => i.categoryId === catId).length;

  // ── category actions ──
  function saveCat(data: Partial<MenuCategory>) {
    if (editingCat) {
      setCategories((cs) => cs.map((c) => c.id === editingCat.id ? { ...c, ...data } : c));
    } else {
      const next: MenuCategory = {
        id: uid(), restaurantId: 'r1', name: data.name!, description: data.description,
        position: categories.length, isActive: data.isActive ?? true,
        availableFrom: data.availableFrom, availableTo: data.availableTo,
      };
      setCategories((cs) => [...cs, next]);
      setSelectedCatId(next.id);
    }
    setEditingCat(null);
  }

  function deleteCat(id: string) {
    setCategories((cs) => cs.filter((c) => c.id !== id));
    setItems((is) => is.filter((i) => i.categoryId !== id));
    if (selectedCatId === id) setSelectedCatId(categories.find((c) => c.id !== id)?.id ?? '');
    setDeleteConfirm(null);
  }

  // ── item actions ──
  function saveItem(data: Partial<MenuItem>) {
    if (editingItem) {
      setItems((is) => is.map((i) => i.id === editingItem.id ? { ...i, ...data, updatedAt: new Date() } : i));
    } else {
      const next: MenuItem = {
        id: uid(), restaurantId: 'r1', categoryId: data.categoryId ?? selectedCatId,
        name: data.name!, description: data.description ?? '', price: data.price ?? 0,
        compareAtPrice: data.compareAtPrice, image: data.image, calories: data.calories,
        prepTime: data.prepTime ?? 10, dietaryTags: data.dietaryTags ?? [],
        allergens: data.allergens ?? [], modifierGroups: [], isActive: data.isActive ?? true,
        isFeatured: data.isFeatured ?? false, position: visibleItems.length,
        createdAt: new Date(), updatedAt: new Date(),
      };
      setItems((is) => [...is, next]);
    }
    setEditingItem(null);
  }

  function deleteItem(id: string) {
    setItems((is) => is.filter((i) => i.id !== id));
    setDeleteConfirm(null);
  }

  function toggleItemActive(id: string) {
    setItems((is) => is.map((i) => i.id === id ? { ...i, isActive: !i.isActive } : i));
  }

  return (
    <div className="flex h-full min-h-screen flex-col">
      {/* Header */}
      <div className="border-b border-surface-100 bg-white px-6 py-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-surface-900">Gestion du menu</h1>
            <p className="mt-0.5 text-sm text-surface-500">
              {categories.length} catégories · {items.length} articles
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              icon={<Store className="h-4 w-4" />}
              onClick={() => setPreviewOpen(true)}
            >
              Aperçu boutique
            </Button>
            <Button
              variant="primary"
              icon={<Plus className="h-4 w-4" />}
              onClick={() => { setEditingItem(null); setItemModalOpen(true); }}
            >
              Nouvel article
            </Button>
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* ── Left: Categories ────────────────────────────────────────────── */}
        <aside className="flex w-64 flex-shrink-0 flex-col border-r border-surface-100 bg-surface-50">
          <div className="flex items-center justify-between px-4 py-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-surface-400">Catégories</span>
            <button
              onClick={() => { setEditingCat(null); setCatModalOpen(true); }}
              className="flex h-6 w-6 items-center justify-center rounded-lg bg-brand-500 text-white hover:bg-brand-600 transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-2 pb-4">
            <AnimatePresence>
              {categories.map((cat) => (
                <motion.div
                  key={cat.id}
                  layout
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.15 }}
                >
                  <button
                    onClick={() => setSelectedCatId(cat.id)}
                    className={`group mb-0.5 flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left transition-all duration-150 ${
                      selectedCatId === cat.id
                        ? 'bg-brand-500 text-white shadow-sm'
                        : 'text-surface-700 hover:bg-surface-100'
                    }`}
                  >
                    <GripVertical className={`h-3.5 w-3.5 flex-shrink-0 ${selectedCatId === cat.id ? 'text-white/60' : 'text-surface-300'}`} />
                    <span className="flex-1 truncate text-sm font-medium">{cat.name}</span>
                    <span className={`rounded-full px-1.5 py-0.5 text-xs font-medium ${
                      selectedCatId === cat.id ? 'bg-white/20 text-white' : 'bg-surface-200 text-surface-500'
                    }`}>
                      {itemCount(cat.id)}
                    </span>
                    {!cat.isActive && (
                      <span className={`text-xs ${selectedCatId === cat.id ? 'text-white/60' : 'text-surface-400'}`}>
                        ·
                      </span>
                    )}
                    <ChevronRight className={`h-3.5 w-3.5 flex-shrink-0 opacity-0 transition-opacity group-hover:opacity-100 ${selectedCatId === cat.id ? 'text-white' : 'text-surface-400'}`} />
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </aside>

        {/* ── Right: Items ─────────────────────────────────────────────────── */}
        <main className="flex flex-1 flex-col overflow-hidden bg-white">
          {/* Toolbar */}
          <div className="flex items-center gap-3 border-b border-surface-100 px-6 py-4">
            <div className="flex flex-1 items-center gap-2">
              <h2 className="text-base font-semibold text-surface-900">{selectedCat?.name}</h2>
              {selectedCat && (
                <Badge variant={selectedCat.isActive ? 'success' : 'default'} dot>
                  {selectedCat.isActive ? 'Active' : 'Inactive'}
                </Badge>
              )}
            </div>
            <Input
              placeholder="Rechercher un article…"
              leftIcon={<Search className="h-4 w-4" />}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-56"
            />
            <Button
              variant="ghost"
              size="sm"
              icon={<Pencil className="h-3.5 w-3.5" />}
              onClick={() => { setEditingCat(selectedCat ?? null); setCatModalOpen(true); }}
            >
              Modifier
            </Button>
            <button
              onClick={() => selectedCat && setDeleteConfirm({ type: 'cat', id: selectedCat.id })}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-surface-200 text-surface-400 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-500"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>

          {/* Items grid */}
          <div className="flex-1 overflow-y-auto p-6">
            {visibleItems.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex h-64 flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-surface-200"
              >
                <UtensilsCrossed className="h-10 w-10 text-surface-300" />
                <p className="text-sm font-medium text-surface-500">
                  {search ? 'Aucun article trouvé' : 'Aucun article dans cette catégorie'}
                </p>
                {!search && (
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={<Plus className="h-4 w-4" />}
                    onClick={() => { setEditingItem(null); setItemModalOpen(true); }}
                  >
                    Ajouter un article
                  </Button>
                )}
              </motion.div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                <AnimatePresence>
                  {visibleItems.map((item, idx) => (
                    <motion.div
                      key={item.id}
                      layout
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.2, delay: idx * 0.04 }}
                    >
                      <ItemCard
                        item={item}
                        onEdit={() => { setEditingItem(item); setItemModalOpen(true); }}
                        onDelete={() => setDeleteConfirm({ type: 'item', id: item.id })}
                        onToggleActive={() => toggleItemActive(item.id)}
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>

                {/* Add card */}
                <motion.button
                  layout
                  onClick={() => { setEditingItem(null); setItemModalOpen(true); }}
                  className="flex h-full min-h-[140px] items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-surface-200 text-sm font-medium text-surface-400 transition-all duration-200 hover:border-brand-300 hover:bg-brand-50/30 hover:text-brand-500"
                >
                  <Plus className="h-5 w-5" />
                  Ajouter un article
                </motion.button>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* ── Modals ──────────────────────────────────────────────────────────── */}
      <CategoryModal
        open={catModalOpen}
        onClose={() => { setCatModalOpen(false); setEditingCat(null); }}
        onSave={saveCat}
        initial={editingCat}
      />

      <ItemModal
        open={itemModalOpen}
        onClose={() => { setItemModalOpen(false); setEditingItem(null); }}
        onSave={saveItem}
        initial={editingItem}
        categories={categories.filter((c) => c.isActive)}
      />

      {/* Customer-facing store preview */}
      <AnimatePresence>
        {previewOpen && (
          <StorePreview
            categories={categories.filter((c) => c.isActive)}
            items={items.filter((i) => i.isActive)}
            onClose={() => setPreviewOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Delete confirm */}
      <AnimatePresence>
        {deleteConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-surface-900/60 backdrop-blur-sm"
              onClick={() => setDeleteConfirm(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative z-10 w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl"
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-red-100">
                <Trash2 className="h-6 w-6 text-red-500" />
              </div>
              <h3 className="text-base font-semibold text-surface-900">
                {deleteConfirm.type === 'cat' ? 'Supprimer la catégorie ?' : 'Supprimer l\'article ?'}
              </h3>
              <p className="mt-1 text-sm text-surface-500">
                {deleteConfirm.type === 'cat'
                  ? 'Tous les articles de cette catégorie seront également supprimés.'
                  : 'Cette action est irréversible.'}
              </p>
              <div className="mt-5 flex gap-3">
                <Button variant="ghost" fullWidth onClick={() => setDeleteConfirm(null)}>
                  Annuler
                </Button>
                <Button
                  variant="danger"
                  fullWidth
                  onClick={() =>
                    deleteConfirm.type === 'cat'
                      ? deleteCat(deleteConfirm.id)
                      : deleteItem(deleteConfirm.id)
                  }
                >
                  Supprimer
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Customer-facing store preview ───────────────────────────────────────────
interface StorePreviewProps {
  categories: MenuCategory[];
  items: MenuItem[];
  onClose: () => void;
}

function StorePreview({ categories, items, onClose }: StorePreviewProps) {
  const [activeCat, setActiveCat] = useState<string>(categories[0]?.id ?? '');
  const [cart, setCart] = useState<Record<string, number>>({});

  const visibleItems = items.filter((i) => i.categoryId === activeCat);
  const cartCount = Object.values(cart).reduce((s, n) => s + n, 0);
  const cartTotal = Object.entries(cart).reduce((sum, [id, qty]) => {
    const it = items.find((i) => i.id === id);
    return sum + (it ? it.price * qty : 0);
  }, 0);

  function addToCart(id: string) {
    setCart((c) => ({ ...c, [id]: (c[id] ?? 0) + 1 }));
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex flex-col bg-surface-50"
    >
      {/* Top bar */}
      <div className="flex items-center justify-between border-b border-surface-200 bg-white px-6 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-600 shadow-brand">
            <UtensilsCrossed className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-surface-900">Le Restaurant</p>
            <p className="text-xs text-surface-400">Aperçu boutique · vue client</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden items-center gap-2 rounded-full bg-brand-50 px-3 py-1.5 text-xs font-medium text-brand-700 sm:flex">
            <span className="h-2 w-2 animate-pulse rounded-full bg-brand-500" />
            Ouvert · livraison 20-30 min
          </div>
          <button
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-surface-200 bg-white text-surface-500 transition-colors hover:bg-surface-100 hover:text-surface-900"
            aria-label="Fermer l'aperçu"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Centered content pane */}
        <div className="flex flex-1 justify-center overflow-y-auto bg-surface-50">
          <div className="w-full max-w-2xl px-4 py-6 sm:px-6">

            {/* Restaurant hero banner */}
            <div className="relative mb-5 overflow-hidden rounded-3xl bg-gradient-to-br from-surface-900 via-surface-800 to-surface-900">
              {/* decorative gradient blob */}
              <div className="absolute right-0 top-0 h-48 w-48 rounded-full bg-brand-500/20 blur-3xl" />
              <div className="relative flex items-end justify-between p-6">
                <div>
                  <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-brand-500/20 px-2.5 py-1 text-xs font-semibold text-brand-400">
                    <span className="h-1.5 w-1.5 rounded-full bg-brand-400" />
                    Ouvert maintenant
                  </div>
                  <h2 className="text-xl font-bold text-white">Le Restaurant</h2>
                  <p className="mt-1 text-sm text-white/60">
                    {items.length} articles · Livraison 20-30 min · Min. 12€
                  </p>
                </div>
                <div className="hidden flex-col items-end gap-1 sm:flex">
                  <div className="flex items-center gap-1 text-yellow-400">
                    <Star className="h-4 w-4 fill-yellow-400" />
                    <span className="text-sm font-bold text-white">4.8</span>
                  </div>
                  <span className="text-xs text-white/50">200+ avis</span>
                </div>
              </div>
            </div>

            {/* Category tabs */}
            <div className="sticky top-0 -mx-4 mb-4 border-b border-surface-200 bg-surface-50/95 px-4 py-2 backdrop-blur sm:-mx-6 sm:px-6">
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setActiveCat(cat.id)}
                    className={`flex-shrink-0 rounded-full px-4 py-1.5 text-sm font-semibold transition-all ${
                      activeCat === cat.id
                        ? 'bg-surface-900 text-white shadow-sm'
                        : 'bg-white text-surface-600 border border-surface-200 hover:border-surface-300 hover:bg-surface-50'
                    }`}
                  >
                    {cat.name}
                    <span className={`ml-1.5 text-[10px] font-medium ${activeCat === cat.id ? 'text-white/60' : 'text-surface-400'}`}>
                      {items.filter((i) => i.categoryId === cat.id).length}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Category heading */}
            <div className="mb-3">
              <h3 className="text-base font-bold text-surface-900">
                {categories.find((c) => c.id === activeCat)?.name ?? ''}
              </h3>
              <p className="text-xs text-surface-400">
                {categories.find((c) => c.id === activeCat)?.description ?? ''}
              </p>
            </div>

            {/* Items list */}
            <div className="space-y-3 pb-28">
              {visibleItems.length === 0 ? (
                <div className="flex h-32 flex-col items-center justify-center gap-2 rounded-2xl bg-white text-sm text-surface-500 shadow-sm">
                  <UtensilsCrossed className="h-8 w-8 text-surface-300" />
                  Aucun article disponible dans cette catégorie.
                </div>
              ) : (
                visibleItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex gap-4 overflow-hidden rounded-2xl bg-white p-4 shadow-sm ring-1 ring-surface-100 transition-all hover:shadow-md hover:ring-surface-200"
                  >
                    {/* Text */}
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-surface-900">{item.name}</p>
                        {item.isFeatured && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-yellow-100 px-1.5 py-0.5 text-[10px] font-bold uppercase text-yellow-700">
                            <Star className="h-2.5 w-2.5 fill-yellow-500 text-yellow-500" /> Populaire
                          </span>
                        )}
                        {item.dietaryTags.includes('vegan') && (
                          <span className="rounded-full bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700">Vegan</span>
                        )}
                        {item.dietaryTags.includes('vegetarian') && !item.dietaryTags.includes('vegan') && (
                          <span className="rounded-full bg-green-100 px-1.5 py-0.5 text-[10px] font-bold text-green-700">Végé</span>
                        )}
                      </div>
                      <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-surface-500">
                        {item.description}
                      </p>
                      {/* Meta row */}
                      <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-surface-400">
                        {item.prepTime > 0 && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {item.prepTime} min
                          </span>
                        )}
                        {item.calories && (
                          <span className="flex items-center gap-1">
                            <Flame className="h-3 w-3" />
                            {item.calories} kcal
                          </span>
                        )}
                        {item.rating && (
                          <span className="flex items-center gap-1 text-yellow-500">
                            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                            {item.rating} ({item.reviewCount})
                          </span>
                        )}
                        {item.allergens.length > 0 && (
                          <span className="text-surface-300">
                            Allergènes : {item.allergens.slice(0, 2).join(', ')}{item.allergens.length > 2 ? '…' : ''}
                          </span>
                        )}
                      </div>
                      {/* Price + CTA */}
                      <div className="mt-3 flex items-center justify-between">
                        <div className="flex items-baseline gap-2">
                          <span className="text-base font-bold text-surface-900">
                            {item.price.toFixed(2)}€
                          </span>
                          {item.compareAtPrice && (
                            <span className="text-xs text-surface-400 line-through">
                              {item.compareAtPrice.toFixed(2)}€
                            </span>
                          )}
                          {item.compareAtPrice && (
                            <span className="rounded-full bg-red-100 px-1.5 py-0.5 text-[10px] font-bold text-red-600">
                              -{Math.round((1 - item.price / item.compareAtPrice) * 100)}%
                            </span>
                          )}
                        </div>
                        <button
                          onClick={() => addToCart(item.id)}
                          className="flex items-center gap-1.5 rounded-full bg-brand-500 px-4 py-2 text-xs font-bold text-white shadow-brand transition-all hover:bg-brand-600 active:scale-95"
                        >
                          <Plus className="h-3.5 w-3.5" />
                          Ajouter
                          {cart[item.id] ? ` (${cart[item.id]})` : ''}
                        </button>
                      </div>
                    </div>
                    {/* Image */}
                    <div className="relative h-28 w-28 flex-shrink-0 overflow-hidden rounded-2xl bg-gradient-to-br from-surface-100 to-surface-200">
                      {item.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={item.image}
                          alt={item.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center">
                          <UtensilsCrossed className="h-8 w-8 text-surface-300" />
                        </div>
                      )}
                      {item.compareAtPrice && (
                        <div className="absolute left-1 top-1 rounded-full bg-red-500 px-1 py-0.5 text-[9px] font-bold text-white">
                          Promo
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Sticky cart bar */}
      <AnimatePresence>
        {cartCount > 0 && (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="pointer-events-none absolute inset-x-0 bottom-6 flex justify-center px-4"
          >
            <div className="pointer-events-auto flex w-full max-w-lg items-center justify-between gap-3 rounded-2xl bg-surface-900 px-5 py-3.5 text-white shadow-2xl">
              <div className="flex items-center gap-3">
                <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500 shadow-brand">
                  <ShoppingBag className="h-4.5 w-4.5 text-white" />
                  <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-white px-1 text-[10px] font-bold text-surface-900 shadow">
                    {cartCount}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-semibold">Voir le panier</p>
                  <p className="text-[11px] text-white/50">{cartCount} article{cartCount > 1 ? 's' : ''} sélectionné{cartCount > 1 ? 's' : ''}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-lg font-bold">{cartTotal.toFixed(2)}€</span>
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/10">
                  <ChevronRight className="h-4 w-4 text-white" />
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── ItemCard sub-component ──────────────────────────────────────────────────
interface ItemCardProps {
  item: MenuItem;
  onEdit: () => void;
  onDelete: () => void;
  onToggleActive: () => void;
}

function ItemCard({ item, onEdit, onDelete, onToggleActive }: ItemCardProps) {
  return (
    <Card padding="none" hover className="group overflow-hidden">
      {/* Image area */}
      <div className="relative h-32 bg-gradient-to-br from-surface-100 to-surface-200">
        {item.image ? (
          <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center">
            <UtensilsCrossed className="h-8 w-8 text-surface-300" />
          </div>
        )}
        {/* Badges */}
        <div className="absolute left-2 top-2 flex gap-1">
          {item.isFeatured && (
            <span className="flex items-center gap-1 rounded-full bg-yellow-400/90 px-2 py-0.5 text-xs font-semibold text-yellow-900 backdrop-blur-sm">
              <Star className="h-3 w-3" /> Vedette
            </span>
          )}
          {!item.isActive && (
            <span className="rounded-full bg-surface-900/70 px-2 py-0.5 text-xs font-medium text-white backdrop-blur-sm">
              Inactif
            </span>
          )}
        </div>
        {/* Actions overlay */}
        <div className="absolute inset-0 flex items-center justify-center gap-2 bg-surface-900/0 opacity-0 transition-all duration-200 group-hover:bg-surface-900/40 group-hover:opacity-100">
          <button
            onClick={onEdit}
            className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/90 text-surface-700 shadow hover:bg-white hover:text-brand-600 transition-colors"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={onToggleActive}
            className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/90 text-surface-700 shadow hover:bg-white transition-colors"
          >
            {item.isActive ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
          </button>
          <button
            onClick={onDelete}
            className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/90 text-surface-700 shadow hover:bg-red-50 hover:text-red-500 transition-colors"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate font-semibold text-surface-900">{item.name}</p>
            <p className="mt-0.5 line-clamp-1 text-xs text-surface-500">{item.description}</p>
          </div>
          <div className="flex-shrink-0 text-right">
            <p className="font-bold text-brand-600">{item.price.toFixed(2)}€</p>
            {item.compareAtPrice && (
              <p className="text-xs text-surface-400 line-through">{item.compareAtPrice.toFixed(2)}€</p>
            )}
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between">
          <div className="flex items-center gap-3 text-xs text-surface-500">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />{item.prepTime} min
            </span>
            {item.calories && (
              <span className="flex items-center gap-1">
                <Flame className="h-3 w-3" />{item.calories} kcal
              </span>
            )}
            {item.rating && (
              <span className="flex items-center gap-1">
                <Star className="h-3 w-3 text-yellow-400" />{item.rating}
              </span>
            )}
          </div>
          {item.dietaryTags.length > 0 && (
            <div className="flex gap-0.5">
              {item.dietaryTags.slice(0, 3).map((tag) => (
                <span key={tag} title={tag} className="text-sm">{DIETARY_LABEL[tag]}</span>
              ))}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
