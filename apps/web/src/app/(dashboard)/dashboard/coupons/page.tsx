'use client';

import { useState } from 'react';
import {
  Tag,
  Plus,
  Pencil,
  Trash2,
  ToggleLeft,
  ToggleRight,
  RefreshCw,
  Percent,
  Euro,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { StatCard } from '@/components/ui/StatCard';
import { clsx } from 'clsx';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Coupon {
  id: string;
  code: string;
  description: string;
  discountType: 'percent' | 'fixed';
  discountValue: number;
  minOrderValue: number;
  maxUses: number | null;
  usedCount: number;
  expiresAt: string | null;
  active: boolean;
}

interface CouponFormState {
  code: string;
  description: string;
  discountType: 'percent' | 'fixed';
  discountValue: string;
  minOrderValue: string;
  maxUses: string;
  expiresAt: string;
}

// ─── Demo data ────────────────────────────────────────────────────────────────

const INIT_COUPONS: Coupon[] = [
  { id: '1', code: 'BIENVENUE10', description: 'Nouveau client', discountType: 'percent', discountValue: 10, minOrderValue: 0, maxUses: 100, usedCount: 23, expiresAt: '2026-12-31', active: true },
  { id: '2', code: 'ETE5', description: 'Promo été', discountType: 'fixed', discountValue: 5, minOrderValue: 25, maxUses: 50, usedCount: 50, expiresAt: '2026-08-31', active: false },
  { id: '3', code: 'FIDELE20', description: 'Client fidèle', discountType: 'percent', discountValue: 20, minOrderValue: 50, maxUses: null, usedCount: 8, expiresAt: null, active: true },
  { id: '4', code: 'FLASH15', description: 'Offre flash', discountType: 'percent', discountValue: 15, minOrderValue: 30, maxUses: 200, usedCount: 197, expiresAt: '2026-06-30', active: true },
  { id: '5', code: 'NOEL25', description: 'Noël 2026', discountType: 'percent', discountValue: 25, minOrderValue: 60, maxUses: 500, usedCount: 0, expiresAt: '2026-12-26', active: true },
  { id: '6', code: 'WEEKEND10', description: 'Promo week-end', discountType: 'percent', discountValue: 10, minOrderValue: 20, maxUses: 300, usedCount: 45, expiresAt: '2026-07-31', active: true },
  { id: '7', code: 'VIP30', description: 'Client VIP', discountType: 'percent', discountValue: 30, minOrderValue: 80, maxUses: 20, usedCount: 3, expiresAt: null, active: true },
  { id: '8', code: 'GRATUIT8', description: 'Livraison offerte', discountType: 'fixed', discountValue: 8, minOrderValue: 15, maxUses: 150, usedCount: 112, expiresAt: '2026-09-30', active: false },
  { id: '9', code: 'RENTRE15', description: 'Rentrée scolaire', discountType: 'percent', discountValue: 15, minOrderValue: 35, maxUses: 400, usedCount: 0, expiresAt: '2026-10-01', active: true },
  { id: '10', code: 'LOYAL5', description: 'Récompense fidélité', discountType: 'fixed', discountValue: 5, minOrderValue: 0, maxUses: null, usedCount: 67, expiresAt: null, active: true },
];

const EMPTY_FORM: CouponFormState = {
  code: '',
  description: '',
  discountType: 'percent',
  discountValue: '',
  minOrderValue: '',
  maxUses: '',
  expiresAt: '',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function generateCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  return Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

function formatDiscount(coupon: Coupon): string {
  return coupon.discountType === 'percent'
    ? `${coupon.discountValue}%`
    : `${coupon.discountValue}€`;
}

function isExpired(expiresAt: string | null): boolean {
  if (!expiresAt) return false;
  return new Date(expiresAt) < new Date();
}

function isExhausted(coupon: Coupon): boolean {
  return coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses;
}

// ─── CouponForm ───────────────────────────────────────────────────────────────

interface CouponFormProps {
  form: CouponFormState;
  onChange: (f: CouponFormState) => void;
}

function CouponForm({ form, onChange }: CouponFormProps) {
  function set(key: keyof CouponFormState, value: string) {
    onChange({ ...form, [key]: value });
  }

  return (
    <div className="space-y-4">
      {/* Code row */}
      <div className="flex gap-2">
        <div className="flex-1">
          <Input
            label="Code promo"
            value={form.code}
            onChange={(e) => set('code', e.target.value.toUpperCase())}
            placeholder="EX: SUMMER20"
            required
          />
        </div>
        <div className="flex items-end">
          <Button
            variant="ghost"
            size="md"
            icon={<RefreshCw className="h-4 w-4" />}
            onClick={() => set('code', generateCode())}
            title="Générer un code aléatoire"
          >
            Générer
          </Button>
        </div>
      </div>

      {/* Description */}
      <Input
        label="Description"
        value={form.description}
        onChange={(e) => set('description', e.target.value)}
        placeholder="Description interne (optionnel)"
      />

      {/* Discount type toggle */}
      <div>
        <label className="mb-1.5 block text-sm font-medium text-surface-700">Type de réduction</label>
        <div className="flex rounded-xl border border-surface-200 overflow-hidden">
          <button
            type="button"
            onClick={() => set('discountType', 'percent')}
            className={clsx(
              'flex flex-1 items-center justify-center gap-2 py-2.5 text-sm font-medium transition-colors',
              form.discountType === 'percent'
                ? 'bg-brand-500 text-white'
                : 'bg-white text-surface-600 hover:bg-surface-50'
            )}
          >
            <Percent className="h-4 w-4" />
            Pourcentage
          </button>
          <button
            type="button"
            onClick={() => set('discountType', 'fixed')}
            className={clsx(
              'flex flex-1 items-center justify-center gap-2 py-2.5 text-sm font-medium transition-colors',
              form.discountType === 'fixed'
                ? 'bg-brand-500 text-white'
                : 'bg-white text-surface-600 hover:bg-surface-50'
            )}
          >
            <Euro className="h-4 w-4" />
            Montant fixe
          </button>
        </div>
      </div>

      {/* Value + min order */}
      <div className="grid grid-cols-2 gap-3">
        <Input
          label={form.discountType === 'percent' ? 'Valeur (%)' : 'Valeur (€)'}
          type="number"
          min={0}
          value={form.discountValue}
          onChange={(e) => set('discountValue', e.target.value)}
          placeholder="0"
          required
        />
        <Input
          label="Commande min (€)"
          type="number"
          min={0}
          value={form.minOrderValue}
          onChange={(e) => set('minOrderValue', e.target.value)}
          placeholder="0"
        />
      </div>

      {/* Max uses + expiry */}
      <div className="grid grid-cols-2 gap-3">
        <Input
          label="Utilisations max"
          type="number"
          min={1}
          value={form.maxUses}
          onChange={(e) => set('maxUses', e.target.value)}
          placeholder="Illimité"
        />
        <Input
          label="Date d'expiration"
          type="date"
          value={form.expiresAt}
          onChange={(e) => set('expiresAt', e.target.value)}
        />
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>(INIT_COUPONS);
  const [createOpen, setCreateOpen] = useState(false);
  const [editCoupon, setEditCoupon] = useState<Coupon | null>(null);
  const [deleteCoupon, setDeleteCoupon] = useState<Coupon | null>(null);
  const [form, setForm] = useState<CouponFormState>(EMPTY_FORM);
  const [editForm, setEditForm] = useState<CouponFormState>(EMPTY_FORM);

  // ── Stats ──────────────────────────────────────────────────────────────────

  const totalCoupons = coupons.length;
  const activeCoupons = coupons.filter((c) => c.active && !isExpired(c.expiresAt) && !isExhausted(c)).length;
  const totalUses = coupons.reduce((sum, c) => sum + c.usedCount, 0);
  const avgDiscount = coupons.length
    ? Math.round(coupons.filter((c) => c.discountType === 'percent').reduce((s, c) => s + c.discountValue, 0) / Math.max(1, coupons.filter((c) => c.discountType === 'percent').length))
    : 0;

  // ── Handlers ──────────────────────────────────────────────────────────────

  function handleCreate() {
    if (!form.code || !form.discountValue) return;
    const newCoupon: Coupon = {
      id: Date.now().toString(),
      code: form.code.toUpperCase(),
      description: form.description,
      discountType: form.discountType,
      discountValue: parseFloat(form.discountValue),
      minOrderValue: parseFloat(form.minOrderValue) || 0,
      maxUses: form.maxUses ? parseInt(form.maxUses) : null,
      usedCount: 0,
      expiresAt: form.expiresAt || null,
      active: true,
    };
    setCoupons((prev) => [newCoupon, ...prev]);
    setForm(EMPTY_FORM);
    setCreateOpen(false);
  }

  function handleEdit(coupon: Coupon) {
    setEditCoupon(coupon);
    setEditForm({
      code: coupon.code,
      description: coupon.description,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue.toString(),
      minOrderValue: coupon.minOrderValue.toString(),
      maxUses: coupon.maxUses?.toString() ?? '',
      expiresAt: coupon.expiresAt ?? '',
    });
  }

  function handleSaveEdit() {
    if (!editCoupon || !editForm.code || !editForm.discountValue) return;
    setCoupons((prev) =>
      prev.map((c) =>
        c.id === editCoupon.id
          ? {
              ...c,
              code: editForm.code.toUpperCase(),
              description: editForm.description,
              discountType: editForm.discountType,
              discountValue: parseFloat(editForm.discountValue),
              minOrderValue: parseFloat(editForm.minOrderValue) || 0,
              maxUses: editForm.maxUses ? parseInt(editForm.maxUses) : null,
              expiresAt: editForm.expiresAt || null,
            }
          : c
      )
    );
    setEditCoupon(null);
  }

  function handleToggleActive(id: string) {
    setCoupons((prev) => prev.map((c) => (c.id === id ? { ...c, active: !c.active } : c)));
  }

  function handleDelete() {
    if (!deleteCoupon) return;
    setCoupons((prev) => prev.filter((c) => c.id !== deleteCoupon.id));
    setDeleteCoupon(null);
  }

  // ── Status helpers ─────────────────────────────────────────────────────────

  function getCouponStatus(coupon: Coupon): { label: string; variant: 'success' | 'danger' | 'warning' | 'default' } {
    if (!coupon.active) return { label: 'Inactif', variant: 'default' };
    if (isExpired(coupon.expiresAt)) return { label: 'Expiré', variant: 'danger' };
    if (isExhausted(coupon)) return { label: 'Épuisé', variant: 'warning' };
    return { label: 'Actif', variant: 'success' };
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500/10">
            <Tag className="h-5 w-5 text-brand-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-surface-900">Codes Promo</h1>
            <p className="text-sm text-surface-500">Gérez vos réductions et codes promotionnels</p>
          </div>
        </div>
        <Button
          variant="primary"
          icon={<Plus className="h-4 w-4" />}
          onClick={() => { setForm(EMPTY_FORM); setCreateOpen(true); }}
        >
          Créer un code
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard
          title="Total codes"
          value={totalCoupons}
          icon={Tag}
        />
        <StatCard
          title="Codes actifs"
          value={activeCoupons}
          icon={CheckCircle}
        />
        <StatCard
          title="Utilisations totales"
          value={totalUses}
          icon={RefreshCw}
        />
        <StatCard
          title="Réduction moy."
          value={`${avgDiscount}%`}
          icon={Percent}
        />
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-surface-200 bg-white">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-surface-100 bg-gray-50">
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-surface-500">Code</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-surface-500">Description</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-surface-500">Réduction</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-surface-500">Min. commande</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-surface-500">Utilisations</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-surface-500">Expiration</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-surface-500">Statut</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-surface-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-100">
              {coupons.map((coupon) => {
                const status = getCouponStatus(coupon);
                return (
                  <tr key={coupon.id} className="group hover:bg-gray-50 transition-colors">
                    {/* Code */}
                    <td className="px-4 py-3">
                      <span className="rounded-lg bg-zinc-900 px-2.5 py-1 font-mono text-xs font-bold text-white tracking-wider">
                        {coupon.code}
                      </span>
                    </td>
                    {/* Description */}
                    <td className="px-4 py-3 text-sm text-surface-600">
                      {coupon.description || <span className="text-surface-300 italic">—</span>}
                    </td>
                    {/* Discount */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <span className={clsx(
                          'flex h-5 w-5 items-center justify-center rounded-full text-xs',
                          coupon.discountType === 'percent' ? 'bg-brand-100 text-brand-700' : 'bg-blue-100 text-blue-700'
                        )}>
                          {coupon.discountType === 'percent' ? '%' : '€'}
                        </span>
                        <span className="text-sm font-semibold text-surface-900">{formatDiscount(coupon)}</span>
                      </div>
                    </td>
                    {/* Min order */}
                    <td className="px-4 py-3 text-sm text-surface-600">
                      {coupon.minOrderValue > 0 ? `${coupon.minOrderValue}€` : <span className="text-surface-300 italic">Aucun</span>}
                    </td>
                    {/* Uses */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-surface-900">{coupon.usedCount}</span>
                        {coupon.maxUses !== null && (
                          <>
                            <span className="text-surface-300">/</span>
                            <span className="text-sm text-surface-500">{coupon.maxUses}</span>
                          </>
                        )}
                        {coupon.maxUses === null && <span className="text-xs text-surface-400">illimité</span>}
                      </div>
                      {coupon.maxUses !== null && (
                        <div className="mt-1 h-1 w-20 rounded-full bg-surface-100 overflow-hidden">
                          <div
                            className={clsx(
                              'h-full rounded-full transition-all',
                              isExhausted(coupon) ? 'bg-red-500' : coupon.usedCount / coupon.maxUses > 0.8 ? 'bg-yellow-500' : 'bg-brand-500'
                            )}
                            style={{ width: `${Math.min(100, (coupon.usedCount / coupon.maxUses) * 100)}%` }}
                          />
                        </div>
                      )}
                    </td>
                    {/* Expiry */}
                    <td className="px-4 py-3 text-sm text-surface-600">
                      {coupon.expiresAt ? (
                        <span className={isExpired(coupon.expiresAt) ? 'text-red-500 font-medium' : ''}>
                          {new Date(coupon.expiresAt).toLocaleDateString('fr-FR')}
                        </span>
                      ) : (
                        <span className="text-surface-300 italic">Sans limite</span>
                      )}
                    </td>
                    {/* Status */}
                    <td className="px-4 py-3">
                      <Badge variant={status.variant} dot>{status.label}</Badge>
                    </td>
                    {/* Actions */}
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {/* Active toggle */}
                        <button
                          onClick={() => handleToggleActive(coupon.id)}
                          className="rounded-lg p-1.5 text-surface-400 hover:bg-surface-100 hover:text-surface-700 transition-colors"
                          title={coupon.active ? 'Désactiver' : 'Activer'}
                        >
                          {coupon.active ? (
                            <ToggleRight className="h-4 w-4 text-brand-500" />
                          ) : (
                            <ToggleLeft className="h-4 w-4" />
                          )}
                        </button>
                        {/* Edit */}
                        <button
                          onClick={() => handleEdit(coupon)}
                          className="rounded-lg p-1.5 text-surface-400 hover:bg-surface-100 hover:text-surface-700 transition-colors"
                          title="Modifier"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        {/* Delete */}
                        <button
                          onClick={() => setDeleteCoupon(coupon)}
                          className="rounded-lg p-1.5 text-surface-400 hover:bg-red-100 hover:text-red-600 transition-colors"
                          title="Supprimer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {coupons.length === 0 && (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-surface-400">
              <Tag className="h-10 w-10 opacity-30" />
              <p className="text-sm">Aucun code promo créé</p>
              <Button variant="primary" size="sm" icon={<Plus className="h-4 w-4" />} onClick={() => setCreateOpen(true)}>
                Créer un code
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* ── Create modal ────────────────────────────────────────────────────── */}
      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Créer un code promo"
        description="Configurez votre code de réduction."
        size="lg"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setCreateOpen(false)}>Annuler</Button>
            <Button variant="primary" onClick={handleCreate}>Créer le code</Button>
          </div>
        }
      >
        <CouponForm form={form} onChange={setForm} />
      </Modal>

      {/* ── Edit modal ──────────────────────────────────────────────────────── */}
      <Modal
        open={editCoupon !== null}
        onClose={() => setEditCoupon(null)}
        title="Modifier le code promo"
        description={editCoupon ? `Modification de ${editCoupon.code}` : ''}
        size="lg"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setEditCoupon(null)}>Annuler</Button>
            <Button variant="primary" onClick={handleSaveEdit}>Enregistrer</Button>
          </div>
        }
      >
        <CouponForm form={editForm} onChange={setEditForm} />
      </Modal>

      {/* ── Delete confirm ──────────────────────────────────────────────────── */}
      <Modal
        open={deleteCoupon !== null}
        onClose={() => setDeleteCoupon(null)}
        title="Supprimer le code promo"
        size="sm"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setDeleteCoupon(null)}>Annuler</Button>
            <Button variant="danger" onClick={handleDelete}>Supprimer</Button>
          </div>
        }
      >
        <div className="flex flex-col items-center gap-3 py-2 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
            <XCircle className="h-6 w-6 text-red-500" />
          </div>
          <p className="text-sm text-surface-600">
            Êtes-vous sûr de vouloir supprimer le code{' '}
            <span className="font-mono font-bold text-surface-900">{deleteCoupon?.code}</span> ?
            <br />
            Cette action est irréversible.
          </p>
        </div>
      </Modal>
    </div>
  );
}
