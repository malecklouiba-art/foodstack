'use client';

import { useState } from 'react';
import {
  Plus,
  Search,
  Phone,
  Clock,
  TrendingUp,
  ShoppingCart,
  Users,
  AlertCircle,
  Euro,
  Pencil,
  PauseCircle,
  X,
  Package,
  Calendar,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { StatCard } from '@/components/ui/StatCard';
import { Modal } from '@/components/ui/Modal';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Supplier {
  id: string;
  name: string;
  category: string;
  status: 'actif' | 'inactif';
  contact: string | null;
  delaiLivraison: number | null; // days
  depenseMensuelle: number | null;
}

interface PendingOrder {
  id: string;
  supplierId: string;
  supplierName: string;
  items: string;
  total: number;
  expectedDate: string;
  status: 'en attente' | 'confirmée' | 'expédiée';
}

interface OrderForm {
  article: string;
  quantity: string;
  prixUnitaire: string;
}

// ─── Demo data ────────────────────────────────────────────────────────────────

const SUPPLIERS: Supplier[] = [
  { id: '1', name: 'Boucherie Martin', category: 'Viandes', status: 'actif', contact: '01 23 45 67 89', delaiLivraison: 2, depenseMensuelle: 850 },
  { id: '2', name: 'Primeur Dupont', category: 'Légumes', status: 'actif', contact: '01 34 56 78 90', delaiLivraison: 1, depenseMensuelle: 420 },
  { id: '3', name: 'Boissons Express', category: 'Boissons', status: 'actif', contact: '01 45 67 89 01', delaiLivraison: 3, depenseMensuelle: 380 },
  { id: '4', name: 'Épices du Monde', category: 'Épices', status: 'actif', contact: '01 56 78 90 12', delaiLivraison: 5, depenseMensuelle: 210 },
  { id: '5', name: 'Emballages Pro', category: 'Emballages', status: 'actif', contact: '01 67 89 01 23', delaiLivraison: 4, depenseMensuelle: 165 },
  { id: '6', name: 'Bio Ferme', category: 'Légumes', status: 'inactif', contact: null, delaiLivraison: null, depenseMensuelle: null },
  { id: '7', name: 'Fromagerie Blanc', category: 'Produits laitiers', status: 'actif', contact: '01 78 90 12 34', delaiLivraison: 2, depenseMensuelle: 290 },
  { id: '8', name: 'Vins & Spiritueux', category: 'Boissons', status: 'actif', contact: '01 89 01 23 45', delaiLivraison: 7, depenseMensuelle: 315 },
];

const PENDING_ORDERS: PendingOrder[] = [
  { id: 'o1', supplierId: '1', supplierName: 'Boucherie Martin', items: 'Steak haché 180g × 20kg, Côtes de porc × 5kg', total: 312.50, expectedDate: '2026-05-16', status: 'confirmée' },
  { id: 'o2', supplierId: '2', supplierName: 'Primeur Dupont', items: 'Tomates cerises × 10kg, Salade frisée × 30 pièces', total: 87.00, expectedDate: '2026-05-15', status: 'expédiée' },
  { id: 'o3', supplierId: '7', supplierName: 'Fromagerie Blanc', items: 'Mozzarella fior di latte × 8kg', total: 67.20, expectedDate: '2026-05-17', status: 'en attente' },
];

const CATEGORIES = ['Tous', 'Viandes', 'Légumes', 'Boissons', 'Épices', 'Emballages'];

// ─── Helpers ─────────────────────────────────────────────────────────────────

const categoryColors: Record<string, string> = {
  Viandes: 'danger',
  Légumes: 'success',
  Boissons: 'info',
  Épices: 'warning',
  Emballages: 'default',
  'Produits laitiers': 'brand',
};

function getCategoryVariant(cat: string): 'default' | 'success' | 'warning' | 'danger' | 'info' | 'brand' {
  return (categoryColors[cat] as 'default' | 'success' | 'warning' | 'danger' | 'info' | 'brand') ?? 'default';
}

const orderStatusVariant: Record<PendingOrder['status'], 'default' | 'success' | 'warning' | 'info'> = {
  'en attente': 'warning',
  confirmée: 'info',
  expédiée: 'success',
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function SuppliersPage() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('Tous');
  const [orderSupplier, setOrderSupplier] = useState<Supplier | null>(null);
  const [orderForm, setOrderForm] = useState<OrderForm>({ article: '', quantity: '', prixUnitaire: '' });
  const [orderConfirmed, setOrderConfirmed] = useState(false);

  const filtered = SUPPLIERS.filter((s) => {
    const matchSearch = !search || s.name.toLowerCase().includes(search.toLowerCase());
    const matchCat = category === 'Tous' || s.category === category;
    return matchSearch && matchCat;
  });

  const activeCount = SUPPLIERS.filter((s) => s.status === 'actif').length;
  const totalSpend = SUPPLIERS.reduce((acc, s) => acc + (s.depenseMensuelle ?? 0), 0);

  function handleOpenOrder(supplier: Supplier) {
    setOrderSupplier(supplier);
    setOrderForm({ article: '', quantity: '', prixUnitaire: '' });
    setOrderConfirmed(false);
  }

  function handleCloseOrder() {
    setOrderSupplier(null);
    setOrderConfirmed(false);
  }

  function handleConfirmOrder() {
    setOrderConfirmed(true);
    setTimeout(() => {
      setOrderSupplier(null);
      setOrderConfirmed(false);
    }, 1800);
  }

  const orderTotal =
    parseFloat(orderForm.quantity || '0') * parseFloat(orderForm.prixUnitaire || '0');

  return (
    <div className="p-6 space-y-6">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-900">Gestion des fournisseurs</h1>
          <p className="mt-1 text-sm text-surface-500">{SUPPLIERS.length} fournisseurs · {activeCount} actifs</p>
        </div>
        <Button icon={<Plus className="h-4 w-4" />}>Ajouter un fournisseur</Button>
      </div>

      {/* ── Stats ── */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Fournisseurs total"
          value={SUPPLIERS.length}
          icon={Users}
          iconColor="text-blue-600 dark:text-blue-400"
          iconBg="bg-blue-50 dark:bg-blue-900/20"
        />
        <StatCard
          title="Fournisseurs actifs"
          value={activeCount}
          icon={CheckCircle2}
          iconColor="text-green-600 dark:text-green-400"
          iconBg="bg-green-50 dark:bg-green-900/20"
        />
        <StatCard
          title="Commandes en attente"
          value={PENDING_ORDERS.length}
          icon={AlertCircle}
          iconColor="text-orange-600 dark:text-orange-400"
          iconBg="bg-orange-50 dark:bg-orange-900/20"
        />
        <StatCard
          title="Dépenses ce mois"
          value={`${totalSpend.toLocaleString('fr-FR')}€`}
          icon={TrendingUp}
          iconColor="text-purple-600 dark:text-purple-400"
          iconBg="bg-purple-50 dark:bg-purple-900/20"
        />
      </div>

      {/* ── Filters ── */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="w-64">
          <Input
            placeholder="Rechercher un fournisseur..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftIcon={<Search className="h-4 w-4" />}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={clsx(
                'rounded-xl border px-3 py-2 text-sm font-medium transition-colors',
                category === cat
                  ? 'border-brand-500 bg-brand-500/10 text-brand-600'
                  : 'border-surface-200 bg-white text-surface-600 hover:border-surface-300 dark:bg-surface-800 dark:border-surface-700 dark:text-surface-400',
              )}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* ── Supplier Table ── */}
      <div className="overflow-hidden rounded-2xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 shadow-sm">
        <table className="w-full">
          <thead>
            <tr className="border-b border-surface-100 dark:border-surface-700 bg-surface-50 dark:bg-surface-900">
              {['Fournisseur', 'Catégorie', 'Statut', 'Contact', 'Délai livraison', 'Dépense/mois', 'Actions'].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-surface-400">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-100 dark:divide-surface-700">
            <AnimatePresence initial={false}>
              {filtered.map((supplier) => (
                <motion.tr
                  key={supplier.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="hover:bg-surface-50 dark:hover:bg-surface-900/50 transition-colors"
                >
                  {/* Name */}
                  <td className="px-4 py-3.5">
                    <p className="text-sm font-semibold text-surface-900 dark:text-surface-100">{supplier.name}</p>
                  </td>

                  {/* Category */}
                  <td className="px-4 py-3.5">
                    <Badge variant={getCategoryVariant(supplier.category)}>{supplier.category}</Badge>
                  </td>

                  {/* Status */}
                  <td className="px-4 py-3.5">
                    <Badge
                      variant={supplier.status === 'actif' ? 'success' : 'default'}
                      dot
                    >
                      {supplier.status === 'actif' ? 'Actif' : 'Inactif'}
                    </Badge>
                  </td>

                  {/* Contact */}
                  <td className="px-4 py-3.5">
                    {supplier.contact ? (
                      <span className="flex items-center gap-1.5 text-sm text-surface-600 dark:text-surface-400">
                        <Phone className="h-3.5 w-3.5 text-surface-400" />
                        {supplier.contact}
                      </span>
                    ) : (
                      <span className="text-sm text-surface-300 dark:text-surface-600">—</span>
                    )}
                  </td>

                  {/* Délai */}
                  <td className="px-4 py-3.5">
                    {supplier.delaiLivraison != null ? (
                      <span className="flex items-center gap-1.5 text-sm text-surface-600 dark:text-surface-400">
                        <Clock className="h-3.5 w-3.5 text-surface-400" />
                        {supplier.delaiLivraison}j
                      </span>
                    ) : (
                      <span className="text-sm text-surface-300 dark:text-surface-600">—</span>
                    )}
                  </td>

                  {/* Spend */}
                  <td className="px-4 py-3.5">
                    {supplier.depenseMensuelle != null ? (
                      <span className="flex items-center gap-1 text-sm font-medium text-surface-700 dark:text-surface-300">
                        <Euro className="h-3.5 w-3.5 text-surface-400" />
                        {supplier.depenseMensuelle.toLocaleString('fr-FR')}€
                      </span>
                    ) : (
                      <span className="text-sm text-surface-300 dark:text-surface-600">—</span>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="primary"
                        icon={<ShoppingCart className="h-3.5 w-3.5" />}
                        disabled={supplier.status === 'inactif'}
                        onClick={() => handleOpenOrder(supplier)}
                      >
                        Passer commande
                      </Button>
                      <Button size="sm" variant="ghost" icon={<Pencil className="h-3.5 w-3.5" />}>
                        Modifier
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        icon={<PauseCircle className="h-3.5 w-3.5" />}
                        className="text-orange-600 border-orange-200 hover:bg-orange-50 dark:text-orange-400 dark:border-orange-900/40 dark:hover:bg-orange-900/20"
                      >
                        Suspendre
                      </Button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </AnimatePresence>
          </tbody>
        </table>

        {filtered.length === 0 && (
          <div className="py-16 text-center text-surface-400">
            <Package className="mx-auto mb-3 h-8 w-8 opacity-40" />
            <p className="text-sm">Aucun fournisseur trouvé</p>
          </div>
        )}
      </div>

      {/* ── Pending Orders ── */}
      <div>
        <h2 className="mb-4 text-lg font-semibold text-surface-900 dark:text-surface-100">
          Commandes en attente
          <span className="ml-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-orange-100 text-xs font-bold text-orange-700">
            {PENDING_ORDERS.length}
          </span>
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {PENDING_ORDERS.map((order) => (
            <motion.div
              key={order.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 p-5 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-surface-900 dark:text-surface-100">{order.supplierName}</p>
                  <p className="mt-1 text-xs text-surface-500 dark:text-surface-400 leading-relaxed">{order.items}</p>
                </div>
                <Badge variant={orderStatusVariant[order.status]}>{order.status}</Badge>
              </div>
              <div className="mt-4 flex items-center justify-between border-t border-surface-100 dark:border-surface-700 pt-3">
                <span className="flex items-center gap-1 text-sm font-bold text-surface-900 dark:text-surface-100">
                  <Euro className="h-4 w-4 text-surface-400" />
                  {order.total.toFixed(2)}€
                </span>
                <span className="flex items-center gap-1.5 text-xs text-surface-500">
                  <Calendar className="h-3.5 w-3.5" />
                  Livraison le {new Date(order.expectedDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* ── Order Modal ── */}
      <Modal
        open={!!orderSupplier}
        onClose={handleCloseOrder}
        title={orderSupplier ? `Passer commande — ${orderSupplier.name}` : ''}
        description="Saisissez les détails de votre commande"
        size="md"
        footer={
          orderConfirmed ? null : (
            <div className="flex justify-end gap-3">
              <Button variant="ghost" onClick={handleCloseOrder}>
                Annuler
              </Button>
              <Button
                icon={<CheckCircle2 className="h-4 w-4" />}
                onClick={handleConfirmOrder}
                disabled={!orderForm.article || !orderForm.quantity || !orderForm.prixUnitaire}
              >
                Confirmer commande
              </Button>
            </div>
          )
        }
      >
        {orderConfirmed ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center gap-3 py-6 text-center"
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
              <CheckCircle2 className="h-7 w-7 text-green-600 dark:text-green-400" />
            </div>
            <p className="text-base font-semibold text-surface-900 dark:text-surface-100">Commande confirmée !</p>
            <p className="text-sm text-surface-500">La commande a bien été transmise à {orderSupplier?.name}.</p>
          </motion.div>
        ) : (
          <div className="space-y-4">
            <Input
              label="Article"
              placeholder="Ex. Steak haché 180g"
              value={orderForm.article}
              onChange={(e) => setOrderForm((f) => ({ ...f, article: e.target.value }))}
              leftIcon={<Package className="h-4 w-4" />}
            />
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Quantité"
                type="number"
                placeholder="0"
                min="1"
                value={orderForm.quantity}
                onChange={(e) => setOrderForm((f) => ({ ...f, quantity: e.target.value }))}
              />
              <Input
                label="Prix unitaire (€)"
                type="number"
                placeholder="0.00"
                min="0"
                step="0.01"
                value={orderForm.prixUnitaire}
                onChange={(e) => setOrderForm((f) => ({ ...f, prixUnitaire: e.target.value }))}
                leftIcon={<Euro className="h-4 w-4" />}
              />
            </div>
            {orderTotal > 0 && (
              <div className="rounded-xl bg-brand-500/10 px-4 py-3 flex items-center justify-between">
                <span className="text-sm text-surface-600 dark:text-surface-400">Total estimé</span>
                <span className="text-base font-bold text-brand-600 dark:text-brand-400">
                  {orderTotal.toFixed(2)}€
                </span>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
