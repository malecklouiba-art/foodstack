'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, Search, Pencil, Trash2, X, Users, Mail, Phone, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { StatCard } from '@/components/ui/StatCard';
import { Skeleton } from '@/components/ui/Skeleton';
import { useAuthStore } from '@/store/auth';
import api from '@/lib/api';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Supplier {
  id: string;
  restaurantId: string;
  name: string;
  contact?: string;
  email?: string;
  phone?: string;
  website?: string;
  address?: string;
  notes?: string;
  createdAt: string;
}

type SupplierFormData = Omit<Supplier, 'id' | 'restaurantId' | 'createdAt'>;

const EMPTY_FORM: SupplierFormData = {
  name: '',
  contact: '',
  email: '',
  phone: '',
  website: '',
  address: '',
  notes: '',
};

// ─── Modal ─────────────────────────────────────────────────────────────────────

interface SupplierModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: SupplierFormData) => Promise<void>;
  initial?: Supplier | null;
  saving: boolean;
}

function SupplierModal({ open, onClose, onSubmit, initial, saving }: SupplierModalProps) {
  const [form, setForm] = useState<SupplierFormData>(EMPTY_FORM);
  const [nameError, setNameError] = useState('');

  useEffect(() => {
    if (open) {
      setForm(
        initial
          ? {
              name: initial.name,
              contact: initial.contact ?? '',
              email: initial.email ?? '',
              phone: initial.phone ?? '',
              website: initial.website ?? '',
              address: initial.address ?? '',
              notes: initial.notes ?? '',
            }
          : EMPTY_FORM
      );
      setNameError('');
    }
  }, [open, initial]);

  function set(field: keyof SupplierFormData, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (field === 'name' && value.trim()) setNameError('');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) {
      setNameError('Le nom est requis');
      return;
    }
    await onSubmit(form);
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-lg rounded-2xl border border-surface-200 bg-white shadow-2xl dark:border-surface-700 dark:bg-surface-900">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-surface-100 px-6 py-4 dark:border-surface-700">
          <h2 className="text-lg font-semibold text-surface-900 dark:text-surface-50">
            {initial ? 'Modifier le fournisseur' : 'Ajouter un fournisseur'}
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-surface-400 transition-colors hover:bg-surface-100 hover:text-surface-600 dark:hover:bg-surface-800 dark:hover:text-surface-300"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <Input
            label="Nom"
            required
            placeholder="Ex : Boucherie Martin"
            value={form.name}
            onChange={(e) => set('name', e.target.value)}
            error={nameError}
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Contact"
              placeholder="Prénom Nom"
              value={form.contact}
              onChange={(e) => set('contact', e.target.value)}
            />
            <Input
              label="Email"
              type="email"
              placeholder="contact@example.com"
              value={form.email}
              onChange={(e) => set('email', e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Téléphone"
              type="tel"
              placeholder="+33 1 23 45 67 89"
              value={form.phone}
              onChange={(e) => set('phone', e.target.value)}
            />
            <Input
              label="Site web"
              type="url"
              placeholder="https://..."
              value={form.website}
              onChange={(e) => set('website', e.target.value)}
            />
          </div>

          <Input
            label="Adresse"
            placeholder="12 rue de la Paix, 75001 Paris"
            value={form.address}
            onChange={(e) => set('address', e.target.value)}
          />

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-surface-700 dark:text-surface-300">Notes</label>
            <textarea
              placeholder="Informations complémentaires..."
              rows={3}
              value={form.notes}
              onChange={(e) => set('notes', e.target.value)}
              className="w-full rounded-xl border border-surface-200 bg-white px-3 py-2.5 text-sm text-surface-900 placeholder:text-surface-400 transition-all duration-200 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-surface-700 dark:bg-surface-800 dark:text-surface-50 dark:placeholder:text-surface-500 resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={onClose} disabled={saving}>
              Annuler
            </Button>
            <Button type="submit" loading={saving}>
              {initial ? 'Enregistrer' : 'Ajouter'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Skeleton rows ──────────────────────────────────────────────────────────────

function TableSkeleton() {
  return (
    <>
      {Array.from({ length: 5 }).map((_, i) => (
        <tr key={i} className="border-b border-surface-100 dark:border-surface-700">
          {Array.from({ length: 5 }).map((__, j) => (
            <td key={j} className="px-4 py-4">
              <Skeleton className="h-4 w-full" rounded="md" />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function SuppliersPage() {
  const user = useAuthStore((s) => s.user);
  const restaurantId = user?.restaurantIds?.[0] ?? '';

  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [saving, setSaving] = useState(false);

  // ── Fetch ────────────────────────────────────────────────────────────────────
  const fetchSuppliers = useCallback(async () => {
    if (!restaurantId) return;
    try {
      setLoading(true);
      const data = await api.get<never, Supplier[]>(`/suppliers?restaurantId=${restaurantId}`);
      setSuppliers(data);
    } catch (err) {
      console.error('Failed to fetch suppliers', err);
    } finally {
      setLoading(false);
    }
  }, [restaurantId]);

  useEffect(() => {
    fetchSuppliers();
  }, [fetchSuppliers]);

  // ── Create / Update ──────────────────────────────────────────────────────────
  const handleSubmit = useCallback(
    async (formData: SupplierFormData) => {
      if (!restaurantId) return;
      setSaving(true);
      try {
        if (editingSupplier) {
          const updated = await api.patch<never, Supplier>(
            `/suppliers/${editingSupplier.id}`,
            formData
          );
          setSuppliers((prev) =>
            prev.map((s) => (s.id === editingSupplier.id ? updated : s))
          );
        } else {
          const created = await api.post<never, Supplier>('/suppliers', {
            ...formData,
            restaurantId,
          });
          setSuppliers((prev) => [created, ...prev]);
        }
        setModalOpen(false);
        setEditingSupplier(null);
      } catch (err) {
        console.error('Failed to save supplier', err);
      } finally {
        setSaving(false);
      }
    },
    [editingSupplier, restaurantId]
  );

  // ── Delete ───────────────────────────────────────────────────────────────────
  const handleDelete = useCallback(async (supplier: Supplier) => {
    if (!window.confirm(`Supprimer le fournisseur "${supplier.name}" ?`)) return;
    // Optimistic update
    setSuppliers((prev) => prev.filter((s) => s.id !== supplier.id));
    try {
      await api.delete(`/suppliers/${supplier.id}`);
    } catch (err) {
      console.error('Failed to delete supplier', err);
      // Rollback
      setSuppliers((prev) => [supplier, ...prev]);
    }
  }, []);

  // ── Helpers ──────────────────────────────────────────────────────────────────
  function openCreate() {
    setEditingSupplier(null);
    setModalOpen(true);
  }

  function openEdit(supplier: Supplier) {
    setEditingSupplier(supplier);
    setModalOpen(true);
  }

  function closeModal() {
    if (saving) return;
    setModalOpen(false);
    setEditingSupplier(null);
  }

  const filtered = suppliers.filter(
    (s) => !search || s.name.toLowerCase().includes(search.toLowerCase())
  );

  const withEmail = suppliers.filter((s) => s.email).length;
  const withPhone = suppliers.filter((s) => s.phone).length;

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-50">Fournisseurs</h1>
          <p className="mt-1 text-sm text-surface-500 dark:text-surface-400">
            {loading ? 'Chargement…' : `${suppliers.length} fournisseur${suppliers.length !== 1 ? 's' : ''} enregistré${suppliers.length !== 1 ? 's' : ''}`}
          </p>
        </div>
        <Button icon={<Plus className="h-4 w-4" />} onClick={openCreate}>
          Ajouter un fournisseur
        </Button>
      </div>

      {/* Stats */}
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard
          title="Total fournisseurs"
          value={loading ? '—' : suppliers.length}
          icon={Building2}
          iconColor="text-brand-600"
          iconBg="bg-brand-50"
          loading={loading}
        />
        <StatCard
          title="Avec email"
          value={loading ? '—' : withEmail}
          icon={Mail}
          iconColor="text-blue-600"
          iconBg="bg-blue-50"
          loading={loading}
        />
        <StatCard
          title="Avec téléphone"
          value={loading ? '—' : withPhone}
          icon={Phone}
          iconColor="text-green-600"
          iconBg="bg-green-50"
          loading={loading}
        />
      </div>

      {/* Search */}
      <div className="mb-4 w-72">
        <Input
          placeholder="Rechercher un fournisseur…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          leftIcon={<Search className="h-4 w-4" />}
        />
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-surface-200 bg-white shadow-sm dark:border-surface-700 dark:bg-surface-900">
        <table className="w-full">
          <thead>
            <tr className="border-b border-surface-100 bg-surface-50 dark:border-surface-700 dark:bg-surface-800">
              {['Nom', 'Contact', 'Email', 'Téléphone', 'Actions'].map((h) => (
                <th
                  key={h}
                  className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-surface-400 dark:text-surface-500"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-100 dark:divide-surface-700">
            {loading ? (
              <TableSkeleton />
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={5}>
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-surface-100 dark:bg-surface-800">
                      <Users className="h-8 w-8 text-surface-400 dark:text-surface-500" />
                    </div>
                    <p className="mb-1 text-base font-semibold text-surface-700 dark:text-surface-300">
                      {search ? 'Aucun résultat' : 'Aucun fournisseur'}
                    </p>
                    <p className="mb-5 text-sm text-surface-400 dark:text-surface-500">
                      {search
                        ? `Aucun fournisseur ne correspond à "${search}"`
                        : 'Commencez par ajouter votre premier fournisseur.'}
                    </p>
                    {!search && (
                      <Button icon={<Plus className="h-4 w-4" />} onClick={openCreate}>
                        Ajouter un fournisseur
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              filtered.map((supplier) => (
                <tr
                  key={supplier.id}
                  className="transition-colors hover:bg-surface-50 dark:hover:bg-surface-800/60"
                >
                  {/* Name */}
                  <td className="px-4 py-3.5">
                    <div>
                      <p className="text-sm font-semibold text-surface-900 dark:text-surface-50">
                        {supplier.name}
                      </p>
                      {supplier.address && (
                        <p className="mt-0.5 text-xs text-surface-400 dark:text-surface-500 truncate max-w-[200px]">
                          {supplier.address}
                        </p>
                      )}
                    </div>
                  </td>

                  {/* Contact */}
                  <td className="px-4 py-3.5 text-sm text-surface-600 dark:text-surface-400">
                    {supplier.contact ?? <span className="text-surface-300 dark:text-surface-600">—</span>}
                  </td>

                  {/* Email */}
                  <td className="px-4 py-3.5 text-sm">
                    {supplier.email ? (
                      <a
                        href={`mailto:${supplier.email}`}
                        className="text-brand-600 hover:underline dark:text-brand-400"
                      >
                        {supplier.email}
                      </a>
                    ) : (
                      <span className="text-surface-300 dark:text-surface-600">—</span>
                    )}
                  </td>

                  {/* Phone */}
                  <td className="px-4 py-3.5 text-sm">
                    {supplier.phone ? (
                      <a
                        href={`tel:${supplier.phone}`}
                        className="text-surface-700 hover:underline dark:text-surface-300"
                      >
                        {supplier.phone}
                      </a>
                    ) : (
                      <span className="text-surface-300 dark:text-surface-600">—</span>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openEdit(supplier)}
                        title="Modifier"
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-surface-400 transition-colors hover:bg-surface-100 hover:text-surface-700 dark:hover:bg-surface-700 dark:hover:text-surface-200"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(supplier)}
                        title="Supprimer"
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-surface-400 transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/30 dark:hover:text-red-400"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      <SupplierModal
        open={modalOpen}
        onClose={closeModal}
        onSubmit={handleSubmit}
        initial={editingSupplier}
        saving={saving}
      />
    </div>
  );
}
