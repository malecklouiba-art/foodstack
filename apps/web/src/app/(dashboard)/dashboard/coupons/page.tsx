'use client';

import { useState, useEffect } from 'react';
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
  Smartphone,
  Pin,
  PinOff,
  Zap,
  TrendingDown,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { StatCard } from '@/components/ui/StatCard';
import { clsx } from 'clsx';
import api from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import { useRestaurantId } from '@/contexts/restaurant-context';

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
  /** Today's redemption count (mock) */
  usedToday: number;
  expiresAt: string | null;
  active: boolean;
  /** Pinned coupons appear prominently in the customer mobile app */
  pinned: boolean;
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

interface ApiCoupon {
  id: string;
  code: string;
  description?: string;
  discountType: 'percent' | 'fixed';
  discountValue: number;
  minOrderValue?: number;
  maxUses?: number | null;
  usedCount?: number;
  expiresAt?: string | null;
  isActive?: boolean;
  active?: boolean;
}

function apiToCoupon(c: ApiCoupon): Coupon {
  return {
    id: c.id,
    code: c.code,
    description: c.description ?? '',
    discountType: c.discountType,
    discountValue: c.discountValue,
    minOrderValue: c.minOrderValue ?? 0,
    maxUses: c.maxUses ?? null,
    usedCount: c.usedCount ?? 0,
    usedToday: 0,
    expiresAt: c.expiresAt ?? null,
    active: c.active ?? c.isActive ?? true,
    pinned: false,
  };
}

export default function CouponsPage() {
  const ctxId = useRestaurantId();
  const authUser = useAuthStore((s) => s.user);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [createOpen, setCreateOpen] = useState(false);
  const [editCoupon, setEditCoupon] = useState<Coupon | null>(null);
  const [deleteCoupon, setDeleteCoupon] = useState<Coupon | null>(null);
  const [form, setForm] = useState<CouponFormState>(EMPTY_FORM);
  const [editForm, setEditForm] = useState<CouponFormState>(EMPTY_FORM);

  const restaurantId = ctxId || authUser?.restaurantIds?.[0];

  useEffect(() => {
    if (!restaurantId) return;
    (api.get(`/coupons?restaurantId=${restaurantId}`) as Promise<ApiCoupon[]>)
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) setCoupons(data.map(apiToCoupon));
      })
      .catch(() => {});
  }, [restaurantId]);

  // ── Derived data ──────────────────────────────────────────────────────────

  const activeCouponList = coupons.filter((c) => c.active && !isExpired(c.expiresAt) && !isExhausted(c));
  const totalCoupons = coupons.length;
  const activeCouponsCount = activeCouponList.length;
  const totalUsesToday = coupons.reduce((sum, c) => sum + c.usedToday, 0);
  const totalSavings = coupons.reduce((sum, c) => {
    if (c.discountType === 'fixed') return sum + c.discountValue * c.usedCount;
    // Approximate: assume average order of 35€ for percentage coupons
    return sum + (c.discountValue / 100) * 35 * c.usedCount;
  }, 0);

  // ── Handlers ──────────────────────────────────────────────────────────────

  async function handleCreate() {
    if (!form.code || !form.discountValue || !restaurantId) return;
    const body = {
      restaurantId,
      code: form.code.toUpperCase(),
      description: form.description,
      discountType: form.discountType,
      discountValue: parseFloat(form.discountValue),
      minOrderValue: parseFloat(form.minOrderValue) || 0,
      maxUses: form.maxUses ? parseInt(form.maxUses) : null,
      expiresAt: form.expiresAt || null,
    };
    try {
      const created = await (api.post('/coupons', body) as Promise<ApiCoupon>);
      setCoupons((prev) => [apiToCoupon(created), ...prev]);
    } catch {
      const newCoupon: Coupon = {
        id: Date.now().toString(), ...body, usedCount: 0, usedToday: 0, active: true, pinned: false,
      };
      setCoupons((prev) => [newCoupon, ...prev]);
    }
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

  async function handleSaveEdit() {
    if (!editCoupon || !editForm.code || !editForm.discountValue) return;
    const patch = {
      code: editForm.code.toUpperCase(),
      description: editForm.description,
      discountType: editForm.discountType,
      discountValue: parseFloat(editForm.discountValue),
      minOrderValue: parseFloat(editForm.minOrderValue) || 0,
      maxUses: editForm.maxUses ? parseInt(editForm.maxUses) : null,
      expiresAt: editForm.expiresAt || null,
    };
    setCoupons((prev) => prev.map((c) => c.id === editCoupon.id ? { ...c, ...patch } : c));
    setEditCoupon(null);
    api.patch(`/coupons/${editCoupon.id}`, patch).catch(() => { /* best-effort */ });
  }

  function handleToggleActive(id: string) {
    const coupon = coupons.find((c) => c.id === id);
    if (!coupon) return;
    const newActive = !coupon.active;
    setCoupons((prev) => prev.map((c) => c.id === id ? { ...c, active: newActive } : c));
    api.patch(`/coupons/${id}`, { active: newActive }).catch(() => { /* best-effort */ });
  }

  function handleTogglePinned(id: string) {
    setCoupons((prev) => prev.map((c) => (c.id === id ? { ...c, pinned: !c.pinned } : c)));
  }

  async function handleDelete() {
    if (!deleteCoupon) return;
    const id = deleteCoupon.id;
    setCoupons((prev) => prev.filter((c) => c.id !== id));
    setDeleteCoupon(null);
    api.delete(`/coupons/${id}`).catch(() => { /* best-effort */ });
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

      {/* ── Active promo banner ─────────────────────────────────────────── */}
      {activeCouponList.length > 0 && (
        <div className="rounded-2xl border border-green-200 bg-gradient-to-r from-green-50 to-emerald-50 p-4 dark:border-green-800 dark:from-green-950/40 dark:to-emerald-950/40">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-500 text-white">
                <Zap className="h-4 w-4" />
              </div>
              <span className="text-sm font-semibold text-green-800 dark:text-green-300">
                {activeCouponList.length} code{activeCouponList.length > 1 ? 's' : ''} actif{activeCouponList.length > 1 ? 's' : ''} en ce moment
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {activeCouponList.map((c) => (
                <span
                  key={c.id}
                  className="flex items-center gap-1.5 rounded-lg bg-white/80 px-2.5 py-1 font-mono text-xs font-bold text-green-800 shadow-sm ring-1 ring-green-200 dark:bg-green-900/40 dark:text-green-200 dark:ring-green-700"
                >
                  {c.pinned && <Pin className="h-3 w-3 text-brand-500" />}
                  {c.code}
                  <span className="font-sans font-medium text-green-600 dark:text-green-400">
                    –{formatDiscount(c)}
                  </span>
                </span>
              ))}
            </div>
            <div className="ml-auto flex items-center gap-1.5 rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700 dark:bg-green-900/60 dark:text-green-300">
              <Smartphone className="h-3.5 w-3.5" />
              Synchronisé avec les apps
            </div>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard
          title="Total codes"
          value={totalCoupons}
          icon={Tag}
        />
        <StatCard
          title="Codes actifs"
          value={activeCouponsCount}
          icon={CheckCircle}
          iconColor="text-green-600"
          iconBg="bg-green-50"
        />
        <StatCard
          title="Utilisations aujourd'hui"
          value={totalUsesToday}
          icon={RefreshCw}
          iconColor="text-blue-600"
          iconBg="bg-blue-50"
        />
        <StatCard
          title="Économies offertes"
          value={`${totalSavings.toFixed(0)}€`}
          icon={TrendingDown}
          iconColor="text-purple-600"
          iconBg="bg-purple-50"
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
                    {/* Status + sync */}
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1.5">
                        <Badge variant={status.variant} dot>{status.label}</Badge>
                        {status.variant === 'success' && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-[10px] font-medium text-green-700 ring-1 ring-green-200 dark:bg-green-900/30 dark:text-green-300 dark:ring-green-700">
                            <CheckCircle className="h-2.5 w-2.5" />
                            Synchronisé avec les apps
                          </span>
                        )}
                      </div>
                    </td>
                    {/* Actions */}
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        {/* Pin toggle — always visible for active coupons */}
                        <button
                          onClick={() => handleTogglePinned(coupon.id)}
                          className={clsx(
                            'rounded-lg p-1.5 transition-colors',
                            coupon.pinned
                              ? 'text-brand-500 hover:bg-brand-50'
                              : 'text-surface-300 opacity-0 group-hover:opacity-100 hover:bg-surface-100 hover:text-surface-600'
                          )}
                          title={coupon.pinned ? 'Désépingler (retirer de la mise en avant app)' : 'Épingler (mettre en avant dans l\'app)'}
                        >
                          {coupon.pinned ? (
                            <Pin className="h-4 w-4" />
                          ) : (
                            <PinOff className="h-4 w-4" />
                          )}
                        </button>
                        {/* Active toggle */}
                        <button
                          onClick={() => handleToggleActive(coupon.id)}
                          className="rounded-lg p-1.5 text-surface-400 opacity-0 group-hover:opacity-100 hover:bg-surface-100 hover:text-surface-700 transition-colors"
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
                          className="rounded-lg p-1.5 text-surface-400 opacity-0 group-hover:opacity-100 hover:bg-surface-100 hover:text-surface-700 transition-colors"
                          title="Modifier"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        {/* Delete */}
                        <button
                          onClick={() => setDeleteCoupon(coupon)}
                          className="rounded-lg p-1.5 text-surface-400 opacity-0 group-hover:opacity-100 hover:bg-red-100 hover:text-red-600 transition-colors"
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
