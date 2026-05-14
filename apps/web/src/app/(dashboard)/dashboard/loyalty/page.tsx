'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Gift, Star, Users, Award, CheckCircle, Edit2,
  ShoppingCart, Zap, UserPlus, MessageSquare, Cake,
  TrendingUp, ToggleLeft, ToggleRight,
} from 'lucide-react';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

// ── Types ────────────────────────────────────────────────────────────────────

type Tier = 'Bronze' | 'Silver' | 'Gold' | 'Platinum';

interface TierConfig {
  name: Tier;
  range: string;
  members: number;
  color: string;
  dot: string;
  bg: string;
  textColor: string;
  benefits: string[];
}

interface PointRule {
  id: string;
  action: string;
  points: string;
  active: boolean;
  updatedAt: string;
  icon: typeof ShoppingCart;
}

interface Redemption {
  id: string;
  user: string;
  reward: string;
  points: number;
  when: string;
}

// ── Static data ───────────────────────────────────────────────────────────────

const TIERS: TierConfig[] = [
  {
    name: 'Bronze',
    range: '0 – 499 pts',
    members: 234,
    color: 'border-amber-200',
    dot: 'bg-amber-500',
    bg: 'bg-amber-50',
    textColor: 'text-amber-700',
    benefits: [
      '-5% sur commande suivante',
      'Livraison gratuite à partir de 25€',
    ],
  },
  {
    name: 'Silver',
    range: '500 – 999 pts',
    members: 89,
    color: 'border-slate-200',
    dot: 'bg-slate-400',
    bg: 'bg-slate-50',
    textColor: 'text-slate-600',
    benefits: [
      '-10% sur commande suivante',
      'Livraison gratuite à partir de 20€',
      'Accès aux offres exclusives',
    ],
  },
  {
    name: 'Gold',
    range: '1 000 – 2 499 pts',
    members: 34,
    color: 'border-yellow-200',
    dot: 'bg-yellow-500',
    bg: 'bg-yellow-50',
    textColor: 'text-yellow-700',
    benefits: [
      '-15% sur commande suivante',
      'Livraison gratuite',
      'Priorité support client',
    ],
  },
  {
    name: 'Platinum',
    range: '2 500+ pts',
    members: 12,
    color: 'border-purple-200',
    dot: 'bg-purple-500',
    bg: 'bg-purple-50',
    textColor: 'text-purple-700',
    benefits: [
      '-20% sur commande suivante',
      'Livraison gratuite',
      'Chef dédié',
      'Invitations événements privés',
    ],
  },
];

const INITIAL_RULES: PointRule[] = [
  { id: 'r1', action: 'Achat', points: '1€ = 1 point', active: true, updatedAt: '01/05/2026', icon: ShoppingCart },
  { id: 'r2', action: 'Première commande', points: '+50 pts bonus', active: true, updatedAt: '15/03/2026', icon: Zap },
  { id: 'r3', action: 'Parrainage', points: '+100 pts bonus', active: true, updatedAt: '10/04/2026', icon: UserPlus },
  { id: 'r4', action: 'Avis laissé', points: '+20 pts bonus', active: false, updatedAt: '28/02/2026', icon: MessageSquare },
  { id: 'r5', action: 'Anniversaire', points: '+200 pts bonus', active: true, updatedAt: '01/01/2026', icon: Cake },
];

const REDEMPTIONS: Redemption[] = [
  { id: 'red1', user: 'Sophie M.', reward: 'Livraison gratuite', points: 500, when: 'il y a 2h' },
  { id: 'red2', user: 'Antoine B.', reward: 'Réduction 15%', points: 300, when: 'il y a 5h' },
  { id: 'red3', user: 'Marie L.', reward: 'Dessert offert', points: 150, when: 'il y a 1j' },
  { id: 'red4', user: 'Pierre D.', reward: 'Livraison gratuite', points: 500, when: 'il y a 2j' },
  { id: 'red5', user: 'Julien K.', reward: 'Réduction 5%', points: 100, when: 'il y a 3j' },
];

// ── Tier card ─────────────────────────────────────────────────────────────────

function TierCard({ tier }: { tier: TierConfig }) {
  const [editing, setEditing] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-2xl border-2 ${tier.color} bg-white shadow-sm p-5 flex flex-col gap-4`}
    >
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2.5">
          <span className={`h-3 w-3 rounded-full ${tier.dot} shrink-0`} />
          <div>
            <p className={`text-base font-bold ${tier.textColor}`}>{tier.name}</p>
            <p className="text-xs text-surface-400">{tier.range}</p>
          </div>
        </div>
        <div className={`flex items-center gap-1.5 rounded-full ${tier.bg} px-2.5 py-1`}>
          <Users className={`h-3.5 w-3.5 ${tier.textColor}`} />
          <span className={`text-xs font-semibold ${tier.textColor}`}>{tier.members} membres</span>
        </div>
      </div>

      {/* Benefits */}
      <div className="flex-1 space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-surface-400">Avantages</p>
        <ul className="space-y-1.5">
          {tier.benefits.map((benefit) => (
            <li key={benefit} className="flex items-start gap-2">
              <CheckCircle className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${tier.textColor}`} />
              <span className="text-xs text-surface-700">{benefit}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Action */}
      <button
        onClick={() => setEditing(!editing)}
        className={`flex w-full items-center justify-center gap-2 rounded-xl border py-2 text-xs font-semibold transition-colors ${
          editing
            ? `${tier.bg} ${tier.textColor} border-transparent`
            : 'border-surface-200 text-surface-600 hover:bg-surface-50'
        }`}
      >
        <Edit2 className="h-3.5 w-3.5" />
        {editing ? 'Modification…' : 'Modifier'}
      </button>
    </motion.div>
  );
}

// ── Toggle switch ─────────────────────────────────────────────────────────────

function Toggle({ active, onToggle }: { active: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      aria-label={active ? 'Désactiver' : 'Activer'}
      className="focus:outline-none"
    >
      {active ? (
        <ToggleRight className="h-6 w-6 text-brand-500" />
      ) : (
        <ToggleLeft className="h-6 w-6 text-surface-300" />
      )}
    </button>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function LoyaltyPage() {
  const [rules, setRules] = useState<PointRule[]>(INITIAL_RULES);

  function toggleRule(id: string) {
    setRules((prev) =>
      prev.map((r) => (r.id === id ? { ...r, active: !r.active } : r))
    );
  }

  const STATS = [
    { label: 'Membres actifs', value: '369', icon: Users, color: 'text-brand-600', bg: 'bg-brand-50' },
    { label: 'Points distribués', value: '184 230', icon: Star, color: 'text-yellow-600', bg: 'bg-yellow-50' },
    { label: 'Récompenses échangées', value: '47', icon: Gift, color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: 'Taux de participation', value: '29,6 %', icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-50' },
  ];

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-surface-900">Programme de Fidélité</h1>
        <p className="mt-1 text-sm text-surface-500">Configurez les règles et récompenses</p>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {STATS.map(({ label, value, icon: Icon, color, bg }, i) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
          >
            <Card padding="md" className="flex items-center gap-3">
              <div className={`rounded-xl p-2.5 ${bg} shrink-0`}>
                <Icon className={`h-5 w-5 ${color}`} />
              </div>
              <div>
                <p className="text-lg font-bold text-surface-900">{value}</p>
                <p className="text-xs text-surface-400">{label}</p>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Tier grid */}
      <div>
        <h2 className="mb-3 flex items-center gap-2 text-base font-semibold text-surface-800">
          <Award className="h-4 w-4 text-brand-500" />
          Configuration des paliers
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {TIERS.map((tier) => (
            <TierCard key={tier.name} tier={tier} />
          ))}
        </div>
      </div>

      {/* Points rules table */}
      <Card padding="none">
        <CardHeader className="border-b border-surface-100 px-6 py-5">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-brand-500" />
            <CardTitle>Règles d&apos;attribution des points</CardTitle>
          </div>
          <span className="text-sm text-surface-400">
            {rules.filter((r) => r.active).length} règle{rules.filter((r) => r.active).length !== 1 ? 's' : ''} active{rules.filter((r) => r.active).length !== 1 ? 's' : ''}
          </span>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-surface-100 text-left">
                {['Action', 'Points gagnés', 'Actif', 'Modifié le'].map((h) => (
                  <th
                    key={h}
                    className="px-6 py-3 text-xs font-semibold uppercase tracking-wide text-surface-400 whitespace-nowrap"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-50">
              <AnimatePresence>
                {rules.map((rule) => {
                  const RuleIcon = rule.icon;
                  return (
                    <motion.tr
                      key={rule.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className={`transition-colors ${rule.active ? 'hover:bg-surface-50' : 'bg-surface-50/60 opacity-60'}`}
                    >
                      {/* Action */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50 shrink-0">
                            <RuleIcon className="h-4 w-4 text-brand-500" />
                          </div>
                          <span className="font-medium text-surface-900">{rule.action}</span>
                        </div>
                      </td>

                      {/* Points */}
                      <td className="px-6 py-4">
                        <Badge variant="brand">{rule.points}</Badge>
                      </td>

                      {/* Toggle */}
                      <td className="px-6 py-4">
                        <Toggle active={rule.active} onToggle={() => toggleRule(rule.id)} />
                      </td>

                      {/* Updated */}
                      <td className="px-6 py-4 text-sm text-surface-500 whitespace-nowrap">
                        {rule.updatedAt}
                      </td>
                    </motion.tr>
                  );
                })}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </Card>

      {/* Recent redemptions */}
      <Card padding="none">
        <CardHeader className="border-b border-surface-100 px-6 py-5">
          <div className="flex items-center gap-2">
            <Gift className="h-4 w-4 text-brand-500" />
            <CardTitle>Derniers échanges de récompenses</CardTitle>
          </div>
          <span className="text-sm text-surface-400">{REDEMPTIONS.length} récents</span>
        </CardHeader>
        <ul className="divide-y divide-surface-50">
          {REDEMPTIONS.map((item, i) => (
            <motion.li
              key={item.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="flex items-center justify-between px-6 py-4 hover:bg-surface-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                {/* Avatar */}
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-100 shrink-0">
                  <span className="text-xs font-bold text-surface-600">
                    {item.user.split(' ')[0][0]}{item.user.split(' ')[1]?.[0] ?? ''}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-medium text-surface-900">
                    <span className="font-semibold">{item.user}</span>
                    <span className="mx-1.5 text-surface-400">→</span>
                    {item.reward}
                  </p>
                  <p className="text-xs text-surface-400">{item.when}</p>
                </div>
              </div>
              <span className="rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-600 whitespace-nowrap">
                −{item.points} pts
              </span>
            </motion.li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
