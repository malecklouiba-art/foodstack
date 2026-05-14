'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Star, Gift, ChevronRight, ArrowUpRight, ArrowDownLeft,
  Truck, Percent, ShoppingBag, Crown, Award, Zap,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { clsx } from 'clsx';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

// ── Types ──────────────────────────────────────────────────────────────────────

interface Tier {
  name: string;
  range: string;
  min: number;
  max: number | null;
  color: string;
  bg: string;
  border: string;
  textColor: string;
  perks: string[];
  icon: React.ElementType;
}

interface Reward {
  id: string;
  label: string;
  cost: number;
  icon: React.ElementType;
  category: string;
}

interface HistoryEntry {
  id: string;
  date: string;
  description: string;
  points: number;
}

// ── Demo data ──────────────────────────────────────────────────────────────────

const USER_POINTS = 1247;
const USER_NAME = 'Marie Dupont';

const TIERS: Tier[] = [
  {
    name: 'Bronze',
    range: '0 – 499 pts',
    min: 0,
    max: 499,
    color: 'from-amber-700 to-amber-500',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    textColor: 'text-amber-800',
    perks: ['Livraison gratuite dès 40€'],
    icon: Award,
  },
  {
    name: 'Silver',
    range: '500 – 1 999 pts',
    min: 500,
    max: 1999,
    color: 'from-slate-500 to-slate-400',
    bg: 'bg-slate-50',
    border: 'border-slate-200',
    textColor: 'text-slate-700',
    perks: ['Livraison gratuite dès 25€', '5% de réduction'],
    icon: Star,
  },
  {
    name: 'Gold',
    range: '2 000 – 4 999 pts',
    min: 2000,
    max: 4999,
    color: 'from-yellow-500 to-amber-400',
    bg: 'bg-yellow-50',
    border: 'border-yellow-200',
    textColor: 'text-yellow-800',
    perks: ['Livraison gratuite', '10% de réduction', 'Commandes prioritaires'],
    icon: Crown,
  },
  {
    name: 'Platinum',
    range: '5 000+ pts',
    min: 5000,
    max: null,
    color: 'from-purple-600 to-purple-400',
    bg: 'bg-purple-50',
    border: 'border-purple-200',
    textColor: 'text-purple-800',
    perks: ['Livraison gratuite', '15% de réduction', 'Support VIP'],
    icon: Zap,
  },
];

const REWARDS: Reward[] = [
  { id: 'r1', label: 'Livraison gratuite',  cost: 100,  icon: Truck,       category: 'Livraison' },
  { id: 'r2', label: 'Dessert offert',       cost: 150,  icon: Gift,        category: 'Nourriture' },
  { id: 'r3', label: 'Réduction 5€',         cost: 200,  icon: Percent,     category: 'Réduction' },
  { id: 'r4', label: 'Repas offert (≤15€)',  cost: 500,  icon: ShoppingBag, category: 'Nourriture' },
  { id: 'r5', label: 'Bon cadeau 20€',       cost: 800,  icon: Gift,        category: 'Cadeau' },
  { id: 'r6', label: 'Accès VIP 1 mois',     cost: 1200, icon: Crown,       category: 'Premium' },
];

const HISTORY: HistoryEntry[] = [
  { id: 'h1', date: '11 mai 2026',  description: 'Commande #8821',    points:  47 },
  { id: 'h2', date: '8 mai 2026',   description: 'Commande #8820',    points:  29 },
  { id: 'h3', date: '5 mai 2026',   description: 'Échange — Dessert offert', points: -150 },
  { id: 'h4', date: '3 mai 2026',   description: 'Commande #8815',    points:  52 },
  { id: 'h5', date: '28 avr. 2026', description: 'Commande #8804',    points:  38 },
  { id: 'h6', date: '20 avr. 2026', description: 'Commande #8795',    points:  33 },
  { id: 'h7', date: '14 avr. 2026', description: 'Échange — Livraison gratuite', points: -100 },
  { id: 'h8', date: '10 avr. 2026', description: 'Commande #8780',    points:  44 },
];

// ── Helpers ────────────────────────────────────────────────────────────────────

function getCurrentTier(): Tier {
  return TIERS.find((t) => USER_POINTS >= t.min && (t.max === null || USER_POINTS <= t.max)) ?? TIERS[0];
}

function getNextTier(): Tier | null {
  const idx = TIERS.findIndex((t) => t.name === getCurrentTier().name);
  return idx < TIERS.length - 1 ? TIERS[idx + 1] : null;
}

// ── Progress bar ───────────────────────────────────────────────────────────────

function TierProgress() {
  const current = getCurrentTier();
  const next = getNextTier();
  const progressMax = next?.min ?? current.min;
  const progressMin = current.min;
  const pct = next
    ? Math.min(100, ((USER_POINTS - progressMin) / (progressMax - progressMin)) * 100)
    : 100;

  return (
    <Card padding="lg" className="overflow-hidden">
      {/* Gradient header strip */}
      <div className={clsx('mb-6 -mx-8 -mt-8 bg-gradient-to-r px-8 pt-8 pb-6', current.color)}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-white/80">Votre niveau</p>
            <h2 className="mt-0.5 text-3xl font-black text-white">{current.name}</h2>
          </div>
          <div className="flex flex-col items-end">
            <p className="text-sm text-white/80">Solde actuel</p>
            <p className="text-3xl font-black text-white">
              {USER_POINTS.toLocaleString('fr-FR')} <span className="text-xl font-bold">pts</span>
            </p>
          </div>
        </div>
      </div>

      {/* Progress to next tier */}
      {next ? (
        <div>
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="font-medium text-gray-700">Progression vers {next.name}</span>
            <span className="font-semibold text-gray-900">
              {USER_POINTS.toLocaleString('fr-FR')} / {next.min.toLocaleString('fr-FR')} pts
            </span>
          </div>
          <div className="h-3 w-full overflow-hidden rounded-full bg-gray-100">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 1.2, ease: 'easeOut' }}
              className={clsx('h-full rounded-full bg-gradient-to-r', current.color)}
            />
          </div>
          <p className="mt-2 text-xs text-gray-500">
            Plus que{' '}
            <span className="font-semibold text-gray-700">
              {(next.min - USER_POINTS).toLocaleString('fr-FR')} pts
            </span>{' '}
            pour atteindre le niveau {next.name}
          </p>
        </div>
      ) : (
        <p className="text-sm font-medium text-purple-600">
          Vous avez atteint le niveau maximum !
        </p>
      )}

      {/* Current perks */}
      <div className="mt-5 border-t border-gray-100 pt-5">
        <p className="mb-3 text-sm font-semibold text-gray-700">Vos avantages {current.name}</p>
        <ul className="space-y-1.5">
          {current.perks.map((perk) => (
            <li key={perk} className="flex items-center gap-2 text-sm text-gray-600">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-green-100">
                <svg className="h-3 w-3 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </span>
              {perk}
            </li>
          ))}
        </ul>
      </div>
    </Card>
  );
}

// ── Tier cards row ─────────────────────────────────────────────────────────────

function TierCards() {
  const current = getCurrentTier();

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {TIERS.map((tier) => {
        const Icon = tier.icon;
        const isActive = tier.name === current.name;
        const isPast = tier.min < current.min;
        return (
          <div
            key={tier.name}
            className={clsx(
              'rounded-2xl border p-4 transition-all',
              isActive && `${tier.bg} ${tier.border} ring-2 ring-offset-1`,
              isActive && tier.border.replace('border-', 'ring-'),
              !isActive && 'border-gray-100 bg-white',
              isPast && 'opacity-60'
            )}
          >
            <div className={clsx('mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br', tier.color)}>
              <Icon className="h-4 w-4 text-white" />
            </div>
            <p className={clsx('font-bold', isActive ? tier.textColor : 'text-gray-800')}>{tier.name}</p>
            <p className="mt-0.5 text-xs text-gray-500">{tier.range}</p>
            <ul className="mt-3 space-y-1">
              {tier.perks.map((perk) => (
                <li key={perk} className="text-xs text-gray-500 leading-relaxed">{perk}</li>
              ))}
            </ul>
            {isActive && (
              <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-green-600">
                <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                Niveau actuel
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Rewards catalog ────────────────────────────────────────────────────────────

function RewardsCatalog() {
  const [redeemed, setRedeemed] = useState<string[]>([]);
  const [points, setPoints] = useState(USER_POINTS);

  function handleRedeem(reward: Reward) {
    if (points < reward.cost) return;
    setPoints((p) => p - reward.cost);
    setRedeemed((prev) => [...prev, reward.id]);
    // Reset after 2s so demo stays usable
    setTimeout(() => setRedeemed((prev) => prev.filter((id) => id !== reward.id)), 2000);
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-bold text-gray-900">Catalogue de récompenses</h2>
        <span className="text-sm font-semibold text-brand-600">
          {points.toLocaleString('fr-FR')} pts disponibles
        </span>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {REWARDS.map((reward) => {
          const Icon = reward.icon;
          const canAfford = points >= reward.cost;
          const isJustRedeemed = redeemed.includes(reward.id);
          const shortfall = reward.cost - points;

          return (
            <motion.div
              key={reward.id}
              whileHover={canAfford ? { y: -2 } : {}}
              transition={{ duration: 0.15 }}
            >
              <Card
                padding="md"
                className={clsx(
                  'flex flex-col gap-3 transition-shadow',
                  canAfford ? 'hover:shadow-md' : 'opacity-70'
                )}
              >
                <div className="flex items-center gap-3">
                  <div className={clsx(
                    'flex h-10 w-10 items-center justify-center rounded-xl',
                    canAfford ? 'bg-brand-50' : 'bg-gray-100'
                  )}>
                    <Icon className={clsx('h-5 w-5', canAfford ? 'text-brand-500' : 'text-gray-400')} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-gray-900 leading-tight">{reward.label}</p>
                    <Badge variant="default" size="sm">{reward.category}</Badge>
                  </div>
                  <p className={clsx('shrink-0 text-sm font-bold', canAfford ? 'text-brand-600' : 'text-gray-400')}>
                    {reward.cost} pts
                  </p>
                </div>

                <Button
                  variant={isJustRedeemed ? 'secondary' : canAfford ? 'primary' : 'ghost'}
                  size="sm"
                  fullWidth
                  disabled={!canAfford && !isJustRedeemed}
                  onClick={() => handleRedeem(reward)}
                >
                  {isJustRedeemed
                    ? 'Échangé !'
                    : canAfford
                    ? 'Échanger'
                    : `Manque ${shortfall} pts`}
                </Button>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

// ── History table ──────────────────────────────────────────────────────────────

function PointsHistory() {
  return (
    <div>
      <h2 className="mb-4 text-lg font-bold text-gray-900">Historique des points</h2>
      <Card padding="none" className="overflow-hidden">
        <div className="divide-y divide-gray-100">
          {HISTORY.map((entry, idx) => {
            const isPositive = entry.points > 0;
            return (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, x: -4 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.04 }}
                className="flex items-center justify-between px-5 py-3.5 hover:bg-gray-50"
              >
                <div className="flex items-center gap-3">
                  <div className={clsx(
                    'flex h-8 w-8 items-center justify-center rounded-lg',
                    isPositive ? 'bg-green-50' : 'bg-red-50'
                  )}>
                    {isPositive
                      ? <ArrowUpRight className="h-4 w-4 text-green-600" />
                      : <ArrowDownLeft className="h-4 w-4 text-red-500" />}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{entry.description}</p>
                    <p className="text-xs text-gray-400">{entry.date}</p>
                  </div>
                </div>
                <span className={clsx(
                  'text-sm font-bold',
                  isPositive ? 'text-green-600' : 'text-red-500'
                )}>
                  {isPositive ? '+' : ''}{entry.points} pts
                </span>
              </motion.div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function LoyaltyPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="border-b border-gray-100 bg-white px-4 py-5 sm:px-6">
        <div className="mx-auto max-w-3xl">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-gray-400 transition-colors hover:text-gray-600">
              <Star className="h-5 w-5" />
            </Link>
            <ChevronRight className="h-4 w-4 text-gray-300" />
            <h1 className="text-lg font-bold text-gray-900">Programme Fidélité</h1>
          </div>

          <div className="mt-3 flex items-center justify-between">
            <p className="text-sm text-gray-500">
              Bonjour, <span className="font-semibold text-gray-800">{USER_NAME}</span>
            </p>
            <div className="flex items-center gap-2 rounded-xl bg-brand-50 px-3 py-1.5">
              <Star className="h-4 w-4 text-brand-500" />
              <span className="text-sm font-bold text-brand-700">
                {USER_POINTS.toLocaleString('fr-FR')} pts
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-3xl space-y-8 px-4 py-6 sm:px-6">
        {/* Current tier + progress */}
        <TierProgress />

        {/* All tiers */}
        <div>
          <h2 className="mb-4 text-lg font-bold text-gray-900">Niveaux de fidélité</h2>
          <TierCards />
        </div>

        {/* Rewards catalog */}
        <RewardsCatalog />

        {/* Points history */}
        <PointsHistory />
      </div>
    </div>
  );
}
