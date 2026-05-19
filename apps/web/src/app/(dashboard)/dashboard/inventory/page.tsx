'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Package, AlertTriangle, Plus, Search, Pencil,
  Trash2, TrendingDown, RefreshCw, X,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { StatCard } from '@/components/ui/StatCard';
import api from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import { useRestaurantId } from '@/contexts/restaurant-context';

// ── Types ─────────────────────────────────────────────────────────────────────

interface InventoryItem {
  id: string;
  name: string;
  sku?: string;
  category: string;
  currentStock: number;
  unit: string;
  minStock: number;
  maxStock?: number;
  costPerUnit: number;
  lastRestockedAt?: string;
}

interface ItemForm {
  name: string;
  sku: string;
  category: string;
  currentStock: string;
  unit: string;
  minStock: string;
  maxStock: string;
  costPerUnit: string;
}

// ── Seed data ─────────────────────────────────────────────────────────────────

const EMPTY_FORM: ItemForm = {
  name: '', sku: '', category: '', currentStock: '', unit: 'kg',
  minStock: '', maxStock: '', costPerUnit: '',
};

const CATEGORIES = ['Viandes', 'Surgelés', 'Boulangerie', 'Produits laitiers', 'Légumes', 'Sauces', 'Huiles', 'Boissons', 'Emballages', 'Autre'];

// ── Helpers ───────────────────────────────────────────────────────────────────

function stockStatus(item: InventoryItem): 'critical' | 'low' | 'ok' {
  if (item.currentStock <= 0) return 'critical';
  if (item.currentStock < item.minStock) return 'low';
  return 'ok';
}

const STATUS_CFG = {
  critical: { label: 'Épuisé',    variant: 'danger'  as const, dot: 'bg-red-500'    },
  low:      { label: 'Stock bas', variant: 'warning' as const, dot: 'bg-amber-400'  },
  ok:       { label: 'OK',        variant: 'success' as const, dot: 'bg-green-500'  },
};

function stockPct(item: InventoryItem): number {
  const max = item.maxStock ?? item.minStock * 4;
  if (max <= 0) return 0;
  return Math.min(100, Math.round((item.currentStock / max) * 100));
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function InventoryPage() {
  const ctxId = useRestaurantId();
  const authUser = useAuthStore((s) => s.user);
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState<string>('all');
  const [loading, setLoading] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [editItem, setEditItem] = useState<InventoryItem | null>(null);
  const [deleteItem, setDeleteItem] = useState<InventoryItem | null>(null);
  const [adjustItem, setAdjustItem] = useState<InventoryItem | null>(null);
  const [adjustQty, setAdjustQty] = useState('');
  const [form, setForm] = useState<ItemForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const restaurantId = ctxId || authUser?.restaurantIds?.[0];

  const load = useCallback((silent = false) => {
    if (!restaurantId) return;
    if (!silent) setLoading(true);
    (api.get(`/inventory?restaurantId=${restaurantId}`) as Promise<InventoryItem[]>)
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) setItems(data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [restaurantId]);

  useEffect(() => { load(); }, [load]);

  const categories = ['all', ...Array.from(new Set(items.map((i) => i.category)))];

  const filtered = items.filter((i) => {
    if (catFilter !== 'all' && i.category !== catFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return i.name.toLowerCase().includes(q) || (i.sku ?? '').toLowerCase().includes(q) || i.category.toLowerCase().includes(q);
    }
    return true;
  });

  const lowStockItems = items.filter((i) => stockStatus(i) !== 'ok');
  const totalValue = items.reduce((s, i) => s + i.currentStock * i.costPerUnit, 0);

  async function handleCreate() {
    if (!form.name || !form.currentStock || !restaurantId) return;
    setSaving(true);
    const body = {
      restaurantId,
      name: form.name,
      sku: form.sku || undefined,
      category: form.category || 'Autre',
      currentStock: parseFloat(form.currentStock),
      unit: form.unit,
      minStock: parseFloat(form.minStock) || 0,
      maxStock: form.maxStock ? parseFloat(form.maxStock) : undefined,
      costPerUnit: parseFloat(form.costPerUnit) || 0,
    };
    try {
      const created = await (api.post('/inventory', body) as Promise<InventoryItem>);
      setItems((prev) => [created, ...prev]);
    } catch {
      setItems((prev) => [{ ...body, id: `inv-${Date.now()}` }, ...prev]);
    } finally {
      setSaving(false);
      setCreateOpen(false);
      setForm(EMPTY_FORM);
    }
  }

  async function handleSaveEdit() {
    if (!editItem) return;
    setSaving(true);
    const patch = {
      name: form.name,
      sku: form.sku || undefined,
      category: form.category || editItem.category,
      currentStock: parseFloat(form.currentStock),
      unit: form.unit,
      minStock: parseFloat(form.minStock) || 0,
      maxStock: form.maxStock ? parseFloat(form.maxStock) : undefined,
      costPerUnit: parseFloat(form.costPerUnit) || 0,
    };
    setItems((prev) => prev.map((i) => i.id === editItem.id ? { ...i, ...patch } : i));
    setEditItem(null);
    api.patch(`/inventory/${editItem.id}`, patch).catch(() => { /* best-effort */ });
    setSaving(false);
  }

  async function handleDelete() {
    if (!deleteItem) return;
    const id = deleteItem.id;
    setItems((prev) => prev.filter((i) => i.id !== id));
    setDeleteItem(null);
    api.delete(`/inventory/${id}`).catch(() => { /* best-effort */ });
  }

  async function handleAdjust() {
    if (!adjustItem || !adjustQty) return;
    const delta = parseFloat(adjustQty);
    if (isNaN(delta)) return;
    setSaving(true);
    const newStock = Math.max(0, adjustItem.currentStock + delta);
    setItems((prev) => prev.map((i) => i.id === adjustItem.id ? { ...i, currentStock: newStock } : i));
    setAdjustItem(null);
    setAdjustQty('');
    api.patch(`/inventory/${adjustItem.id}/adjust-stock`, { quantity: delta }).catch(() => { /* best-effort */ });
    setSaving(false);
  }

  function openEdit(item: InventoryItem) {
    setEditItem(item);
    setForm({
      name: item.name,
      sku: item.sku ?? '',
      category: item.category,
      currentStock: String(item.currentStock),
      unit: item.unit,
      minStock: String(item.minStock),
      maxStock: item.maxStock ? String(item.maxStock) : '',
      costPerUnit: String(item.costPerUnit),
    });
  }

  const ItemFormFields = () => (
    <div className="grid grid-cols-2 gap-4">
      <div className="col-span-2">
        <label className="mb-1 block text-sm font-medium text-surface-700">Nom *</label>
        <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Ex : Steak haché" />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-surface-700">SKU</label>
        <Input value={form.sku} onChange={(e) => setForm((f) => ({ ...f, sku: e.target.value }))} placeholder="Ex : MEAT-001" />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-surface-700">Catégorie</label>
        <select
          value={form.category}
          onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
          className="h-10 w-full rounded-xl border border-surface-200 bg-white px-3 text-sm text-surface-900 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-200"
        >
          <option value="">-- Choisir --</option>
          {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-surface-700">Stock actuel *</label>
        <Input type="number" value={form.currentStock} onChange={(e) => setForm((f) => ({ ...f, currentStock: e.target.value }))} placeholder="0" />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-surface-700">Unité</label>
        <Input value={form.unit} onChange={(e) => setForm((f) => ({ ...f, unit: e.target.value }))} placeholder="kg / L / pcs" />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-surface-700">Stock minimum</label>
        <Input type="number" value={form.minStock} onChange={(e) => setForm((f) => ({ ...f, minStock: e.target.value }))} placeholder="0" />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-surface-700">Stock maximum</label>
        <Input type="number" value={form.maxStock} onChange={(e) => setForm((f) => ({ ...f, maxStock: e.target.value }))} placeholder="Optionnel" />
      </div>
      <div className="col-span-2">
        <label className="mb-1 block text-sm font-medium text-surface-700">Coût unitaire (€)</label>
        <Input type="number" step="0.01" value={form.costPerUnit} onChange={(e) => setForm((f) => ({ ...f, costPerUnit: e.target.value }))} placeholder="0.00" />
      </div>
    </div>
  );

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500/10">
            <Package className="h-5 w-5 text-brand-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-surface-900">Inventaire</h1>
            <p className="text-sm text-surface-500">Stocks et approvisionnements</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            icon={<RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />}
            onClick={() => load()}
          />
          <Button variant="primary" icon={<Plus className="h-4 w-4" />} onClick={() => { setForm(EMPTY_FORM); setCreateOpen(true); }}>
            Ajouter
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard title="Total articles" value={items.length} icon={Package} />
        <StatCard title="Stock bas / épuisé" value={lowStockItems.length} icon={AlertTriangle} iconColor={lowStockItems.length > 0 ? 'text-amber-600' : undefined} />
        <StatCard title="Valeur totale" value={`${totalValue.toFixed(0)} €`} icon={TrendingDown} />
        <StatCard title="Catégories" value={categories.length - 1} icon={Package} />
      </div>

      {/* Low-stock alert strip */}
      {lowStockItems.length > 0 && (
        <div className="flex flex-wrap gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3">
          <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
          <span className="text-sm font-semibold text-amber-800 mr-1">Stock bas :</span>
          {lowStockItems.map((i) => (
            <span key={i.id} className={`text-xs font-medium px-2 py-0.5 rounded-full ${stockStatus(i) === 'critical' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
              {i.name} ({i.currentStock} {i.unit})
            </span>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-surface-400" />
          <Input placeholder="Rechercher…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <div className="flex flex-wrap gap-2">
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setCatFilter(c)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                catFilter === c
                  ? 'bg-brand-500 text-black'
                  : 'bg-surface-100 text-surface-600 hover:bg-surface-200'
              }`}
            >
              {c === 'all' ? 'Tous' : c}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-surface-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-surface-100 bg-surface-50">
              <th className="py-3 pl-4 pr-3 text-left font-semibold text-surface-600">Article</th>
              <th className="px-3 py-3 text-left font-semibold text-surface-600">Catégorie</th>
              <th className="px-3 py-3 text-right font-semibold text-surface-600">Stock</th>
              <th className="px-3 py-3 text-right font-semibold text-surface-600">Min</th>
              <th className="px-3 py-3 text-right font-semibold text-surface-600">Coût/u</th>
              <th className="px-3 py-3 text-left font-semibold text-surface-600">Niveau</th>
              <th className="px-3 py-3 text-right font-semibold text-surface-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-100">
            <AnimatePresence>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-surface-400">
                    {loading ? 'Chargement…' : 'Aucun article trouvé'}
                  </td>
                </tr>
              ) : (
                filtered.map((item, i) => {
                  const st = stockStatus(item);
                  const cfg = STATUS_CFG[st];
                  const pct = stockPct(item);
                  return (
                    <motion.tr
                      key={item.id}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ delay: i * 0.015 }}
                      className="hover:bg-surface-50"
                    >
                      <td className="py-3 pl-4 pr-3">
                        <div className="font-medium text-surface-900">{item.name}</div>
                        {item.sku && <div className="text-xs text-surface-400">{item.sku}</div>}
                      </td>
                      <td className="px-3 py-3 text-surface-500">{item.category}</td>
                      <td className="px-3 py-3 text-right">
                        <span className="font-semibold text-surface-900">{item.currentStock}</span>
                        <span className="ml-1 text-xs text-surface-400">{item.unit}</span>
                      </td>
                      <td className="px-3 py-3 text-right text-surface-500">{item.minStock} {item.unit}</td>
                      <td className="px-3 py-3 text-right text-surface-600">{item.costPerUnit.toFixed(2)} €</td>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-20 rounded-full bg-surface-100 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${st === 'critical' ? 'bg-red-500' : st === 'low' ? 'bg-amber-400' : 'bg-green-500'}`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <Badge variant={cfg.variant}>{cfg.label}</Badge>
                        </div>
                      </td>
                      <td className="px-3 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => { setAdjustItem(item); setAdjustQty(''); }}
                            className="rounded-lg px-2 py-1.5 text-xs font-medium text-brand-700 hover:bg-brand-50 transition-colors"
                            title="Ajuster le stock"
                          >
                            ± Ajuster
                          </button>
                          <button onClick={() => openEdit(item)} className="rounded-lg p-1.5 text-surface-500 hover:bg-surface-100 hover:text-surface-700">
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button onClick={() => setDeleteItem(item)} className="rounded-lg p-1.5 text-surface-400 hover:bg-red-50 hover:text-red-600">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  );
                })
              )}
            </AnimatePresence>
          </tbody>
        </table>
      </div>

      {/* Create modal */}
      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Ajouter un article" size="md">
        <div className="space-y-4">
          <ItemFormFields />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setCreateOpen(false)}>Annuler</Button>
            <Button variant="primary" loading={saving} onClick={handleCreate} disabled={!form.name || !form.currentStock}>
              Créer
            </Button>
          </div>
        </div>
      </Modal>

      {/* Edit modal */}
      <Modal open={!!editItem} onClose={() => setEditItem(null)} title="Modifier l'article" size="md">
        <div className="space-y-4">
          <ItemFormFields />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setEditItem(null)}>Annuler</Button>
            <Button variant="primary" loading={saving} onClick={handleSaveEdit}>
              Enregistrer
            </Button>
          </div>
        </div>
      </Modal>

      {/* Adjust stock modal */}
      {adjustItem && (
        <Modal
          open
          onClose={() => setAdjustItem(null)}
          title={`Ajuster le stock — ${adjustItem.name}`}
          description={`Stock actuel : ${adjustItem.currentStock} ${adjustItem.unit}`}
          size="sm"
        >
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-surface-700">Variation de stock</label>
              <Input
                type="number"
                placeholder="Ex : +10 ou -3"
                value={adjustQty}
                onChange={(e) => setAdjustQty(e.target.value)}
                autoFocus
              />
              <p className="mt-1 text-xs text-surface-400">Valeur positive pour un ajout, négative pour une déduction</p>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setAdjustItem(null)}>Annuler</Button>
              <Button variant="primary" loading={saving} onClick={handleAdjust} disabled={!adjustQty}>
                Confirmer
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Delete confirm */}
      <Modal open={!!deleteItem} onClose={() => setDeleteItem(null)} title="Supprimer l'article" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-surface-600">
            Voulez-vous vraiment supprimer <strong>{deleteItem?.name}</strong> ? Cette action est irréversible.
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setDeleteItem(null)}>Annuler</Button>
            <Button variant="danger" onClick={handleDelete}>Supprimer</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
