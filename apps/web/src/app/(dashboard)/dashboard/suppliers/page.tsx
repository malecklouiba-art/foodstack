'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Building2, Mail, Phone, Globe, MapPin,
  Plus, Pencil, Trash2, Search, Package,
  RefreshCw, X,
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

interface Supplier {
  id: string;
  name: string;
  contact?: string;
  email?: string;
  phone?: string;
  website?: string;
  address?: string;
  notes?: string;
  _count?: { items: number };
  createdAt?: string;
}

interface SupplierForm {
  name: string;
  contact: string;
  email: string;
  phone: string;
  website: string;
  address: string;
  notes: string;
}

// ── Seed data ─────────────────────────────────────────────────────────────────

const SEED: Supplier[] = [
  {
    id: 'sup-1',
    name: 'Métro Cash & Carry',
    contact: 'Jean-Pierre Martin',
    email: 'jp.martin@metro.fr',
    phone: '+33 1 42 00 10 20',
    website: 'https://www.metro.fr',
    address: '12 rue du Commerce, Paris 75015',
    notes: 'Livraison chaque lundi matin.',
    _count: { items: 18 },
    createdAt: '2024-01-10T09:00:00Z',
  },
  {
    id: 'sup-2',
    name: 'Boulangerie Dupont',
    contact: 'Marie Dupont',
    email: 'contact@boulangerie-dupont.fr',
    phone: '+33 1 43 22 11 00',
    website: '',
    address: '4 allée des Fours, Vincennes 94300',
    notes: 'Pains et viennoiseries artisanales.',
    _count: { items: 5 },
    createdAt: '2024-02-15T08:30:00Z',
  },
  {
    id: 'sup-3',
    name: 'FraisPro Légumes',
    contact: 'Ali Benali',
    email: 'commandes@fraispro.com',
    phone: '+33 6 78 90 12 34',
    website: 'https://fraispro.com',
    address: 'MIN de Rungis, Hall C5',
    notes: '',
    _count: { items: 12 },
    createdAt: '2024-03-01T07:00:00Z',
  },
  {
    id: 'sup-4',
    name: 'Viandes & Co',
    contact: '',
    email: 'pro@viandes-co.fr',
    phone: '+33 1 55 66 77 88',
    website: 'https://viandes-co.fr',
    address: '8 rue des Bouchers, Clichy 92110',
    notes: 'Commande minimum 50 kg.',
    _count: { items: 9 },
    createdAt: '2024-04-20T10:00:00Z',
  },
  {
    id: 'sup-5',
    name: 'SodaDistrib',
    contact: 'Lucie Renard',
    email: '',
    phone: '+33 9 87 65 43 21',
    website: '',
    address: '',
    notes: 'Boissons gazeuses, jus, eaux.',
    _count: { items: 7 },
    createdAt: '2024-05-05T11:00:00Z',
  },
];

const EMPTY_FORM: SupplierForm = {
  name: '',
  contact: '',
  email: '',
  phone: '',
  website: '',
  address: '',
  notes: '',
};

// ── Page ──────────────────────────────────────────────────────────────────────

export default function SuppliersPage() {
  const ctxId = useRestaurantId();
  const authUser = useAuthStore((s) => s.user);
  const restaurantId = ctxId || authUser?.restaurantIds?.[0] || '';

  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [editSupplier, setEditSupplier] = useState<Supplier | null>(null);
  const [deleteSupplier, setDeleteSupplier] = useState<Supplier | null>(null);
  const [form, setForm] = useState<SupplierForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const load = useCallback((silent = false) => {
    if (!restaurantId) return;
    if (!silent) setLoading(true);
    (api.get(`/suppliers?restaurantId=${restaurantId}`) as Promise<Supplier[]>)
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) setSuppliers(data);
        else setSuppliers(SEED);
      })
      .catch(() => { setSuppliers(SEED); })
      .finally(() => setLoading(false));
  }, [restaurantId]);

  useEffect(() => { load(); }, [load]);

  const filtered = suppliers.filter((s) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      s.name.toLowerCase().includes(q) ||
      (s.contact ?? '').toLowerCase().includes(q) ||
      (s.email ?? '').toLowerCase().includes(q)
    );
  });

  // Stats
  const totalSuppliers = suppliers.length;
  const withEmail = suppliers.filter((s) => !!s.email).length;
  const withItems = suppliers.filter((s) => (s._count?.items ?? 0) > 0).length;

  // ── Handlers ────────────────────────────────────────────────────────────────

  async function handleCreate() {
    if (!form.name || !restaurantId) return;
    setSaving(true);
    const body = { ...form, restaurantId };
    try {
      const created = await (api.post('/suppliers', body) as Promise<Supplier>);
      setSuppliers((prev) => [created, ...prev]);
    } catch {
      setSuppliers((prev) => [
        { ...body, id: `sup-${Date.now()}`, _count: { items: 0 } },
        ...prev,
      ]);
    } finally {
      setSaving(false);
      setCreateOpen(false);
      setForm(EMPTY_FORM);
    }
  }

  async function handleSaveEdit() {
    if (!editSupplier) return;
    setSaving(true);
    const patch: SupplierForm = { ...form };
    setSuppliers((prev) =>
      prev.map((s) => (s.id === editSupplier.id ? { ...s, ...patch } : s))
    );
    setEditSupplier(null);
    api.patch(`/suppliers/${editSupplier.id}`, patch).catch(() => {});
    setSaving(false);
  }

  async function handleDelete() {
    if (!deleteSupplier) return;
    const id = deleteSupplier.id;
    setSuppliers((prev) => prev.filter((s) => s.id !== id));
    setDeleteSupplier(null);
    api.delete(`/suppliers/${id}`).catch(() => {});
  }

  function openEdit(supplier: Supplier) {
    setEditSupplier(supplier);
    setForm({
      name: supplier.name,
      contact: supplier.contact ?? '',
      email: supplier.email ?? '',
      phone: supplier.phone ?? '',
      website: supplier.website ?? '',
      address: supplier.address ?? '',
      notes: supplier.notes ?? '',
    });
  }

  // ── Form fields component ────────────────────────────────────────────────────

  const SupplierFormFields = () => (
    <div className="grid grid-cols-2 gap-4">
      {/* Name — full width */}
      <div className="col-span-2">
        <label className="mb-1 block text-sm font-medium text-surface-700 dark:text-surface-300">
          Nom *
        </label>
        <Input
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          placeholder="Ex : Métro Cash & Carry"
        />
      </div>
      {/* Contact */}
      <div>
        <label className="mb-1 block text-sm font-medium text-surface-700 dark:text-surface-300">
          Contact
        </label>
        <Input
          value={form.contact}
          onChange={(e) => setForm((f) => ({ ...f, contact: e.target.value }))}
          placeholder="Nom du responsable"
        />
      </div>
      {/* Email */}
      <div>
        <label className="mb-1 block text-sm font-medium text-surface-700 dark:text-surface-300">
          Email
        </label>
        <Input
          type="email"
          value={form.email}
          onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
          placeholder="commandes@exemple.fr"
        />
      </div>
      {/* Phone */}
      <div>
        <label className="mb-1 block text-sm font-medium text-surface-700 dark:text-surface-300">
          Téléphone
        </label>
        <Input
          value={form.phone}
          onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
          placeholder="+33 1 23 45 67 89"
        />
      </div>
      {/* Website */}
      <div>
        <label className="mb-1 block text-sm font-medium text-surface-700 dark:text-surface-300">
          Site web
        </label>
        <Input
          value={form.website}
          onChange={(e) => setForm((f) => ({ ...f, website: e.target.value }))}
          placeholder="https://exemple.fr"
        />
      </div>
      {/* Address — full width */}
      <div className="col-span-2">
        <label className="mb-1 block text-sm font-medium text-surface-700 dark:text-surface-300">
          Adresse
        </label>
        <Input
          value={form.address}
          onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
          placeholder="12 rue du Commerce, Paris 75015"
        />
      </div>
      {/* Notes — full width */}
      <div className="col-span-2">
        <label className="mb-1 block text-sm font-medium text-surface-700 dark:text-surface-300">
          Notes
        </label>
        <textarea
          rows={3}
          value={form.notes}
          onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
          placeholder="Conditions, délais, informations utiles…"
          className="w-full rounded-xl border border-surface-200 bg-white px-3 py-2 text-sm text-surface-900 placeholder:text-surface-400 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-200 dark:border-surface-600 dark:bg-surface-700 dark:text-white dark:placeholder:text-surface-400 dark:focus:border-brand-500 dark:focus:ring-brand-500/20 resize-none"
        />
      </div>
    </div>
  );

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6 p-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500/10">
            <Building2 className="h-5 w-5 text-brand-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-surface-900 dark:text-white">Fournisseurs</h1>
            <p className="text-sm text-surface-500">Gestion des fournisseurs du restaurant</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            icon={<RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />}
            onClick={() => load()}
          />
          <Button
            variant="primary"
            icon={<Plus className="h-4 w-4" />}
            onClick={() => { setForm(EMPTY_FORM); setCreateOpen(true); }}
          >
            Ajouter un fournisseur
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          title="Total fournisseurs"
          value={totalSuppliers}
          icon={Building2}
        />
        <StatCard
          title="Avec email"
          value={withEmail}
          icon={Mail}
          iconColor="text-blue-600"
          iconBg="bg-blue-50"
        />
        <StatCard
          title="Avec articles liés"
          value={withItems}
          icon={Package}
          iconColor="text-green-600"
          iconBg="bg-green-50"
        />
      </div>

      {/* Search bar */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-surface-400" />
        <Input
          placeholder="Rechercher un fournisseur…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-600"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Supplier cards grid */}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="animate-pulse rounded-2xl border border-surface-200 bg-white p-5 shadow-sm dark:border-surface-700 dark:bg-surface-800"
            >
              <div className="mb-3 h-5 w-2/3 rounded bg-surface-200 dark:bg-surface-700" />
              <div className="space-y-2">
                <div className="h-4 w-1/2 rounded bg-surface-100 dark:bg-surface-700" />
                <div className="h-4 w-3/4 rounded bg-surface-100 dark:bg-surface-700" />
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        /* Empty state */
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-surface-200 bg-surface-50 py-20 text-center dark:border-surface-700 dark:bg-surface-800/50">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-50 dark:bg-brand-900/20">
            <Building2 className="h-8 w-8 text-brand-400" />
          </div>
          <h3 className="mb-1 text-lg font-semibold text-surface-700 dark:text-surface-300">
            {search ? 'Aucun fournisseur trouvé' : 'Aucun fournisseur'}
          </h3>
          <p className="mb-6 max-w-xs text-sm text-surface-400">
            {search
              ? `Aucun résultat pour "${search}".`
              : 'Commencez par ajouter vos fournisseurs pour gérer vos approvisionnements.'}
          </p>
          {!search && (
            <Button
              variant="primary"
              icon={<Plus className="h-4 w-4" />}
              onClick={() => { setForm(EMPTY_FORM); setCreateOpen(true); }}
            >
              Ajouter un fournisseur
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <AnimatePresence>
            {filtered.map((supplier, i) => {
              const itemCount = supplier._count?.items ?? 0;
              return (
                <motion.div
                  key={supplier.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: i * 0.04 }}
                  className="group relative overflow-hidden rounded-2xl border border-surface-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md dark:border-surface-700 dark:bg-surface-800"
                >
                  {/* Card header */}
                  <div className="mb-4 flex items-start justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 dark:bg-brand-900/20">
                        <Building2 className="h-5 w-5 text-brand-500" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="truncate font-semibold text-surface-900 dark:text-white">
                          {supplier.name}
                        </h3>
                        {supplier.contact && (
                          <p className="truncate text-xs text-surface-500">{supplier.contact}</p>
                        )}
                      </div>
                    </div>
                    {/* Item count badge */}
                    {itemCount > 0 && (
                      <Badge variant="default">
                        <Package className="mr-1 h-3 w-3" />
                        {itemCount}
                      </Badge>
                    )}
                  </div>

                  {/* Contact details */}
                  <div className="space-y-2">
                    {supplier.email && (
                      <a
                        href={`mailto:${supplier.email}`}
                        className="flex items-center gap-2 text-sm text-surface-600 hover:text-brand-600 dark:text-surface-400 dark:hover:text-brand-400 transition-colors"
                      >
                        <Mail className="h-3.5 w-3.5 shrink-0 text-surface-400" />
                        <span className="truncate">{supplier.email}</span>
                      </a>
                    )}
                    {supplier.phone && (
                      <a
                        href={`tel:${supplier.phone}`}
                        className="flex items-center gap-2 text-sm text-surface-600 hover:text-brand-600 dark:text-surface-400 dark:hover:text-brand-400 transition-colors"
                      >
                        <Phone className="h-3.5 w-3.5 shrink-0 text-surface-400" />
                        <span className="truncate">{supplier.phone}</span>
                      </a>
                    )}
                    {supplier.website && (
                      <a
                        href={supplier.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm text-surface-600 hover:text-brand-600 dark:text-surface-400 dark:hover:text-brand-400 transition-colors"
                      >
                        <Globe className="h-3.5 w-3.5 shrink-0 text-surface-400" />
                        <span className="truncate">{supplier.website.replace(/^https?:\/\//, '')}</span>
                      </a>
                    )}
                    {supplier.address && (
                      <div className="flex items-start gap-2 text-sm text-surface-500 dark:text-surface-400">
                        <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-surface-400" />
                        <span className="line-clamp-2">{supplier.address}</span>
                      </div>
                    )}
                    {!supplier.email && !supplier.phone && !supplier.website && !supplier.address && (
                      <p className="text-xs italic text-surface-400">Aucun contact renseigné</p>
                    )}
                  </div>

                  {/* Notes */}
                  {supplier.notes && (
                    <p className="mt-3 line-clamp-2 rounded-lg bg-surface-50 px-3 py-2 text-xs text-surface-500 dark:bg-surface-700 dark:text-surface-400">
                      {supplier.notes}
                    </p>
                  )}

                  {/* Action buttons */}
                  <div className="mt-4 flex items-center justify-end gap-2 border-t border-surface-100 pt-3 dark:border-surface-700">
                    <button
                      onClick={() => openEdit(supplier)}
                      className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-surface-600 hover:bg-surface-100 hover:text-surface-800 transition-colors dark:text-surface-400 dark:hover:bg-surface-700 dark:hover:text-surface-200"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      Modifier
                    </button>
                    <button
                      onClick={() => setDeleteSupplier(supplier)}
                      className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-surface-400 hover:bg-red-50 hover:text-red-600 transition-colors dark:hover:bg-red-900/20 dark:hover:text-red-400"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Supprimer
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Create modal */}
      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Ajouter un fournisseur"
        size="md"
      >
        <div className="space-y-4">
          <SupplierFormFields />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setCreateOpen(false)}>Annuler</Button>
            <Button
              variant="primary"
              loading={saving}
              onClick={handleCreate}
              disabled={!form.name}
            >
              Créer
            </Button>
          </div>
        </div>
      </Modal>

      {/* Edit modal */}
      <Modal
        open={!!editSupplier}
        onClose={() => setEditSupplier(null)}
        title="Modifier le fournisseur"
        size="md"
      >
        <div className="space-y-4">
          <SupplierFormFields />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setEditSupplier(null)}>Annuler</Button>
            <Button variant="primary" loading={saving} onClick={handleSaveEdit}>
              Enregistrer
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete confirmation */}
      <Modal
        open={!!deleteSupplier}
        onClose={() => setDeleteSupplier(null)}
        title="Supprimer le fournisseur"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-surface-600 dark:text-surface-400">
            Voulez-vous vraiment supprimer{' '}
            <strong className="text-surface-900 dark:text-white">{deleteSupplier?.name}</strong> ?
            Cette action est irréversible.
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setDeleteSupplier(null)}>Annuler</Button>
            <Button variant="danger" onClick={handleDelete}>Supprimer</Button>
          </div>
        </div>
      </Modal>

    </div>
  );
}
