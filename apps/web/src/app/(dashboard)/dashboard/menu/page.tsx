'use client';

import { useState } from 'react';
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  GripVertical,
  ChevronRight,
  ChevronDown,
  ImageIcon,
  Tag,
  Flame,
  AlertTriangle,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';

interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  calories?: number;
  allergens: string[];
  image?: string;
  available: boolean;
  popular?: boolean;
}

interface Category {
  id: string;
  name: string;
  emoji: string;
  items: MenuItem[];
  expanded: boolean;
}

const ALLERGEN_LIST = ['Gluten', 'Lactose', 'Œufs', 'Arachides', 'Noix', 'Soja', 'Poisson', 'Crustacés'];

const INITIAL_CATEGORIES: Category[] = [
  {
    id: 'cat-1', name: 'Burgers', emoji: '🍔', expanded: true,
    items: [
      { id: 'item-1', name: 'Classic Burger', description: 'Steak haché, cheddar, salade, tomate, cornichon', price: 14.90, calories: 620, allergens: ['Gluten', 'Lactose', 'Œufs'], available: true, popular: true },
      { id: 'item-2', name: 'Chicken Burger', description: 'Poulet croustillant, mayo, salade, oignon rouge', price: 12.90, calories: 580, allergens: ['Gluten', 'Œufs'], available: true },
      { id: 'item-3', name: 'Truffle Burger', description: 'Double steak, huile de truffe, parmesan, roquette', price: 22.50, calories: 780, allergens: ['Gluten', 'Lactose'], available: false },
    ],
  },
  {
    id: 'cat-2', name: 'Pizzas', emoji: '🍕', expanded: false,
    items: [
      { id: 'item-4', name: 'Margherita', description: 'Sauce tomate, mozzarella, basilic frais', price: 13.90, calories: 520, allergens: ['Gluten', 'Lactose'], available: true, popular: true },
      { id: 'item-5', name: 'Diavola', description: 'Sauce tomate, mozzarella, salami piquant, piment', price: 16.50, calories: 610, allergens: ['Gluten', 'Lactose'], available: true },
    ],
  },
  {
    id: 'cat-3', name: 'Desserts', emoji: '🍰', expanded: false,
    items: [
      { id: 'item-6', name: 'Fondant Chocolat', description: 'Cœur coulant chocolat noir, glace vanille', price: 8.00, calories: 450, allergens: ['Gluten', 'Lactose', 'Œufs'], available: true, popular: true },
      { id: 'item-7', name: 'Tiramisu', description: 'Recette italienne traditionnelle, mascarpone, café', price: 7.50, calories: 390, allergens: ['Gluten', 'Lactose', 'Œufs'], available: true },
    ],
  },
  {
    id: 'cat-4', name: 'Boissons', emoji: '🥤', expanded: false,
    items: [
      { id: 'item-8', name: 'Limonade Maison', description: 'Citron frais, menthe, eau gazeuse', price: 4.90, calories: 90, allergens: [], available: true },
    ],
  },
];

const emptyItem = (): Omit<MenuItem, 'id'> => ({
  name: '', description: '', price: 0, calories: undefined, allergens: [], available: true, popular: false,
});
const emptyCategory = (): Omit<Category, 'id' | 'items' | 'expanded'> => ({ name: '', emoji: '🍽️' });

export default function MenuPage() {
  const [categories, setCategories] = useState<Category[]>(INITIAL_CATEGORIES);
  const [search, setSearch] = useState('');

  const [itemModal, setItemModal] = useState<{ open: boolean; catId: string; item?: MenuItem }>({ open: false, catId: '' });
  const [catModal, setCatModal] = useState<{ open: boolean; cat?: Category }>({ open: false });
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; type: 'item' | 'category'; id: string; catId?: string; name: string } | null>(null);

  const [itemForm, setItemForm] = useState<Omit<MenuItem, 'id'>>(emptyItem());
  const [catForm, setCatForm] = useState<Omit<Category, 'id' | 'items' | 'expanded'>>(emptyCategory());

  const totalItems = categories.reduce((acc, c) => acc + c.items.length, 0);
  const availableItems = categories.reduce((acc, c) => acc + c.items.filter((i) => i.available).length, 0);

  const toggleCategory = (catId: string) =>
    setCategories((prev) => prev.map((c) => (c.id === catId ? { ...c, expanded: !c.expanded } : c)));

  const toggleItemAvailability = (catId: string, itemId: string) =>
    setCategories((prev) =>
      prev.map((c) =>
        c.id === catId
          ? { ...c, items: c.items.map((i) => (i.id === itemId ? { ...i, available: !i.available } : i)) }
          : c
      )
    );

  const openAddItem = (catId: string) => {
    setItemForm(emptyItem());
    setItemModal({ open: true, catId });
  };

  const openEditItem = (catId: string, item: MenuItem) => {
    setItemForm({ name: item.name, description: item.description, price: item.price, calories: item.calories, allergens: item.allergens, available: item.available, popular: item.popular });
    setItemModal({ open: true, catId, item });
  };

  const saveItem = () => {
    if (!itemForm.name.trim()) return;
    setCategories((prev) =>
      prev.map((c) => {
        if (c.id !== itemModal.catId) return c;
        if (itemModal.item) {
          return { ...c, items: c.items.map((i) => (i.id === itemModal.item!.id ? { ...i, ...itemForm } : i)) };
        }
        return { ...c, items: [...c.items, { id: `item-${Date.now()}`, ...itemForm }] };
      })
    );
    setItemModal({ open: false, catId: '' });
  };

  const openAddCategory = () => {
    setCatForm(emptyCategory());
    setCatModal({ open: true });
  };

  const openEditCategory = (cat: Category) => {
    setCatForm({ name: cat.name, emoji: cat.emoji });
    setCatModal({ open: true, cat });
  };

  const saveCategory = () => {
    if (!catForm.name.trim()) return;
    if (catModal.cat) {
      setCategories((prev) =>
        prev.map((c) => (c.id === catModal.cat!.id ? { ...c, ...catForm } : c))
      );
    } else {
      setCategories((prev) => [...prev, { id: `cat-${Date.now()}`, ...catForm, items: [], expanded: true }]);
    }
    setCatModal({ open: false });
  };

  const confirmDelete = () => {
    if (!deleteModal) return;
    if (deleteModal.type === 'category') {
      setCategories((prev) => prev.filter((c) => c.id !== deleteModal.id));
    } else {
      setCategories((prev) =>
        prev.map((c) =>
          c.id === deleteModal.catId ? { ...c, items: c.items.filter((i) => i.id !== deleteModal.id) } : c
        )
      );
    }
    setDeleteModal(null);
  };

  const toggleAllergen = (allergen: string) => {
    setItemForm((prev) => ({
      ...prev,
      allergens: prev.allergens.includes(allergen)
        ? prev.allergens.filter((a) => a !== allergen)
        : [...prev.allergens, allergen],
    }));
  };

  const filteredCategories = categories.map((c) => ({
    ...c,
    items: search
      ? c.items.filter(
          (i) =>
            i.name.toLowerCase().includes(search.toLowerCase()) ||
            i.description.toLowerCase().includes(search.toLowerCase())
        )
      : c.items,
  })).filter((c) => !search || c.items.length > 0);

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-900">Gestion du menu</h1>
          <p className="mt-1 text-sm text-surface-500">
            {totalItems} articles · {availableItems} disponibles · {categories.length} catégories
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" icon={<Plus className="h-4 w-4" />} onClick={openAddCategory}>
            Catégorie
          </Button>
          <Button size="sm" icon={<Plus className="h-4 w-4" />} onClick={() => categories.length > 0 && openAddItem(categories[0].id)}>
            Article
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="mb-6 max-w-sm">
        <Input
          placeholder="Rechercher un article..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          leftIcon={<Search className="h-4 w-4" />}
        />
      </div>

      {/* Categories */}
      <div className="space-y-4">
        {filteredCategories.map((cat) => (
          <div key={cat.id} className="overflow-hidden rounded-2xl border border-surface-200 bg-white shadow-sm">
            {/* Category header */}
            <div className="flex items-center gap-3 px-5 py-4">
              <button className="cursor-grab text-surface-300 hover:text-surface-500">
                <GripVertical className="h-4 w-4" />
              </button>
              <button
                onClick={() => toggleCategory(cat.id)}
                className="flex flex-1 items-center gap-3 text-left"
              >
                <span className="text-2xl">{cat.emoji}</span>
                <div className="flex-1">
                  <p className="font-semibold text-surface-900">{cat.name}</p>
                  <p className="text-xs text-surface-400">{cat.items.length} article{cat.items.length !== 1 ? 's' : ''}</p>
                </div>
                {cat.expanded ? (
                  <ChevronDown className="h-4 w-4 text-surface-400" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-surface-400" />
                )}
              </button>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => openAddItem(cat.id)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-surface-400 hover:bg-brand-50 hover:text-brand-600"
                  title="Ajouter un article"
                >
                  <Plus className="h-4 w-4" />
                </button>
                <button
                  onClick={() => openEditCategory(cat)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-surface-400 hover:bg-surface-100 hover:text-surface-700"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setDeleteModal({ open: true, type: 'category', id: cat.id, name: cat.name })}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-surface-400 hover:bg-red-50 hover:text-red-500"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Items list */}
            <AnimatePresence>
              {cat.expanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="border-t border-surface-100">
                    {cat.items.length === 0 ? (
                      <div className="py-8 text-center">
                        <p className="text-sm text-surface-400">Aucun article dans cette catégorie</p>
                        <button
                          onClick={() => openAddItem(cat.id)}
                          className="mt-2 text-sm font-medium text-brand-500 hover:text-brand-600"
                        >
                          + Ajouter un article
                        </button>
                      </div>
                    ) : (
                      <div className="divide-y divide-surface-50">
                        {cat.items.map((item) => (
                          <div key={item.id} className={`flex items-center gap-4 px-5 py-4 transition-colors hover:bg-surface-50 ${!item.available ? 'opacity-50' : ''}`}>
                            <button className="cursor-grab text-surface-200 hover:text-surface-400">
                              <GripVertical className="h-4 w-4" />
                            </button>

                            {/* Image placeholder */}
                            <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-xl bg-surface-100">
                              {item.image ? (
                                <img src={item.image} alt={item.name} className="h-full w-full rounded-xl object-cover" />
                              ) : (
                                <ImageIcon className="h-5 w-5 text-surface-300" />
                              )}
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="font-semibold text-surface-900 truncate">{item.name}</p>
                                {item.popular && (
                                  <span className="flex items-center gap-1 rounded-full bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-600">
                                    <Flame className="h-3 w-3" />
                                    Populaire
                                  </span>
                                )}
                                {!item.available && (
                                  <Badge variant="default" size="sm">Indisponible</Badge>
                                )}
                              </div>
                              <p className="mt-0.5 text-sm text-surface-500 truncate">{item.description}</p>
                              <div className="mt-1 flex items-center gap-3">
                                {item.calories && (
                                  <span className="text-xs text-surface-400">{item.calories} kcal</span>
                                )}
                                {item.allergens.length > 0 && (
                                  <span className="flex items-center gap-1 text-xs text-amber-600">
                                    <AlertTriangle className="h-3 w-3" />
                                    {item.allergens.join(', ')}
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Price */}
                            <div className="text-right">
                              <p className="text-lg font-bold text-surface-900">{item.price.toFixed(2)}€</p>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => toggleItemAvailability(cat.id, item.id)}
                                className="text-surface-400 hover:text-surface-700"
                                title={item.available ? 'Rendre indisponible' : 'Rendre disponible'}
                              >
                                {item.available ? (
                                  <ToggleRight className="h-6 w-6 text-green-500" />
                                ) : (
                                  <ToggleLeft className="h-6 w-6" />
                                )}
                              </button>
                              <button
                                onClick={() => openEditItem(cat.id, item)}
                                className="flex h-8 w-8 items-center justify-center rounded-lg text-surface-400 hover:bg-surface-100 hover:text-surface-700"
                              >
                                <Pencil className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => setDeleteModal({ open: true, type: 'item', id: item.id, catId: cat.id, name: item.name })}
                                className="flex h-8 w-8 items-center justify-center rounded-lg text-surface-400 hover:bg-red-50 hover:text-red-500"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>

      {filteredCategories.length === 0 && (
        <div className="mt-12 text-center">
          <div className="mb-3 text-5xl">🍽️</div>
          <p className="text-surface-500">
            {search ? 'Aucun article trouvé pour cette recherche' : 'Aucune catégorie. Commencez par en créer une !'}
          </p>
        </div>
      )}

      {/* Item Modal */}
      <Modal
        open={itemModal.open}
        onClose={() => setItemModal({ open: false, catId: '' })}
        title={itemModal.item ? 'Modifier l\'article' : 'Nouvel article'}
        size="lg"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setItemModal({ open: false, catId: '' })}>Annuler</Button>
            <Button onClick={saveItem} disabled={!itemForm.name.trim()}>
              {itemModal.item ? 'Enregistrer' : 'Ajouter'}
            </Button>
          </div>
        }
      >
        <div className="space-y-5">
          {/* Image upload zone */}
          <div className="flex h-28 cursor-pointer items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-surface-200 bg-surface-50 text-surface-400 transition-colors hover:border-brand-300 hover:bg-brand-50 hover:text-brand-500">
            <ImageIcon className="h-6 w-6" />
            <span className="text-sm font-medium">Ajouter une photo</span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="mb-1.5 block text-sm font-semibold text-surface-700">Nom de l&apos;article *</label>
              <input
                type="text"
                value={itemForm.name}
                onChange={(e) => setItemForm((p) => ({ ...p, name: e.target.value }))}
                placeholder="Ex : Classic Burger"
                className="h-11 w-full rounded-xl border border-surface-200 px-4 text-sm text-surface-900 placeholder:text-surface-400 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
              />
            </div>
            <div className="col-span-2">
              <label className="mb-1.5 block text-sm font-semibold text-surface-700">Description</label>
              <textarea
                value={itemForm.description}
                onChange={(e) => setItemForm((p) => ({ ...p, description: e.target.value }))}
                placeholder="Décrivez l'article..."
                rows={2}
                className="w-full rounded-xl border border-surface-200 px-4 py-2.5 text-sm text-surface-900 placeholder:text-surface-400 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-surface-700">Prix (€) *</label>
              <div className="relative">
                <Tag className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-surface-400" />
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={itemForm.price || ''}
                  onChange={(e) => setItemForm((p) => ({ ...p, price: parseFloat(e.target.value) || 0 }))}
                  placeholder="0.00"
                  className="h-11 w-full rounded-xl border border-surface-200 pl-9 pr-4 text-sm text-surface-900 placeholder:text-surface-400 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
                />
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-surface-700">Calories (kcal)</label>
              <input
                type="number"
                min="0"
                value={itemForm.calories || ''}
                onChange={(e) => setItemForm((p) => ({ ...p, calories: parseInt(e.target.value) || undefined }))}
                placeholder="Ex : 620"
                className="h-11 w-full rounded-xl border border-surface-200 px-4 text-sm text-surface-900 placeholder:text-surface-400 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
              />
            </div>
          </div>

          {/* Allergens */}
          <div>
            <label className="mb-2 block text-sm font-semibold text-surface-700">Allergènes</label>
            <div className="flex flex-wrap gap-2">
              {ALLERGEN_LIST.map((allergen) => {
                const selected = itemForm.allergens.includes(allergen);
                return (
                  <button
                    key={allergen}
                    type="button"
                    onClick={() => toggleAllergen(allergen)}
                    className={`rounded-xl border px-3 py-1.5 text-xs font-medium transition-colors ${
                      selected
                        ? 'border-amber-400 bg-amber-50 text-amber-700'
                        : 'border-surface-200 bg-white text-surface-500 hover:border-surface-300'
                    }`}
                  >
                    {allergen}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Toggles */}
          <div className="flex items-center gap-6">
            <label className="flex cursor-pointer items-center gap-2">
              <div
                onClick={() => setItemForm((p) => ({ ...p, available: !p.available }))}
                className={`relative h-6 w-11 rounded-full transition-colors ${itemForm.available ? 'bg-green-500' : 'bg-surface-200'}`}
              >
                <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${itemForm.available ? 'translate-x-5' : 'translate-x-0.5'}`} />
              </div>
              <span className="text-sm text-surface-700">Disponible</span>
            </label>
            <label className="flex cursor-pointer items-center gap-2">
              <div
                onClick={() => setItemForm((p) => ({ ...p, popular: !p.popular }))}
                className={`relative h-6 w-11 rounded-full transition-colors ${itemForm.popular ? 'bg-brand-500' : 'bg-surface-200'}`}
              >
                <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${itemForm.popular ? 'translate-x-5' : 'translate-x-0.5'}`} />
              </div>
              <span className="text-sm text-surface-700">Populaire</span>
            </label>
          </div>
        </div>
      </Modal>

      {/* Category Modal */}
      <Modal
        open={catModal.open}
        onClose={() => setCatModal({ open: false })}
        title={catModal.cat ? 'Modifier la catégorie' : 'Nouvelle catégorie'}
        size="sm"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setCatModal({ open: false })}>Annuler</Button>
            <Button onClick={saveCategory} disabled={!catForm.name.trim()}>
              {catModal.cat ? 'Enregistrer' : 'Créer'}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-surface-700">Emoji</label>
            <input
              type="text"
              value={catForm.emoji}
              onChange={(e) => setCatForm((p) => ({ ...p, emoji: e.target.value }))}
              maxLength={4}
              className="h-11 w-20 rounded-xl border border-surface-200 px-3 text-center text-2xl focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-surface-700">Nom de la catégorie *</label>
            <input
              type="text"
              value={catForm.name}
              onChange={(e) => setCatForm((p) => ({ ...p, name: e.target.value }))}
              placeholder="Ex : Entrées, Boissons..."
              className="h-11 w-full rounded-xl border border-surface-200 px-4 text-sm text-surface-900 placeholder:text-surface-400 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
            />
          </div>
        </div>
      </Modal>

      {/* Delete confirmation modal */}
      {deleteModal && (
        <Modal
          open={deleteModal.open}
          onClose={() => setDeleteModal(null)}
          title="Confirmer la suppression"
          size="sm"
          footer={
            <div className="flex justify-end gap-3">
              <Button variant="ghost" onClick={() => setDeleteModal(null)}>Annuler</Button>
              <Button variant="danger" onClick={confirmDelete}>Supprimer</Button>
            </div>
          }
        >
          <p className="text-sm text-surface-600">
            Voulez-vous vraiment supprimer{' '}
            <span className="font-semibold text-surface-900">«{deleteModal.name}»</span> ?
            {deleteModal.type === 'category' && ' Tous les articles de cette catégorie seront supprimés.'}
          </p>
        </Modal>
      )}
    </div>
  );
}
