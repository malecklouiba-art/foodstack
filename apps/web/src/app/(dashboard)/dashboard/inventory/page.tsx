'use client';

import { useState, useRef, useCallback } from 'react';
import { Plus, Search, AlertTriangle, Package, TrendingDown, TrendingUp, Pencil, Trash2, SlidersHorizontal, X, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { StatCard } from '@/components/ui/StatCard';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';

// ─── Types ────────────────────────────────────────────────────────────────────

interface StockItem {
  id: string;
  name: string;
  category: string;
  currentStock: number;
  unit: string;
  minStock: number;
  costPerUnit: number;
  sellPrice: number;
  supplier: string;
  lastUpdated: string;
  image?: string; // base64
}

interface ItemFormState {
  name: string;
  category: string;
  currentStock: string;
  unit: string;
  minStock: string;
  costPerUnit: string;
  sellPrice: string;
  supplier: string;
  image?: string;
}

interface AdjustFormState {
  amount: string;
  reason: 'Livraison reçue' | 'Consommation' | 'Perte/Casse' | 'Inventaire';
}

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORIES_LIST = ['Épicerie', 'Viandes', 'Laitiers', 'Charcuterie', 'Frais'];
const CATEGORIES = ['Tous', ...CATEGORIES_LIST];

const CATEGORY_OPTIONS = CATEGORIES_LIST.map((c) => ({ value: c, label: c }));

const ADJUST_REASON_OPTIONS: { value: AdjustFormState['reason']; label: string }[] = [
  { value: 'Livraison reçue', label: 'Livraison reçue' },
  { value: 'Consommation', label: 'Consommation' },
  { value: 'Perte/Casse', label: 'Perte/Casse' },
  { value: 'Inventaire', label: 'Inventaire' },
];

const UNIT_OPTIONS = [
  { value: 'kg', label: 'kg' },
  { value: 'L', label: 'L' },
  { value: 'unités', label: 'unités' },
  { value: 'boîtes', label: 'boîtes' },
  { value: 'pièces', label: 'pièces' },
];

const INITIAL_ITEMS: StockItem[] = [
  { id: '1', name: 'Farine T55', category: 'Épicerie', currentStock: 25, unit: 'kg', minStock: 10, costPerUnit: 0.80, sellPrice: 2.40, supplier: 'Moulins du Sud', lastUpdated: '2026-05-11' },
  { id: '2', name: 'Steak haché 180g', category: 'Viandes', currentStock: 3, unit: 'kg', minStock: 8, costPerUnit: 12.50, sellPrice: 36.00, supplier: 'Boucherie Martin', lastUpdated: '2026-05-11' },
  { id: '3', name: 'Mozzarella fior di latte', category: 'Laitiers', currentStock: 5.5, unit: 'kg', minStock: 4, costPerUnit: 8.40, sellPrice: 24.00, supplier: 'Fromagerie Centrale', lastUpdated: '2026-05-10' },
  { id: '4', name: 'Tomates San Marzano', category: 'Épicerie', currentStock: 12, unit: 'boîtes', minStock: 5, costPerUnit: 3.20, sellPrice: 8.50, supplier: 'Épicerie du Monde', lastUpdated: '2026-05-09' },
  { id: '5', name: "Huile d'olive AOP", category: 'Épicerie', currentStock: 2, unit: 'L', minStock: 5, costPerUnit: 14.00, sellPrice: 38.00, supplier: 'Épicerie du Monde', lastUpdated: '2026-05-11' },
  { id: '6', name: 'Œufs bio', category: 'Frais', currentStock: 120, unit: 'unités', minStock: 50, costPerUnit: 0.35, sellPrice: 0.95, supplier: 'Ferme de la Vallée', lastUpdated: '2026-05-10' },
  { id: '7', name: 'Lait entier', category: 'Laitiers', currentStock: 8, unit: 'L', minStock: 10, costPerUnit: 1.10, sellPrice: 2.80, supplier: 'Fromagerie Centrale', lastUpdated: '2026-05-11' },
  { id: '8', name: 'Sucre en poudre', category: 'Épicerie', currentStock: 15, unit: 'kg', minStock: 5, costPerUnit: 0.90, sellPrice: 2.50, supplier: 'Moulins du Sud', lastUpdated: '2026-05-08' },
  { id: '9', name: 'Bacon fumé', category: 'Viandes', currentStock: 1.5, unit: 'kg', minStock: 3, costPerUnit: 18.00, sellPrice: 52.00, supplier: 'Boucherie Martin', lastUpdated: '2026-05-11' },
  { id: '10', name: 'Salami piquant', category: 'Charcuterie', currentStock: 2.8, unit: 'kg', minStock: 2, costPerUnit: 22.00, sellPrice: 62.00, supplier: 'Épicerie du Monde', lastUpdated: '2026-05-10' },
];

const EMPTY_FORM: ItemFormState = {
  name: '',
  category: CATEGORIES_LIST[0],
  currentStock: '',
  unit: 'kg',
  minStock: '',
  costPerUnit: '',
  sellPrice: '',
  supplier: '',
  image: undefined,
};

const EMPTY_ADJUST: AdjustFormState = {
  amount: '',
  reason: 'Livraison reçue',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getStockStatus(item: StockItem): 'ok' | 'low' | 'critical' {
  const ratio = item.currentStock / item.minStock;
  if (ratio <= 0.5) return 'critical';
  if (ratio < 1) return 'low';
  return 'ok';
}

function computeMargin(sellPrice: number, costPerUnit: number): number | null {
  if (sellPrice <= 0) return null;
  return ((sellPrice - costPerUnit) / sellPrice) * 100;
}

function todayStr(): string {
  return new Date().toISOString().split('T')[0];
}

function generateId(): string {
  return `item-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function InventoryPage() {
  const [items, setItems] = useState<StockItem[]>(INITIAL_ITEMS);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('Tous');
  const [showLowOnly, setShowLowOnly] = useState(false);

  // Add / Edit modal
  const [showItemModal, setShowItemModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [itemForm, setItemForm] = useState<ItemFormState>(EMPTY_FORM);
  const [formError, setFormError] = useState('');

  // Adjust modal
  const [adjustingItem, setAdjustingItem] = useState<StockItem | null>(null);
  const [adjustForm, setAdjustForm] = useState<AdjustFormState>(EMPTY_ADJUST);

  // Delete confirmation
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const imageInputRef = useRef<HTMLInputElement>(null);
  const adjustImageInputRef = useRef<HTMLInputElement>(null);

  // ── Filtering ──

  const filtered = items.filter((item) => {
    const matchSearch = !search || item.name.toLowerCase().includes(search.toLowerCase());
    const matchCat = category === 'Tous' || item.category === category;
    const matchLow = !showLowOnly || getStockStatus(item) !== 'ok';
    return matchSearch && matchCat && matchLow;
  });

  // ── Stats ──

  const lowItems = items.filter((i) => getStockStatus(i) !== 'ok').length;
  const criticalItems = items.filter((i) => getStockStatus(i) === 'critical').length;
  const totalValue = items.reduce((acc, i) => acc + i.currentStock * i.costPerUnit, 0);

  // ── Item Modal helpers ──

  function openAddModal() {
    setEditingId(null);
    setItemForm(EMPTY_FORM);
    setFormError('');
    setShowItemModal(true);
  }

  function openEditModal(item: StockItem) {
    setEditingId(item.id);
    setItemForm({
      name: item.name,
      category: item.category,
      currentStock: String(item.currentStock),
      unit: item.unit,
      minStock: String(item.minStock),
      costPerUnit: String(item.costPerUnit),
      sellPrice: String(item.sellPrice),
      supplier: item.supplier,
      image: item.image,
    });
    setFormError('');
    setShowItemModal(true);
  }

  function closeItemModal() {
    setShowItemModal(false);
    setEditingId(null);
    setFormError('');
  }

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setItemForm((f) => ({ ...f, image: reader.result as string }));
    };
    reader.readAsDataURL(file);
  }

  function validateForm(): boolean {
    if (!itemForm.name.trim()) { setFormError("Le nom de l'article est requis."); return false; }
    if (!itemForm.supplier.trim()) { setFormError('Le fournisseur est requis.'); return false; }
    const cs = parseFloat(itemForm.currentStock);
    const ms = parseFloat(itemForm.minStock);
    const cpu = parseFloat(itemForm.costPerUnit);
    const sp = parseFloat(itemForm.sellPrice);
    if (isNaN(cs) || cs < 0) { setFormError('Stock actuel invalide.'); return false; }
    if (isNaN(ms) || ms < 0) { setFormError('Stock minimum invalide.'); return false; }
    if (isNaN(cpu) || cpu < 0) { setFormError('Coût unitaire invalide.'); return false; }
    if (isNaN(sp) || sp < 0) { setFormError('Prix de vente invalide.'); return false; }
    setFormError('');
    return true;
  }

  function handleSubmitItem() {
    if (!validateForm()) return;
    const base: Omit<StockItem, 'id'> = {
      name: itemForm.name.trim(),
      category: itemForm.category,
      currentStock: parseFloat(itemForm.currentStock),
      unit: itemForm.unit,
      minStock: parseFloat(itemForm.minStock),
      costPerUnit: parseFloat(itemForm.costPerUnit),
      sellPrice: parseFloat(itemForm.sellPrice),
      supplier: itemForm.supplier.trim(),
      lastUpdated: todayStr(),
      image: itemForm.image,
    };
    if (editingId) {
      setItems((prev) => prev.map((i) => (i.id === editingId ? { ...base, id: editingId } : i)));
    } else {
      setItems((prev) => [...prev, { ...base, id: generateId() }]);
    }
    closeItemModal();
  }

  // ── Adjust Modal helpers ──

  function openAdjustModal(item: StockItem) {
    setAdjustingItem(item);
    setAdjustForm(EMPTY_ADJUST);
  }

  function closeAdjustModal() {
    setAdjustingItem(null);
  }

  const handleConfirmAdjust = useCallback(() => {
    if (!adjustingItem) return;
    const delta = parseFloat(adjustForm.amount);
    if (isNaN(delta)) return;
    setItems((prev) =>
      prev.map((i) =>
        i.id === adjustingItem.id
          ? { ...i, currentStock: Math.max(0, i.currentStock + delta), lastUpdated: todayStr() }
          : i,
      ),
    );
    closeAdjustModal();
  }, [adjustingItem, adjustForm.amount]);

  // ── Delete ──

  function handleDelete(id: string) {
    setItems((prev) => prev.filter((i) => i.id !== id));
    setDeleteId(null);
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-900">Inventaire</h1>
          <p className="mt-1 text-sm text-surface-500">{items.length} références · mis à jour aujourd&apos;hui</p>
        </div>
        <Button icon={<Plus className="h-4 w-4" />} onClick={openAddModal}>Ajouter un article</Button>
      </div>

      {/* Stats */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Valeur totale du stock" value={`${totalValue.toFixed(0)}€`} icon={Package} iconColor="text-blue-600 dark:text-blue-400" iconBg="bg-blue-50 dark:bg-blue-900/20" />
        <StatCard title="Articles en stock bas" value={lowItems} icon={TrendingDown} iconColor="text-yellow-600 dark:text-yellow-400" iconBg="bg-yellow-50 dark:bg-yellow-900/20" />
        <StatCard title="Articles critiques" value={criticalItems} icon={AlertTriangle} iconColor="text-red-600 dark:text-red-400" iconBg="bg-red-50 dark:bg-red-900/20" />
        <StatCard title="Références totales" value={items.length} icon={TrendingUp} iconColor="text-green-600 dark:text-green-400" iconBg="bg-green-50 dark:bg-green-900/20" />
      </div>

      {/* Filters */}
      <div className="mb-4 flex flex-wrap gap-3">
        <div className="w-64">
          <Input placeholder="Rechercher..." value={search} onChange={(e) => setSearch(e.target.value)} leftIcon={<Search className="h-4 w-4" />} />
        </div>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={clsx(
                'rounded-xl border px-3 py-2 text-sm font-medium transition-colors',
                category === cat
                  ? 'border-brand-500 bg-brand-50 text-brand-700'
                  : 'border-surface-200 bg-white text-surface-600 hover:border-surface-300',
              )}
            >
              {cat}
            </button>
          ))}
        </div>
        <button
          onClick={() => setShowLowOnly(!showLowOnly)}
          className={clsx(
            'flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium transition-colors',
            showLowOnly
              ? 'border-red-400 bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400'
              : 'border-surface-200 bg-white text-surface-600',
          )}
        >
          <AlertTriangle className="h-4 w-4" />
          Stock bas uniquement
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto overflow-hidden rounded-2xl border border-surface-200 bg-white shadow-sm">
        <table className="w-full min-w-[900px]">
          <thead>
            <tr className="border-b border-surface-100 bg-surface-50">
              {['Article', 'Catégorie', 'Stock actuel', 'Stock min.', 'Coût unit.', 'Prix vente', 'Marge', 'Fournisseur', 'Màj', 'Actions'].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-surface-400">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-100">
            <AnimatePresence initial={false}>
              {filtered.map((item) => {
                const status = getStockStatus(item);
                const ratio = (item.currentStock / item.minStock) * 100;
                const margin = computeMargin(item.sellPrice, item.costPerUnit);
                return (
                  <motion.tr
                    key={item.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="hover:bg-surface-50 transition-colors"
                  >
                    {/* Article */}
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2.5">
                        {item.image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={item.image} alt={item.name} className="h-8 w-8 rounded-lg object-cover border border-surface-200 flex-shrink-0" />
                        ) : (
                          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-surface-100">
                            <Package className="h-4 w-4 text-surface-300" />
                          </div>
                        )}
                        <div>
                          <p className="text-sm font-medium text-surface-900">{item.name}</p>
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="px-4 py-3.5 text-sm text-surface-600">{item.category}</td>

                    {/* Stock actuel */}
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2">
                        <span className={clsx(
                          'text-sm font-semibold',
                          status === 'critical' ? 'text-red-600' : status === 'low' ? 'text-yellow-600' : 'text-surface-900',
                        )}>
                          {item.currentStock} {item.unit}
                        </span>
                      </div>
                      <div className="mt-1 h-1.5 w-20 rounded-full bg-surface-100">
                        <div
                          className={clsx(
                            'h-full rounded-full',
                            status === 'critical' ? 'bg-red-500' : status === 'low' ? 'bg-yellow-500' : 'bg-green-500',
                          )}
                          style={{ width: `${Math.min(100, ratio)}%` }}
                        />
                      </div>
                    </td>

                    {/* Stock min */}
                    <td className="px-4 py-3.5 text-sm text-surface-500">{item.minStock} {item.unit}</td>

                    {/* Coût */}
                    <td className="px-4 py-3.5 text-sm text-surface-700">{item.costPerUnit.toFixed(2)}€</td>

                    {/* Prix vente */}
                    <td className="px-4 py-3.5 text-sm font-medium text-surface-700">{item.sellPrice.toFixed(2)}€</td>

                    {/* Marge */}
                    <td className="px-4 py-3.5">
                      {margin !== null ? (
                        <span className={clsx(
                          'text-sm font-semibold',
                          margin >= 40 ? 'text-green-600' : margin >= 20 ? 'text-yellow-600' : 'text-red-600',
                        )}>
                          {margin.toFixed(1)}%
                        </span>
                      ) : (
                        <span className="text-sm text-surface-300">—</span>
                      )}
                    </td>

                    {/* Fournisseur */}
                    <td className="px-4 py-3.5 text-sm text-surface-600">{item.supplier}</td>

                    {/* Màj */}
                    <td className="px-4 py-3.5 text-xs text-surface-400">{item.lastUpdated}</td>

                    {/* Actions */}
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1.5">
                        <Button
                          size="sm"
                          variant="ghost"
                          icon={<SlidersHorizontal className="h-3.5 w-3.5" />}
                          onClick={() => openAdjustModal(item)}
                        >
                          Ajuster
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          icon={<Pencil className="h-3.5 w-3.5" />}
                          onClick={() => openEditModal(item)}
                        >
                          Modifier
                        </Button>
                        <button
                          onClick={() => setDeleteId(item.id)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-surface-400 transition-colors hover:bg-red-50 hover:text-red-600"
                          title="Supprimer"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                );
              })}
            </AnimatePresence>
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="py-16 text-center text-surface-400">
            <Package className="mx-auto mb-3 h-8 w-8 opacity-40" />
            <p className="text-sm">Aucun article trouvé</p>
          </div>
        )}
      </div>

      {/* ── Add / Edit Item Modal ── */}
      <Modal
        open={showItemModal}
        onClose={closeItemModal}
        title={editingId ? 'Modifier l\'article' : 'Ajouter un article'}
        description={editingId ? 'Modifiez les informations de cet article.' : 'Renseignez les informations du nouvel article.'}
        size="lg"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={closeItemModal}>Annuler</Button>
            <Button icon={<Plus className="h-4 w-4" />} onClick={handleSubmitItem}>
              {editingId ? 'Enregistrer' : 'Ajouter'}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          {formError && (
            <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600 border border-red-200">
              {formError}
            </div>
          )}

          {/* Image upload */}
          <div>
            <p className="mb-1.5 text-sm font-medium text-surface-700">Photo (optionnel)</p>
            <div className="flex items-center gap-3">
              {itemForm.image ? (
                <div className="relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={itemForm.image} alt="preview" className="h-16 w-16 rounded-xl object-cover border border-surface-200" />
                  <button
                    onClick={() => setItemForm((f) => ({ ...f, image: undefined }))}
                    className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ) : (
                <div
                  className="flex h-16 w-16 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-surface-200 text-surface-300 transition-colors hover:border-brand-400 hover:text-brand-400"
                  onClick={() => imageInputRef.current?.click()}
                >
                  <ImageIcon className="h-5 w-5" />
                </div>
              )}
              <input
                ref={imageInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageChange}
              />
              <button
                className="text-sm text-brand-600 underline-offset-2 hover:underline"
                onClick={() => imageInputRef.current?.click()}
              >
                {itemForm.image ? 'Changer' : 'Choisir une image'}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Input
                label="Nom de l'article"
                placeholder="Ex. Farine T55"
                value={itemForm.name}
                onChange={(e) => setItemForm((f) => ({ ...f, name: e.target.value }))}
              />
            </div>
            <Select
              label="Catégorie"
              options={CATEGORY_OPTIONS}
              value={itemForm.category}
              onChange={(e) => setItemForm((f) => ({ ...f, category: e.target.value }))}
            />
            <Select
              label="Unité"
              options={UNIT_OPTIONS}
              value={itemForm.unit}
              onChange={(e) => setItemForm((f) => ({ ...f, unit: e.target.value }))}
            />
            <Input
              label="Stock actuel"
              type="number"
              min="0"
              step="0.1"
              placeholder="0"
              value={itemForm.currentStock}
              onChange={(e) => setItemForm((f) => ({ ...f, currentStock: e.target.value }))}
            />
            <Input
              label="Stock minimum"
              type="number"
              min="0"
              step="0.1"
              placeholder="0"
              value={itemForm.minStock}
              onChange={(e) => setItemForm((f) => ({ ...f, minStock: e.target.value }))}
            />
            <Input
              label="Coût unitaire (€)"
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              value={itemForm.costPerUnit}
              onChange={(e) => setItemForm((f) => ({ ...f, costPerUnit: e.target.value }))}
            />
            <Input
              label="Prix de vente (€)"
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              value={itemForm.sellPrice}
              onChange={(e) => setItemForm((f) => ({ ...f, sellPrice: e.target.value }))}
            />
            <div className="col-span-2">
              <Input
                label="Fournisseur"
                placeholder="Ex. Moulins du Sud"
                value={itemForm.supplier}
                onChange={(e) => setItemForm((f) => ({ ...f, supplier: e.target.value }))}
              />
            </div>
          </div>

          {/* Margin preview */}
          {itemForm.sellPrice && itemForm.costPerUnit && (() => {
            const sp = parseFloat(itemForm.sellPrice);
            const cpu = parseFloat(itemForm.costPerUnit);
            const m = computeMargin(sp, cpu);
            if (m === null || isNaN(m)) return null;
            return (
              <div className={clsx(
                'rounded-xl px-4 py-3 flex items-center justify-between border',
                m >= 40 ? 'bg-green-50 border-green-200' : m >= 20 ? 'bg-yellow-50 border-yellow-200' : 'bg-red-50 border-red-200',
              )}>
                <span className="text-sm text-surface-600">Marge calculée</span>
                <span className={clsx(
                  'text-base font-bold',
                  m >= 40 ? 'text-green-700' : m >= 20 ? 'text-yellow-700' : 'text-red-700',
                )}>
                  {m.toFixed(1)}%
                </span>
              </div>
            );
          })()}
        </div>
      </Modal>

      {/* ── Adjust Stock Modal ── */}
      <Modal
        open={!!adjustingItem}
        onClose={closeAdjustModal}
        title="Ajuster le stock"
        description={adjustingItem ? `Article : ${adjustingItem.name}` : ''}
        size="sm"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={closeAdjustModal}>Annuler</Button>
            <Button
              onClick={handleConfirmAdjust}
              disabled={!adjustForm.amount || isNaN(parseFloat(adjustForm.amount))}
            >
              Confirmer
            </Button>
          </div>
        }
      >
        {adjustingItem && (
          <div className="space-y-4">
            <div className="rounded-xl bg-surface-50 border border-surface-100 px-4 py-3 flex items-center justify-between">
              <span className="text-sm text-surface-500">Stock actuel</span>
              <span className="text-sm font-bold text-surface-900">
                {adjustingItem.currentStock} {adjustingItem.unit}
              </span>
            </div>
            <Input
              label="Ajustement (+ réception / − consommation)"
              type="number"
              step="0.1"
              placeholder="Ex. +10 ou -3"
              value={adjustForm.amount}
              onChange={(e) => setAdjustForm((f) => ({ ...f, amount: e.target.value }))}
            />
            <Select
              label="Raison"
              options={ADJUST_REASON_OPTIONS}
              value={adjustForm.reason}
              onChange={(e) => setAdjustForm((f) => ({ ...f, reason: e.target.value as AdjustFormState['reason'] }))}
            />
            {adjustForm.amount && !isNaN(parseFloat(adjustForm.amount)) && (
              <div className="rounded-xl bg-brand-500/10 px-4 py-3 flex items-center justify-between">
                <span className="text-sm text-surface-600">Nouveau stock</span>
                <span className="text-base font-bold text-brand-600">
                  {Math.max(0, adjustingItem.currentStock + parseFloat(adjustForm.amount))} {adjustingItem.unit}
                </span>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* ── Delete Confirmation Modal ── */}
      <Modal
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        title="Supprimer l'article"
        description="Cette action est irréversible."
        size="sm"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setDeleteId(null)}>Annuler</Button>
            <Button
              variant="danger"
              icon={<Trash2 className="h-4 w-4" />}
              onClick={() => deleteId && handleDelete(deleteId)}
            >
              Supprimer
            </Button>
          </div>
        }
      >
        <p className="text-sm text-surface-600">
          Voulez-vous vraiment supprimer{' '}
          <strong className="text-surface-900">
            {items.find((i) => i.id === deleteId)?.name}
          </strong>{' '}
          de l&apos;inventaire ?
        </p>
      </Modal>
    </div>
  );
}
