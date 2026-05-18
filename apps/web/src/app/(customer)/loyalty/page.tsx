'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Award, Gift, Star, Zap, TrendingUp, ChevronRight,
  Clock, CheckCircle2, Coins, Crown, Shield, Gem,
  ArrowUp, ArrowDown, RefreshCw,
} from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import api from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import type { LoyaltyTier } from '@foodstack/shared';

// ── Types ─────────────────────────────────────────────────────────────────────

interface LoyaltyData {
  loyaltyPoints: number;
  loyaltyTier: LoyaltyTier;
}

interface Transaction {
  id: string;
  points: number;
  type: 'earn' | 'redeem';
  reason: string;
  createdAt: string;
  orderId?: string;
}

// ── Config ────────────────────────────────────────────────────────────────────

const TIER_CONFIG: Record<LoyaltyTier, {
  label: string;
  icon: React.ElementType;
  color: string;
  bg: string;
  border: string;
  gradient: string;
  minPoints: number;
  nextTier?: LoyaltyTier;
  nextPoints?: number;
  perks: string[];
}> = {
  bronze: {
    label: 'Bronze',
    icon: Award,
    color: 'text-amber-700',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    gradient: 'from-amber-400 to-amber-600',
    minPoints: 0,
    nextTier: 'silver',
    nextPoints: 500,
    perks: ['1 point par euro dépensé', 'Accès aux promotions membres', 'Newsletter exclusive'],
  },
  silver: {
    label: 'Silver',
    icon: Star,
    color: 'text-slate-600',
    bg: 'bg-slate-50',
    border: 'border-slate-200',
    gradient: 'from-slate-400 to-slate-600',
    minPoints: 500,
    nextTier: 'gold',
    nextPoints: 1000,
    perks: ['1.5 points par euro', 'Livraison offerte 1×/mois', 'Support prioritaire'],
  },
  gold: {
    label: 'Gold',
    icon: Crown,
    color: 'text-yellow-600',
    bg: 'bg-yellow-50',
    border: 'border-yellow-200',
    gradient: 'from-yellow-400 to-yellow-600',
    minPoints: 1000,
    nextTier: 'platinum',
    nextPoints: 2500,
    perks: ['2 points par euro', 'Livraison offerte illimitée', 'Accès anticipé aux nouveautés', 'Dessert offert 1×/mois'],
  },
  platinum: {
    label: 'Platinum',
    icon: Gem,
    color: 'text-purple-600',
    bg: 'bg-purple-50',
    border: 'border-purple-200',
    gradient: 'from-purple-400 to-purple-600',
    minPoints: 2500,
    perks: ['3 points par euro', 'Livraison offerte illimitée', 'Table réservée en priorité', "Accès chef's table", 'Cadeau anniversaire premium'],
  },
};

const REWARDS = [
  { id: 'r1', label: 'Réduction 5 €', points: 500, emoji: '🎟️' },
  { id: 'r2', label: 'Livraison offerte', points: 300, emoji: '🛵' },
  { id: 'r3', label: 'Dessert offert', points: 250, emoji: '🍮' },
  { id: 'r4', label: 'Boisson offerte', points: 200, emoji: '🥤' },
  { id: 'r5', label: 'Réduction 10 €', points: 1000, emoji: '💰' },
  { id: 'r6', label: 'Repas offert', points: 2000, emoji: '🎁' },
];

const MOCK_TRANSACTIONS: Transaction[] = [
  { id: 't1', points: 45, type: 'earn', reason: 'Commande ORD-8821 livrée', createdAt: new Date('2026-05-11T15:01:00').toISOString(), orderId: 'o1' },
  { id: 't2', points: 34, type: 'earn', reason: 'Commande ORD-8790 livrée', createdAt: new Date('2026-05-08T20:28:00').toISOString(), orderId: 'o2' },
  { id: 't3', points: -200, type: 'redeem', reason: 'Points utilisés à la caisse', createdAt: new Date('2026-05-03T12:10:00').toISOString() },
  { id: 't4', points: 50, type: 'earn', reason: 'Bonus inscription', createdAt: new Date('2026-01-15T09:00:00').toISOString() },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function relativeDate(iso: string) {
  const d = new Date(iso);
  const diff = (Date.now() - d.getTime()) / 1000;
  if (diff < 60) return 'À l\'instant';
  if (diff < 3600) return `Il y a ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `Il y a ${Math.floor(diff / 3600)}h`;
  if (diff < 86400 * 7) return `Il y a ${Math.floor(diff / 86400)} j`;
  return new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short' }).format(d);
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function LoyaltyPage() {
  const router = useRouter();
  const { user } = useAuthStore();

  const [loyalty, setLoyalty] = useState<LoyaltyData>({ loyaltyPoints: 840, loyaltyTier: 'silver' });
  const [transactions, setTransactions] = useState<Transaction[]>(MOCK_TRANSACTIONS);
  const [loading, setLoading] = useState(true);
  const [redeeming, setRedeeming] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [pts, hist] = await Promise.all([
        api.get('/loyalty/me') as Promise<LoyaltyData>,
        api.get('/loyalty/me/history') as Promise<Transaction[]>,
      ]);
      setLoyalty(pts as LoyaltyData);
      if (Array.isArray(hist) && (hist as Transaction[]).length > 0) setTransactions(hist as Transaction[]);
    } catch {
      // keep mock
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const tier = TIER_CONFIG[loyalty.loyaltyTier] ?? TIER_CONFIG.bronze;
  const TierIcon = tier.icon;

  const progressPct = tier.nextPoints
    ? Math.min(100, Math.round(((loyalty.loyaltyPoints - tier.minPoints) / (tier.nextPoints - tier.minPoints)) * 100))
    : 100;

  async function redeem(rewardId: string, cost: number, label: string) {
    if (loyalty.loyaltyPoints < cost) {
      toast.error('Points insuffisants');
      return;
    }
    setRedeeming(rewardId);
    try {
      await api.post(`/loyalty/${user?.id}/redeem`, { points: cost });
      setLoyalty((prev) => ({ ...prev, loyaltyPoints: prev.loyaltyPoints - cost }));
      setTransactions((prev) => [{
        id: `t-${Date.now()}`,
        points: -cost,
        type: 'redeem',
        reason: `Échange : ${label}`,
        createdAt: new Date().toISOString(),
      }, ...prev]);
      toast.success(`${label} obtenu ! 🎉`);
    } catch {
      toast.error('Erreur lors de l\'échange');
    } finally {
      setRedeeming(null);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 py-5 sm:px-6">
        <div className="mx-auto max-w-2xl flex items-center gap-3">
          <Link href="/profile" className="text-gray-400 hover:text-gray-600 transition-colors">
            <Award className="h-5 w-5" />
          </Link>
          <ChevronRight className="h-4 w-4 text-gray-300" />
          <h1 className="text-lg font-bold text-gray-900">Programme fidélité</h1>
        </div>
      </div>

      <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6 space-y-6">
        {/* ── Tier card ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className={`relative overflow-hidden rounded-3xl bg-gradient-to-br ${tier.gradient} p-6 text-white shadow-xl`}
        >
          <div className="absolute -right-8 -top-8 h-36 w-36 rounded-full bg-white/10" />
          <div className="absolute -bottom-6 -right-2 h-24 w-24 rounded-full bg-white/10" />

          <div className="relative">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-white/80">Niveau actuel</p>
                <div className="mt-1 flex items-center gap-2">
                  <TierIcon className="h-6 w-6" />
                  <span className="text-2xl font-black">{tier.label}</span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-white/80">Vos points</p>
                <p className="text-3xl font-black tabular-nums">{loading ? '…' : loyalty.loyaltyPoints.toLocaleString('fr-FR')}</p>
              </div>
            </div>

            {tier.nextPoints && (
              <div className="mt-5">
                <div className="mb-1.5 flex justify-between text-xs text-white/70">
                  <span>{loyalty.loyaltyPoints} pts</span>
                  <span>{tier.nextPoints} pts → {TIER_CONFIG[tier.nextTier!]?.label}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-white/20">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPct}%` }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                    className="h-full rounded-full bg-white"
                  />
                </div>
                <p className="mt-1.5 text-xs text-white/70">
                  Plus que {(tier.nextPoints - loyalty.loyaltyPoints).toLocaleString('fr-FR')} pts pour passer {TIER_CONFIG[tier.nextTier!]?.label}
                </p>
              </div>
            )}

            {!tier.nextPoints && (
              <div className="mt-4 flex items-center gap-2">
                <Crown className="h-4 w-4" />
                <span className="text-sm font-medium">Niveau maximum atteint !</span>
              </div>
            )}
          </div>
        </motion.div>

        {/* ── Tier perks ── */}
        <div className="rounded-3xl bg-white p-5 shadow-sm">
          <h2 className="mb-3 font-bold text-gray-900">Vos avantages {tier.label}</h2>
          <div className="space-y-2.5">
            {tier.perks.map((perk, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-brand-100">
                  <CheckCircle2 className="h-3.5 w-3.5 text-brand-600" />
                </div>
                <span className="text-sm text-gray-700">{perk}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── All tiers ── */}
        <div className="rounded-3xl bg-white p-5 shadow-sm">
          <h2 className="mb-4 font-bold text-gray-900">Niveaux du programme</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {(['bronze', 'silver', 'gold', 'platinum'] as LoyaltyTier[]).map((t) => {
              const tc = TIER_CONFIG[t];
              const TI = tc.icon;
              const isCurrent = t === loyalty.loyaltyTier;
              return (
                <div
                  key={t}
                  className={`rounded-2xl border p-3 text-center transition-all ${isCurrent ? `${tc.border} ${tc.bg} ring-2 ring-offset-1 ring-current ${tc.color}` : 'border-gray-100 bg-gray-50'}`}
                >
                  <TI className={`mx-auto h-6 w-6 mb-1.5 ${isCurrent ? tc.color : 'text-gray-300'}`} />
                  <p className={`text-xs font-bold ${isCurrent ? tc.color : 'text-gray-400'}`}>{tc.label}</p>
                  <p className="mt-0.5 text-[10px] text-gray-400">{tc.minPoints === 0 ? 'Dès 0 pt' : `${tc.minPoints} pts`}</p>
                  {isCurrent && (
                    <span className="mt-1.5 inline-block rounded-full bg-brand-500 px-2 py-0.5 text-[9px] font-bold text-black">Actuel</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Rewards catalog ── */}
        <div className="rounded-3xl bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-bold text-gray-900">Échanger vos points</h2>
            <span className="text-sm font-semibold text-brand-600">{loyalty.loyaltyPoints} pts disponibles</span>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {REWARDS.map((reward) => {
              const canAfford = loyalty.loyaltyPoints >= reward.points;
              const isRedeeming = redeeming === reward.id;
              return (
                <motion.button
                  key={reward.id}
                  whileTap={canAfford ? { scale: 0.96 } : undefined}
                  onClick={() => redeem(reward.id, reward.points, reward.label)}
                  disabled={!canAfford || !!redeeming}
                  className={`flex flex-col items-center gap-2 rounded-2xl border p-4 text-center transition-all ${
                    canAfford
                      ? 'border-brand-200 bg-brand-50 hover:border-brand-400 hover:bg-brand-100 cursor-pointer'
                      : 'border-gray-100 bg-gray-50 opacity-50 cursor-not-allowed'
                  }`}
                >
                  <span className="text-3xl">{reward.emoji}</span>
                  <span className="text-xs font-semibold text-gray-800 leading-tight">{reward.label}</span>
                  <span className={`flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold ${canAfford ? 'bg-brand-500 text-black' : 'bg-gray-200 text-gray-500'}`}>
                    <Coins className="h-3 w-3" />
                    {reward.points} pts
                  </span>
                  {isRedeeming && <span className="text-[10px] text-brand-600">En cours…</span>}
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* ── Transaction history ── */}
        <div className="rounded-3xl bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-bold text-gray-900">Historique</h2>
            <button onClick={() => load()} className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600">
              <RefreshCw className="h-3.5 w-3.5" />
              Actualiser
            </button>
          </div>

          {transactions.length === 0 ? (
            <div className="flex flex-col items-center py-8 text-center">
              <Clock className="h-8 w-8 text-gray-200 mb-2" />
              <p className="text-sm text-gray-400">Aucune transaction pour l'instant</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50 -mx-5">
              {transactions.map((tx) => (
                <div key={tx.id} className="flex items-center gap-3 px-5 py-3.5">
                  <div className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full ${tx.type === 'earn' ? 'bg-green-100' : 'bg-red-100'}`}>
                    {tx.type === 'earn'
                      ? <ArrowUp className="h-4 w-4 text-green-600" />
                      : <ArrowDown className="h-4 w-4 text-red-500" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-800 truncate">{tx.reason}</p>
                    <p className="text-xs text-gray-400">{relativeDate(tx.createdAt)}</p>
                  </div>
                  <span className={`text-sm font-bold tabular-nums ${tx.type === 'earn' ? 'text-green-600' : 'text-red-500'}`}>
                    {tx.type === 'earn' ? '+' : ''}{tx.points} pts
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* CTA */}
        <div className="rounded-3xl bg-gradient-to-r from-brand-400 to-brand-600 p-5 text-center shadow-lg">
          <Gift className="mx-auto h-8 w-8 text-black mb-2" />
          <p className="font-bold text-black">Parrainez un ami</p>
          <p className="mt-1 text-sm text-black/70">Gagnez 200 points par ami parrainé</p>
          <button
            onClick={() => { navigator.clipboard?.writeText(`Rejoins FoodStack avec mon code ${user?.id?.slice(-6).toUpperCase() ?? 'AMI'} !`); toast.success('Code copié !'); }}
            className="mt-3 rounded-xl bg-black px-6 py-2.5 text-sm font-bold text-brand-400 hover:bg-gray-900 transition-colors"
          >
            Copier mon code parrain
          </button>
        </div>
      </div>
    </div>
  );
}
