'use client';

import { useState, useRef, useCallback } from 'react';
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
  PlayCircle,
  Trash2,
  X,
  Package,
  Calendar,
  CheckCircle2,
  Image as ImageIcon,
  Mail,
  Truck,
  Download,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { StatCard } from '@/components/ui/StatCard';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Supplier {
  id: string;
  name: string;
  category: string;
  status: 'actif' | 'inactif';
  phone: string;
  email: string;
  deliveryDelay: number; // days
  monthlySpend: number;
  logo?: string; // base64
}

interface PendingOrder {
  id: string;
  supplierId: string;
  supplierName: string;
  items: string;
  total: number;
  expectedDate: string;
  status: 'en attente' | 'confirmée' | 'expédiée' | 'reçue';
}

interface OrderForm {
  article: string;
  quantity: string;
  prixUnitaire: string;
  expectedDate: string;
}

interface SupplierForm {
  name: string;
  category: string;
  phone: string;
  email: string;
  deliveryDelay: string;
  monthlySpend: string;
  logo?: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORIES_LIST = ['Viandes', 'Légumes', 'Boissons', 'Épices', 'Emballages', 'Produits laitiers'];
const CATEGORIES = ['Tous', ...CATEGORIES_LIST];

const CATEGORY_OPTIONS = CATEGORIES_LIST.map((c) => ({ value: c, label: c }));

const EMPTY_SUPPLIER_FORM: SupplierForm = {
  name: '',
  category: CATEGORIES_LIST[0],
  phone: '',
  email: '',
  deliveryDelay: '',
  monthlySpend: '',
  logo: undefined,
};

const EMPTY_ORDER_FORM: OrderForm = {
  article: '',
  quantity: '',
  prixUnitaire: '',
  expectedDate: '',
};

const INITIAL_SUPPLIERS: Supplier[] = [
  { id: '1', name: 'Boucherie Martin', category: 'Viandes', status: 'actif', phone: '01 23 45 67 89', email: 'contact@boucherie-martin.fr', deliveryDelay: 2, monthlySpend: 850 },
  { id: '2', name: 'Primeur Dupont', category: 'Légumes', status: 'actif', phone: '01 34 56 78 90', email: 'primeur.dupont@gmail.com', deliveryDelay: 1, monthlySpend: 420 },
  { id: '3', name: 'Boissons Express', category: 'Boissons', status: 'actif', phone: '01 45 67 89 01', email: 'orders@boissons-express.fr', deliveryDelay: 3, monthlySpend: 380 },
  { id: '4', name: 'Épices du Monde', category: 'Épices', status: 'actif', phone: '01 56 78 90 12', email: 'info@epices-du-monde.fr', deliveryDelay: 5, monthlySpend: 210 },
  { id: '5', name: 'Emballages Pro', category: 'Emballages', status: 'actif', phone: '01 67 89 01 23', email: 'pro@emballages-pro.fr', deliveryDelay: 4, monthlySpend: 165 },
  { id: '6', name: 'Bio Ferme', category: 'Légumes', status: 'inactif', phone: '', email: '', deliveryDelay: 3, monthlySpend: 0 },
  { id: '7', name: 'Fromagerie Blanc', category: 'Produits laitiers', status: 'actif', phone: '01 78 90 12 34', email: 'fromagerie.blanc@fr.fr', deliveryDelay: 2, monthlySpend: 290 },
  { id: '8', name: 'Vins & Spiritueux', category: 'Boissons', status: 'actif', phone: '01 89 01 23 45', email: 'ventes@vins-spiritueux.fr', deliveryDelay: 7, monthlySpend: 315 },
];

const INITIAL_ORDERS: PendingOrder[] = [
  { id: 'o1', supplierId: '1', supplierName: 'Boucherie Martin', items: 'Steak haché 180g × 20kg, Côtes de porc × 5kg', total: 312.50, expectedDate: '2026-05-16', status: 'confirmée' },
  { id: 'o2', supplierId: '2', supplierName: 'Primeur Dupont', items: 'Tomates cerises × 10kg, Salade frisée × 30 pièces', total: 87.00, expectedDate: '2026-05-15', status: 'expédiée' },
  { id: 'o3', supplierId: '7', supplierName: 'Fromagerie Blanc', items: 'Mozzarella fior di latte × 8kg', total: 67.20, expectedDate: '2026-05-17', status: 'en attente' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

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
  reçue: 'default',
};

function generateId(): string {
  return `sup-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function generateOrderId(): string {
  return `ord-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function todayPlusDays(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>(INITIAL_SUPPLIERS);
  const [orders, setOrders] = useState<PendingOrder[]>(INITIAL_ORDERS);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('Tous');

  // Add / Edit supplier modal
  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const [editingSupplierId, setEditingSupplierId] = useState<string | null>(null);
  const [supplierForm, setSupplierForm] = useState<SupplierForm>(EMPTY_SUPPLIER_FORM);
  const [supplierFormError, setSupplierFormError] = useState('');

  // Delete confirmation
  const [deleteSupplierId, setDeleteSupplierId] = useState<string | null>(null);

  // Order modal
  const [orderSupplier, setOrderSupplier] = useState<Supplier | null>(null);
  const [orderForm, setOrderForm] = useState<OrderForm>(EMPTY_ORDER_FORM);
  const [orderConfirmed, setOrderConfirmed] = useState(false);

  // Reception toast
  const [receivedOrderId, setReceivedOrderId] = useState<string | null>(null);

  const logoInputRef = useRef<HTMLInputElement>(null);

  // ── Filtering ──

  const filtered = suppliers.filter((s) => {
    const matchSearch = !search || s.name.toLowerCase().includes(search.toLowerCase());
    const matchCat = category === 'Tous' || s.category === category;
    return matchSearch && matchCat;
  });

  // ── Stats ──

  const activeCount = suppliers.filter((s) => s.status === 'actif').length;
  const totalSpend = suppliers.reduce((acc, s) => acc + s.monthlySpend, 0);
  const pendingCount = orders.filter((o) => o.status !== 'reçue').length;

  // ── Supplier Modal ──

  function openAddSupplierModal() {
    setEditingSupplierId(null);
    setSupplierForm(EMPTY_SUPPLIER_FORM);
    setSupplierFormError('');
    setShowSupplierModal(true);
  }

  function openEditSupplierModal(supplier: Supplier) {
    setEditingSupplierId(supplier.id);
    setSupplierForm({
      name: supplier.name,
      category: supplier.category,
      phone: supplier.phone,
      email: supplier.email,
      deliveryDelay: String(supplier.deliveryDelay),
      monthlySpend: String(supplier.monthlySpend),
      logo: supplier.logo,
    });
    setSupplierFormError('');
    setShowSupplierModal(true);
  }

  function closeSupplierModal() {
    setShowSupplierModal(false);
    setEditingSupplierId(null);
    setSupplierFormError('');
  }

  function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setSupplierForm((f) => ({ ...f, logo: reader.result as string }));
    };
    reader.readAsDataURL(file);
  }

  function validateSupplierForm(): boolean {
    if (!supplierForm.name.trim()) { setSupplierFormError('Le nom du fournisseur est requis.'); return false; }
    const dd = parseInt(supplierForm.deliveryDelay, 10);
    if (supplierForm.deliveryDelay && (isNaN(dd) || dd < 0)) { setSupplierFormError('Délai de livraison invalide.'); return false; }
    setSupplierFormError('');
    return true;
  }

  function handleSubmitSupplier() {
    if (!validateSupplierForm()) return;
    const base: Omit<Supplier, 'id'> = {
      name: supplierForm.name.trim(),
      category: supplierForm.category,
      status: 'actif',
      phone: supplierForm.phone.trim(),
      email: supplierForm.email.trim(),
      deliveryDelay: parseInt(supplierForm.deliveryDelay || '0', 10),
      monthlySpend: parseFloat(supplierForm.monthlySpend || '0'),
      logo: supplierForm.logo,
    };
    if (editingSupplierId) {
      setSuppliers((prev) =>
        prev.map((s) =>
          s.id === editingSupplierId
            ? { ...base, id: editingSupplierId, status: s.status }
            : s,
        ),
      );
    } else {
      setSuppliers((prev) => [...prev, { ...base, id: generateId() }]);
    }
    closeSupplierModal();
  }

  // ── Toggle status ──

  function handleToggleStatus(id: string) {
    setSuppliers((prev) =>
      prev.map((s) =>
        s.id === id ? { ...s, status: s.status === 'actif' ? 'inactif' : 'actif' } : s,
      ),
    );
  }

  // ── Delete ──

  function handleDeleteSupplier(id: string) {
    setSuppliers((prev) => prev.filter((s) => s.id !== id));
    setDeleteSupplierId(null);
  }

  // ── Order Modal ──

  function handleOpenOrder(supplier: Supplier) {
    setOrderSupplier(supplier);
    setOrderForm({
      ...EMPTY_ORDER_FORM,
      expectedDate: todayPlusDays(supplier.deliveryDelay || 3),
    });
    setOrderConfirmed(false);
  }

  function handleCloseOrder() {
    setOrderSupplier(null);
    setOrderConfirmed(false);
  }

  const handleConfirmOrder = useCallback(() => {
    if (!orderSupplier) return;
    const qty = parseFloat(orderForm.quantity || '0');
    const price = parseFloat(orderForm.prixUnitaire || '0');
    const total = qty * price;
    const newOrder: PendingOrder = {
      id: generateOrderId(),
      supplierId: orderSupplier.id,
      supplierName: orderSupplier.name,
      items: `${orderForm.article} × ${orderForm.quantity}`,
      total,
      expectedDate: orderForm.expectedDate || todayPlusDays(orderSupplier.deliveryDelay || 3),
      status: 'en attente',
    };
    setOrders((prev) => [...prev, newOrder]);
    setOrderConfirmed(true);
    setTimeout(() => {
      setOrderSupplier(null);
      setOrderConfirmed(false);
    }, 1800);
  }, [orderSupplier, orderForm]);

  const orderTotal =
    parseFloat(orderForm.quantity || '0') * parseFloat(orderForm.prixUnitaire || '0');

  // ── Receive order ──

  function handleReceiveOrder(orderId: string) {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: 'reçue' } : o)),
    );
    setReceivedOrderId(orderId);
    setTimeout(() => setReceivedOrderId(null), 3000);
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  const handleExportXLSX = async () => {
    const XLSX = await import('xlsx');
    const wb = XLSX.utils.book_new();

    const supplierSheet = XLSX.utils.aoa_to_sheet([
      ['Nom', 'Catégorie', 'Statut', 'Téléphone', 'Email', 'Délai livraison (j)', 'Dépenses/mois (€)'],
      ...suppliers.map((s) => [s.name, s.category, s.status, s.phone, s.email, s.deliveryDelay, s.monthlySpend]),
    ]);
    supplierSheet['!cols'] = [{ wch: 20 }, { wch: 16 }, { wch: 10 }, { wch: 16 }, { wch: 26 }, { wch: 18 }, { wch: 18 }];

    const ordersSheet = XLSX.utils.aoa_to_sheet([
      ['N° commande', 'Fournisseur', 'Articles', 'Total (€)', 'Date attendue', 'Statut'],
      ...orders.map((o) => [o.id, o.supplierName, o.items, o.total, o.expectedDate, o.status]),
    ]);
    ordersSheet['!cols'] = [{ wch: 14 }, { wch: 20 }, { wch: 28 }, { wch: 10 }, { wch: 14 }, { wch: 12 }];

    XLSX.utils.book_append_sheet(wb, supplierSheet, 'Fournisseurs');
    XLSX.utils.book_append_sheet(wb, ordersSheet, 'Commandes fournisseurs');
    XLSX.writeFile(wb, `fournisseurs-foodstack-${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <div className="p-6 space-y-6">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-900">Gestion des fournisseurs</h1>
          <p className="mt-1 text-sm text-surface-500">{suppliers.length} fournisseurs · {activeCount} actifs</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportXLSX}
            className="flex items-center gap-1.5 rounded-xl border border-green-200 bg-green-50 px-3 py-1.5 text-sm font-medium text-green-700 transition-colors hover:bg-green-100"
          >
            <Download className="h-3.5 w-3.5" /> Excel
          </button>
          <Button icon={<Plus className="h-4 w-4" />} onClick={openAddSupplierModal}>Ajouter un fournisseur</Button>
        </div>
      </div>

      {/* ── Stats ── */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Fournisseurs total" value={suppliers.length} icon={Users} iconColor="text-blue-600 dark:text-blue-400" iconBg="bg-blue-50 dark:bg-blue-900/20" />
        <StatCard title="Fournisseurs actifs" value={activeCount} icon={CheckCircle2} iconColor="text-green-600 dark:text-green-400" iconBg="bg-green-50 dark:bg-green-900/20" />
        <StatCard title="Commandes en cours" value={pendingCount} icon={AlertCircle} iconColor="text-orange-600 dark:text-orange-400" iconBg="bg-orange-50 dark:bg-orange-900/20" />
        <StatCard title="Dépenses ce mois" value={`${totalSpend.toLocaleString('fr-FR')}€`} icon={TrendingUp} iconColor="text-purple-600 dark:text-purple-400" iconBg="bg-purple-50 dark:bg-purple-900/20" />
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
      <div className="overflow-x-auto overflow-hidden rounded-2xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 shadow-sm">
        <table className="w-full min-w-[900px]">
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
                  {/* Name + Logo */}
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2.5">
                      {supplier.logo ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={supplier.logo} alt={supplier.name} className="h-8 w-8 rounded-lg object-cover border border-surface-200 flex-shrink-0" />
                      ) : (
                        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-surface-100 dark:bg-surface-700">
                          <Truck className="h-4 w-4 text-surface-300 dark:text-surface-500" />
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-semibold text-surface-900 dark:text-surface-100">{supplier.name}</p>
                        {supplier.email && (
                          <p className="text-xs text-surface-400 dark:text-surface-500">{supplier.email}</p>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Category */}
                  <td className="px-4 py-3.5">
                    <Badge variant={getCategoryVariant(supplier.category)}>{supplier.category}</Badge>
                  </td>

                  {/* Status */}
                  <td className="px-4 py-3.5">
                    <Badge variant={supplier.status === 'actif' ? 'success' : 'default'} dot>
                      {supplier.status === 'actif' ? 'Actif' : 'Inactif'}
                    </Badge>
                  </td>

                  {/* Contact */}
                  <td className="px-4 py-3.5">
                    {supplier.phone ? (
                      <span className="flex items-center gap-1.5 text-sm text-surface-600 dark:text-surface-400">
                        <Phone className="h-3.5 w-3.5 text-surface-400" />
                        {supplier.phone}
                      </span>
                    ) : (
                      <span className="text-sm text-surface-300 dark:text-surface-600">—</span>
                    )}
                  </td>

                  {/* Délai */}
                  <td className="px-4 py-3.5">
                    {supplier.deliveryDelay > 0 ? (
                      <span className="flex items-center gap-1.5 text-sm text-surface-600 dark:text-surface-400">
                        <Clock className="h-3.5 w-3.5 text-surface-400" />
                        {supplier.deliveryDelay}j
                      </span>
                    ) : (
                      <span className="text-sm text-surface-300 dark:text-surface-600">—</span>
                    )}
                  </td>

                  {/* Spend */}
                  <td className="px-4 py-3.5">
                    {supplier.monthlySpend > 0 ? (
                      <span className="flex items-center gap-1 text-sm font-medium text-surface-700 dark:text-surface-300">
                        <Euro className="h-3.5 w-3.5 text-surface-400" />
                        {supplier.monthlySpend.toLocaleString('fr-FR')}€
                      </span>
                    ) : (
                      <span className="text-sm text-surface-300 dark:text-surface-600">—</span>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <Button
                        size="sm"
                        variant="primary"
                        icon={<ShoppingCart className="h-3.5 w-3.5" />}
                        disabled={supplier.status === 'inactif'}
                        onClick={() => handleOpenOrder(supplier)}
                      >
                        Commander
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        icon={<Pencil className="h-3.5 w-3.5" />}
                        onClick={() => openEditSupplierModal(supplier)}
                      >
                        Modifier
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        icon={supplier.status === 'actif' ? <PauseCircle className="h-3.5 w-3.5" /> : <PlayCircle className="h-3.5 w-3.5" />}
                        className={clsx(
                          supplier.status === 'actif'
                            ? 'text-orange-600 border-orange-200 hover:bg-orange-50 dark:text-orange-400 dark:border-orange-900/40 dark:hover:bg-orange-900/20'
                            : 'text-green-600 border-green-200 hover:bg-green-50 dark:text-green-400 dark:border-green-900/40 dark:hover:bg-green-900/20',
                        )}
                        onClick={() => handleToggleStatus(supplier.id)}
                      >
                        {supplier.status === 'actif' ? 'Suspendre' : 'Réactiver'}
                      </Button>
                      <button
                        onClick={() => setDeleteSupplierId(supplier.id)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-surface-400 transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400"
                        title="Retirer"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
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
          Commandes en cours
          {pendingCount > 0 && (
            <span className="ml-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-orange-100 text-xs font-bold text-orange-700">
              {pendingCount}
            </span>
          )}
        </h2>
        {orders.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-surface-200 py-12 text-center text-surface-400">
            <Package className="mx-auto mb-3 h-7 w-7 opacity-40" />
            <p className="text-sm">Aucune commande en cours</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <AnimatePresence>
              {orders.map((order) => (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className={clsx(
                    'rounded-2xl border bg-white dark:bg-surface-800 p-5 shadow-sm',
                    order.status === 'reçue'
                      ? 'border-green-200 dark:border-green-900/40 bg-green-50/50 dark:bg-green-900/10'
                      : 'border-surface-200 dark:border-surface-700',
                  )}
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
                      {new Date(order.expectedDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                    </span>
                  </div>
                  {order.status !== 'reçue' && (
                    <div className="mt-3">
                      {receivedOrderId === order.id ? (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="flex items-center gap-2 rounded-xl bg-green-100 dark:bg-green-900/30 px-3 py-2 text-sm font-medium text-green-700 dark:text-green-400"
                        >
                          <CheckCircle2 className="h-4 w-4" />
                          Réception confirmée !
                        </motion.div>
                      ) : (
                        <Button
                          size="sm"
                          variant="ghost"
                          fullWidth
                          icon={<CheckCircle2 className="h-3.5 w-3.5" />}
                          className="text-green-600 border-green-200 hover:bg-green-50 dark:text-green-400 dark:border-green-900/40 dark:hover:bg-green-900/20"
                          onClick={() => handleReceiveOrder(order.id)}
                        >
                          Réceptionner
                        </Button>
                      )}
                    </div>
                  )}
                  {order.status === 'reçue' && (
                    <div className="mt-3 flex items-center gap-2 text-xs text-green-600 dark:text-green-400">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Commande réceptionnée
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* ── Add / Edit Supplier Modal ── */}
      <Modal
        open={showSupplierModal}
        onClose={closeSupplierModal}
        title={editingSupplierId ? 'Modifier le fournisseur' : 'Ajouter un fournisseur'}
        description={editingSupplierId ? 'Modifiez les informations du fournisseur.' : 'Renseignez les informations du nouveau fournisseur.'}
        size="lg"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={closeSupplierModal}>Annuler</Button>
            <Button icon={<Plus className="h-4 w-4" />} onClick={handleSubmitSupplier}>
              {editingSupplierId ? 'Enregistrer' : 'Ajouter'}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          {supplierFormError && (
            <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600 border border-red-200">
              {supplierFormError}
            </div>
          )}

          {/* Logo upload */}
          <div>
            <p className="mb-1.5 text-sm font-medium text-surface-700">Logo (optionnel)</p>
            <div className="flex items-center gap-3">
              {supplierForm.logo ? (
                <div className="relative">
                  <img src={supplierForm.logo} alt="logo preview" className="h-16 w-16 rounded-xl object-cover border border-surface-200" />
                  <button
                    onClick={() => setSupplierForm((f) => ({ ...f, logo: undefined }))}
                    className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ) : (
                <div
                  className="flex h-16 w-16 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-surface-200 text-surface-300 transition-colors hover:border-brand-400 hover:text-brand-400"
                  onClick={() => logoInputRef.current?.click()}
                >
                  <ImageIcon className="h-5 w-5" />
                </div>
              )}
              <input
                ref={logoInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleLogoChange}
              />
              <button
                className="text-sm text-brand-600 underline-offset-2 hover:underline"
                onClick={() => logoInputRef.current?.click()}
              >
                {supplierForm.logo ? 'Changer' : 'Choisir un logo'}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Input
                label="Nom du fournisseur"
                placeholder="Ex. Boucherie Martin"
                value={supplierForm.name}
                onChange={(e) => setSupplierForm((f) => ({ ...f, name: e.target.value }))}
              />
            </div>
            <Select
              label="Catégorie"
              options={CATEGORY_OPTIONS}
              value={supplierForm.category}
              onChange={(e) => setSupplierForm((f) => ({ ...f, category: e.target.value }))}
            />
            <Input
              label="Téléphone"
              placeholder="01 23 45 67 89"
              value={supplierForm.phone}
              onChange={(e) => setSupplierForm((f) => ({ ...f, phone: e.target.value }))}
              leftIcon={<Phone className="h-4 w-4" />}
            />
            <div className="col-span-2">
              <Input
                label="E-mail"
                type="email"
                placeholder="contact@fournisseur.fr"
                value={supplierForm.email}
                onChange={(e) => setSupplierForm((f) => ({ ...f, email: e.target.value }))}
                leftIcon={<Mail className="h-4 w-4" />}
              />
            </div>
            <Input
              label="Délai de livraison (jours)"
              type="number"
              min="0"
              placeholder="0"
              value={supplierForm.deliveryDelay}
              onChange={(e) => setSupplierForm((f) => ({ ...f, deliveryDelay: e.target.value }))}
              leftIcon={<Clock className="h-4 w-4" />}
            />
            <Input
              label="Dépense mensuelle (€)"
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              value={supplierForm.monthlySpend}
              onChange={(e) => setSupplierForm((f) => ({ ...f, monthlySpend: e.target.value }))}
              leftIcon={<Euro className="h-4 w-4" />}
            />
          </div>
        </div>
      </Modal>

      {/* ── Delete Confirmation Modal ── */}
      <Modal
        open={!!deleteSupplierId}
        onClose={() => setDeleteSupplierId(null)}
        title="Retirer le fournisseur"
        description="Cette action est irréversible."
        size="sm"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setDeleteSupplierId(null)}>Annuler</Button>
            <Button
              variant="danger"
              icon={<Trash2 className="h-4 w-4" />}
              onClick={() => deleteSupplierId && handleDeleteSupplier(deleteSupplierId)}
            >
              Retirer
            </Button>
          </div>
        }
      >
        <p className="text-sm text-surface-600">
          Voulez-vous vraiment retirer{' '}
          <strong className="text-surface-900">
            {suppliers.find((s) => s.id === deleteSupplierId)?.name}
          </strong>{' '}
          de votre liste de fournisseurs ?
        </p>
      </Modal>

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
              <Button variant="ghost" onClick={handleCloseOrder}>Annuler</Button>
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
            <Input
              label="Date de livraison attendue"
              type="date"
              value={orderForm.expectedDate}
              onChange={(e) => setOrderForm((f) => ({ ...f, expectedDate: e.target.value }))}
              leftIcon={<Calendar className="h-4 w-4" />}
            />
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
