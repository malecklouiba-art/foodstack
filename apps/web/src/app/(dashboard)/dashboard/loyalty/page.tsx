'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Award, Users, Gift, Plus, Search, RefreshCw, X } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { StatCard } from '@/components/ui/StatCard';
import api from '@/lib/api';

// ── Types ─────────────────────────────────────────────────────────────────────

type LoyaltyTier = 'bronze' | 'silver' | 'gold' | 'platinum';

interface LoyaltyCustomer {
  id: string;
  name: string;
  email: string;
  loyaltyPoints: number;
  loyaltyTier: LoyaltyTier;
  orderCount: number;
  joinedAt: string;
}

interface AddPointsForm {
  points: string;
  reason: string;
}

// ── Config ────────────────────────────────────────────────────────────────────

const TIER_CONFIG: Record<LoyaltyTier, { label: string; min: number; emoji: string; variant: 'warning' | 'info' | 'brand' | 'default' }> = {
  bronze:   { label: 'Bronze',  min: 0,    emoji: '🥉', variant: 'warning' },
  silver:   { label: 'Argent',  min: 500,  emoji: '🥈', variant: 'default' },
  gold:     { label: 'Or',      min: 1500, emoji: '🥇', variant: 'brand'   },
  platinum: { label: 'Platine', min: 5000, emoji: '💎', variant: 'info'    },
};

// ── Seed data ─────────────────────────────────────────────────────────────────

const SEED_CUSTOMERS: LoyaltyCustomer[] = [
  { id: 'u1', name: 'Marie Laurent',  email: 'marie@example.com',  loyaltyPoints: 2340, loyaltyTier: 'gold',     orderCount: 34, joinedAt: '2024-03-15' },
  { id: 'u2', name: 'Pierre Dubois',  email: 'pierre@example.com', loyaltyPoints: 780,  loyaltyTier: 'silver',   orderCount: 18, joinedAt: '2024-06-10' },
  { id: 'u3', name: 'Sophie Martin',  email: 'sophie@example.com', loyaltyPoints: 5200, loyaltyTier: 'platinum', orderCount: 67, joinedAt: '2023-11-01' },
  { id: 'u4', name: 'Julien Klein',   email: 'julien@example.com', loyaltyPoints: 120,  loyaltyTier: 'bronze',   orderCount: 6,  joinedAt: '2025-01-20' },
  { id: 'u5', name: 'Emma Dubois',    email: 'emma@example.com',   loyaltyPoints: 890,  loyaltyTier: 'silver',   orderCount: 22, joinedAt: '2024-08-05' },
  { id: 'u6', name: 'Lucas Renard',   email: 'lucas@example.com',  loyaltyPoints: 3100, loyaltyTier: 'gold',     orderCount: 41, joinedAt: '2024-01-12' },
];

// ── Page ──────────────────────────────────────────────────────────────────────

export default function LoyaltyPage() {
  const [customers, setCustomers] = useState<LoyaltyCustomer[]>([]);
  const [search, setSearch] = useState('');
  const [tierFilter, setTierFilter] = useState<LoyaltyTier | 'all'>('all');
  const [loading, setLoading] = useState(false);
  const [addPointsTarget, setAddPointsTarget] = useState<LoyaltyCustomer | null>(null);
  const [addForm, setAddForm] = useState<AddPointsForm>({ points: '', reason: '' });
  const [saving, setSaving] = useState(false);

  const load = useCallback((silent = false) => {
    if (!silent) setLoading(true);
    (api.get('/users/customers') as Promise<LoyaltyCustomer[]>)
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setCustomers(data);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = customers.filter((c) => {
    if (tierFilter !== 'all' && c.loyaltyTier !== tierFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q);
    }
    return true;
  });

  const stats = {
    total: customers.length,
    platinum: customers.filter((c) => c.loyaltyTier === 'platinum').length,
    gold: customers.filter((c) => c.loyaltyTier === 'gold').length,
    totalPoints: customers.reduce((s, c) => s + (c.loyaltyPoints ?? 0), 0),
  };

  async function handleAddPoints() {
    if (!addPointsTarget || !addForm.points) return;
    const pts = parseInt(addForm.points);
    if (isNaN(pts) || pts === 0) return;
    setSaving(true);
    const optimisticUpdate = () => setCustomers((prev) => prev.map((c) =>
      c.id === addPointsTarget.id ? { ...c, loyaltyPoints: c.loyaltyPoints + pts } : c
    ));
    try {
      await (api.post(`/loyalty/${addPointsTarget.id}/add`, {
        points: pts,
        reason: addForm.reason || 'Ajustement manuel',
      }) as Promise<unknown>);
      optimisticUpdate();
    } catch {
      optimisticUpdate();
    } finally {
      setSaving(false);
      setAddPointsTarget(null);
      setAddForm({ points: '', reason: '' });
    }
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500/10">
            <Award className="h-5 w-5 text-brand-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-surface-900">Programme Fidélité</h1>
            <p className="text-sm text-surface-500">Gérez les points et niveaux de vos clients</p>
          </div>
        </div>
        <Button
          variant="ghost"
          icon={<RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />}
          onClick={() => load()}
        >
          Actualiser
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard title="Membres" value={stats.total} icon={Users} />
        <StatCard title="Platine" value={stats.platinum} icon={Award} iconColor="text-purple-600" />
        <StatCard title="Or" value={stats.gold} icon={Award} iconColor="text-yellow-600" />
        <StatCard title="Points distribués" value={stats.totalPoints.toLocaleString('fr-FR')} icon={Gift} />
      </div>

      {/* Tier filter cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {(Object.entries(TIER_CONFIG) as [LoyaltyTier, typeof TIER_CONFIG.bronze][]).map(([tier, cfg]) => {
          const count = customers.filter((c) => c.loyaltyTier === tier).length;
          const pct = customers.length ? Math.round((count / customers.length) * 100) : 0;
          return (
            <button
              key={tier}
              onClick={() => setTierFilter(tierFilter === tier ? 'all' : tier)}
              className={`rounded-xl border p-4 text-left transition-all hover:shadow-sm ${
                tierFilter === tier ? 'border-brand-400 bg-brand-50' : 'border-surface-200 bg-white hover:border-brand-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-2xl">{cfg.emoji}</span>
                <span className="text-sm font-bold text-surface-900">{count}</span>
              </div>
              <div className="mt-2 text-xs font-semibold text-surface-500 uppercase tracking-wide">{cfg.label}</div>
              <div className="mt-2 h-1.5 rounded-full bg-surface-100 overflow-hidden">
                <div className="h-full rounded-full bg-brand-400 transition-all" style={{ width: `${pct}%` }} />
              </div>
              <div className="mt-1 text-xs text-surface-400">{pct}%</div>
            </button>
          );
        })}
      </div>

      {/* Search & active filter */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-surface-400" />
          <Input
            placeholder="Rechercher un client…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        {tierFilter !== 'all' && (
          <button
            onClick={() => setTierFilter('all')}
            className="flex items-center gap-1 rounded-xl border border-brand-300 bg-brand-50 px-3 py-2 text-sm font-medium text-brand-700 hover:bg-brand-100"
          >
            {TIER_CONFIG[tierFilter].emoji} {TIER_CONFIG[tierFilter].label}
            <X className="h-3 w-3 ml-1" />
          </button>
        )}
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-surface-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-surface-100 bg-surface-50">
              <th className="py-3 pl-4 pr-3 text-left font-semibold text-surface-600">Client</th>
              <th className="px-3 py-3 text-left font-semibold text-surface-600">Niveau</th>
              <th className="px-3 py-3 text-right font-semibold text-surface-600">Points</th>
              <th className="px-3 py-3 text-right font-semibold text-surface-600">Commandes</th>
              <th className="px-3 py-3 text-right font-semibold text-surface-600">Membre depuis</th>
              <th className="px-3 py-3 text-right font-semibold text-surface-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-100">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-surface-400">
                  {loading ? 'Chargement…' : 'Aucun client trouvé'}
                </td>
              </tr>
            ) : (
              filtered.map((c, i) => {
                const cfg = TIER_CONFIG[c.loyaltyTier] ?? TIER_CONFIG.bronze;
                return (
                  <motion.tr
                    key={c.id}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.02 }}
                    className="hover:bg-surface-50"
                  >
                    <td className="py-3 pl-4 pr-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-xs font-bold text-brand-700">
                          {c.name.split(' ').map((w) => w[0] ?? '').join('').slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-medium text-surface-900">{c.name}</div>
                          <div className="text-xs text-surface-400">{c.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <Badge variant={cfg.variant}>{cfg.emoji} {cfg.label}</Badge>
                    </td>
                    <td className="px-3 py-3 text-right font-semibold text-surface-900">
                      {c.loyaltyPoints.toLocaleString('fr-FR')} pts
                    </td>
                    <td className="px-3 py-3 text-right text-surface-600">{c.orderCount}</td>
                    <td className="px-3 py-3 text-right text-surface-500 text-xs">
                      {new Date(c.joinedAt).toLocaleDateString('fr-FR', { year: 'numeric', month: 'short' })}
                    </td>
                    <td className="px-3 py-3 text-right">
                      <button
                        onClick={() => { setAddPointsTarget(c); setAddForm({ points: '', reason: '' }); }}
                        className="inline-flex items-center gap-1 rounded-lg bg-brand-50 px-2.5 py-1.5 text-xs font-semibold text-brand-700 hover:bg-brand-100 transition-colors"
                      >
                        <Plus className="h-3 w-3" /> Points
                      </button>
                    </td>
                  </motion.tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Add points modal */}
      {addPointsTarget && (
        <Modal
          open
          onClose={() => setAddPointsTarget(null)}
          title={`Ajuster les points — ${addPointsTarget.name}`}
          description={`Solde actuel : ${addPointsTarget.loyaltyPoints.toLocaleString('fr-FR')} pts`}
          size="sm"
        >
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-surface-700">Points à ajouter</label>
              <Input
                type="number"
                placeholder="Ex : 100 ou -50"
                value={addForm.points}
                onChange={(e) => setAddForm((f) => ({ ...f, points: e.target.value }))}
                autoFocus
              />
              <p className="mt-1 text-xs text-surface-400">Valeur négative pour déduire des points</p>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-surface-700">Motif</label>
              <Input
                placeholder="Ex : Compensation livraison, Geste commercial…"
                value={addForm.reason}
                onChange={(e) => setAddForm((f) => ({ ...f, reason: e.target.value }))}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setAddPointsTarget(null)}>Annuler</Button>
              <Button
                variant="primary"
                loading={saving}
                onClick={handleAddPoints}
                disabled={!addForm.points}
              >
                Confirmer
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
