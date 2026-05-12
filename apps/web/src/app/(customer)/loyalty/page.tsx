'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Trophy,
  Star,
  Gift,
  Zap,
  ChevronRight,
  Check,
  Lock,
  Clock,
  ShoppingBag,
  Percent,
  Coffee,
} from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import toast from 'react-hot-toast';

const USER_POINTS = 760;

const TIERS = [
  { name: 'Bronze', min: 0, max: 499, color: 'text-amber-700', bg: 'bg-amber-100', border: 'border-amber-200', icon: '🥉', perks: ['1 pt par euro dépensé', 'Offre anniversaire'] },
  { name: 'Silver', min: 500, max: 999, color: 'text-slate-600', bg: 'bg-slate-100', border: 'border-slate-200', icon: '🥈', perks: ['1.5 pt par euro', 'Livraison offerte 1×/mois', 'Offre anniversaire'] },
  { name: 'Gold', min: 1000, max: 2499, color: 'text-yellow-600', bg: 'bg-yellow-100', border: 'border-yellow-200', icon: '🥇', perks: ['2 pts par euro', 'Livraison offerte 3×/mois', 'Accès prioritaire', 'Offre anniversaire double'] },
  { name: 'Platinum', min: 2500, max: Infinity, color: 'text-purple-700', bg: 'bg-purple-100', border: 'border-purple-200', icon: '💎', perks: ['3 pts par euro', 'Livraison toujours offerte', 'Service client dédié', 'Invitations événements VIP'] },
];

const currentTierIndex = TIERS.findIndex((t) => USER_POINTS >= t.min && USER_POINTS <= t.max);
const currentTier = TIERS[currentTierIndex];
const nextTier = TIERS[currentTierIndex + 1];
const progressPct = nextTier
  ? Math.round(((USER_POINTS - currentTier.min) / (nextTier.min - currentTier.min)) * 100)
  : 100;

interface Reward {
  id: string;
  title: string;
  description: string;
  cost: number;
  icon: React.ElementType;
  category: 'reduction' | 'livraison' | 'cadeau';
  available: boolean;
}

const REWARDS: Reward[] = [
  { id: 'r1', title: '-5 € sur commande', description: 'Valable dès 20 € d\'achat', cost: 200, icon: Percent, category: 'reduction', available: true },
  { id: 'r2', title: 'Livraison offerte', description: 'Sur votre prochaine commande', cost: 150, icon: ShoppingBag, category: 'livraison', available: true },
  { id: 'r3', title: '-10 € sur commande', description: 'Valable dès 40 € d\'achat', cost: 400, icon: Percent, category: 'reduction', available: true },
  { id: 'r4', title: 'Dessert offert', description: 'Un dessert de votre choix', cost: 300, icon: Coffee, category: 'cadeau', available: true },
  { id: 'r5', title: '-20 € sur commande', description: 'Valable dès 60 € d\'achat', cost: 750, icon: Percent, category: 'reduction', available: false },
  { id: 'r6', title: 'Repas offert', description: 'Jusqu\'à 30 € offerts', cost: 1200, icon: Gift, category: 'cadeau', available: false },
];

const HISTORY = [
  { id: 'h1', label: 'Commande ORD-8821', points: +38, date: "Aujourd'hui", positive: true },
  { id: 'h2', label: 'Commande ORD-8805', points: +29, date: 'Hier', positive: true },
  { id: 'h3', label: 'Récompense — Livraison offerte', points: -150, date: '10 mai', positive: false },
  { id: 'h4', label: 'Commande ORD-8782', points: +61, date: '10 mai', positive: true },
  { id: 'h5', label: 'Commande ORD-8740', points: +38, date: '5 mai', positive: true },
  { id: 'h6', label: 'Bonus inscription', points: +100, date: '1 mai', positive: true },
];

const CATEGORY_LABELS: Record<Reward['category'], string> = {
  reduction: 'Réduction',
  livraison: 'Livraison',
  cadeau: 'Cadeau',
};

export default function LoyaltyPage() {
  const [points, setPoints] = useState(USER_POINTS);
  const [history, setHistory] = useState(HISTORY);
  const [selectedReward, setSelectedReward] = useState<Reward | null>(null);
  const [redeemModal, setRedeemModal] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<'all' | Reward['category']>('all');

  const redeem = () => {
    if (!selectedReward) return;
    setPoints((p) => p - selectedReward.cost);
    setHistory((h) => [
      { id: `h-${Date.now()}`, label: `Récompense — ${selectedReward.title}`, points: -selectedReward.cost, date: "Aujourd'hui", positive: false },
      ...h,
    ]);
    toast.success(`${selectedReward.title} activé ! Valable 30 jours.`);
    setRedeemModal(false);
    setSelectedReward(null);
  };

  const filteredRewards = REWARDS.filter(
    (r) => categoryFilter === 'all' || r.category === categoryFilter
  );

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-surface-50 py-8">
        <div className="mx-auto max-w-2xl space-y-5 px-4 sm:px-6">

          {/* Hero card */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="overflow-hidden rounded-2xl bg-gradient-to-br from-brand-500 to-brand-600 p-6 text-white shadow-brand"
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 text-white/80">
                  <Trophy className="h-4 w-4" />
                  <span className="text-sm font-medium">Programme fidélité</span>
                </div>
                <p className="mt-3 text-5xl font-bold tracking-tight">{points}</p>
                <p className="text-sm text-white/70">points disponibles</p>
              </div>
              <div className={`flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20 text-3xl`}>
                {currentTier.icon}
              </div>
            </div>

            {nextTier && (
              <div className="mt-5">
                <div className="mb-1.5 flex items-center justify-between text-sm">
                  <span className="text-white/80">
                    <span className="font-semibold text-white">{currentTier.name}</span>
                  </span>
                  <span className="text-white/70">
                    {nextTier.min - points} pts pour {nextTier.name}
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-white/20">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPct}%` }}
                    transition={{ duration: 1.2, ease: 'easeOut' }}
                    className="h-full rounded-full bg-white"
                  />
                </div>
              </div>
            )}
          </motion.div>

          {/* Tiers */}
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="rounded-2xl border border-surface-200 bg-white p-5 shadow-sm">
            <h2 className="mb-4 font-semibold text-surface-900">Niveaux & avantages</h2>
            <div className="space-y-3">
              {TIERS.map((tier, i) => {
                const isCurrent = i === currentTierIndex;
                const isUnlocked = USER_POINTS >= tier.min;
                return (
                  <div key={tier.name} className={`flex items-start gap-3 rounded-xl border p-3 transition-colors ${isCurrent ? `${tier.border} ${tier.bg}` : 'border-surface-100'}`}>
                    <span className="text-2xl">{tier.icon}</span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className={`font-semibold ${isCurrent ? tier.color : 'text-surface-700'}`}>{tier.name}</span>
                        {isCurrent && <Badge variant="brand" size="sm">Votre niveau</Badge>}
                        {!isUnlocked && <Lock className="h-3.5 w-3.5 text-surface-300" />}
                        <span className="ml-auto text-xs text-surface-400">
                          {tier.max === Infinity ? `${tier.min}+ pts` : `${tier.min}–${tier.max} pts`}
                        </span>
                      </div>
                      <ul className="mt-1 space-y-0.5">
                        {tier.perks.map((perk) => (
                          <li key={perk} className={`flex items-center gap-1.5 text-xs ${isUnlocked ? 'text-surface-600' : 'text-surface-300'}`}>
                            <Check className={`h-3 w-3 flex-shrink-0 ${isUnlocked ? 'text-green-500' : 'text-surface-300'}`} />
                            {perk}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>

          {/* Rewards */}
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="rounded-2xl border border-surface-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-semibold text-surface-900">Récompenses</h2>
              <div className="flex gap-1.5">
                {(['all', 'reduction', 'livraison', 'cadeau'] as const).map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setCategoryFilter(cat)}
                    className={`rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors ${categoryFilter === cat ? 'bg-brand-500 text-white' : 'bg-surface-100 text-surface-600 hover:bg-surface-200'}`}
                  >
                    {cat === 'all' ? 'Tout' : CATEGORY_LABELS[cat]}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {filteredRewards.map((reward) => {
                const canAfford = points >= reward.cost;
                const Icon = reward.icon;
                return (
                  <motion.button
                    key={reward.id}
                    whileHover={canAfford ? { scale: 1.02 } : {}}
                    whileTap={canAfford ? { scale: 0.98 } : {}}
                    onClick={() => {
                      if (!canAfford) return;
                      setSelectedReward(reward);
                      setRedeemModal(true);
                    }}
                    className={`flex flex-col items-start rounded-xl border p-4 text-left transition-colors ${
                      canAfford
                        ? 'border-surface-200 hover:border-brand-300 hover:bg-brand-50 cursor-pointer'
                        : 'border-surface-100 bg-surface-50 opacity-60 cursor-not-allowed'
                    }`}
                  >
                    <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl ${canAfford ? 'bg-brand-100 text-brand-600' : 'bg-surface-200 text-surface-400'}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <p className="font-semibold text-surface-900 text-sm leading-tight">{reward.title}</p>
                    <p className="mt-0.5 text-xs text-surface-500">{reward.description}</p>
                    <div className={`mt-3 flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-bold ${canAfford ? 'bg-brand-100 text-brand-700' : 'bg-surface-200 text-surface-500'}`}>
                      <Star className="h-3 w-3" />
                      {reward.cost} pts
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </motion.div>

          {/* Comment gagner des points */}
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="rounded-2xl border border-surface-200 bg-white p-5 shadow-sm">
            <h2 className="mb-4 font-semibold text-surface-900">Comment gagner des points ?</h2>
            <div className="space-y-3">
              {[
                { icon: ShoppingBag, label: 'Commande standard', pts: '1 pt / €', color: 'bg-blue-100 text-blue-600' },
                { icon: Zap, label: 'Bonus 1ère commande', pts: '+50 pts', color: 'bg-yellow-100 text-yellow-600' },
                { icon: Star, label: 'Laisser un avis', pts: '+20 pts', color: 'bg-purple-100 text-purple-600' },
                { icon: Gift, label: 'Parrainage', pts: '+100 pts', color: 'bg-green-100 text-green-600' },
              ].map(({ icon: Icon, label, pts, color }) => (
                <div key={label} className="flex items-center gap-3">
                  <div className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl ${color}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <span className="flex-1 text-sm text-surface-700">{label}</span>
                  <span className="text-sm font-bold text-brand-600">{pts}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Historique */}
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="rounded-2xl border border-surface-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-semibold text-surface-900">Historique</h2>
              <button className="flex items-center gap-1 text-xs font-medium text-brand-500 hover:text-brand-600">
                Tout voir <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="space-y-3">
              {history.slice(0, 6).map((entry) => (
                <div key={entry.id} className="flex items-center gap-3">
                  <div className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl ${entry.positive ? 'bg-green-100' : 'bg-red-50'}`}>
                    {entry.positive ? (
                      <Zap className="h-4 w-4 text-green-600" />
                    ) : (
                      <Gift className="h-4 w-4 text-red-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm font-medium text-surface-900">{entry.label}</p>
                    <p className="flex items-center gap-1 text-xs text-surface-400">
                      <Clock className="h-3 w-3" /> {entry.date}
                    </p>
                  </div>
                  <span className={`text-sm font-bold ${entry.positive ? 'text-green-600' : 'text-red-500'}`}>
                    {entry.positive ? '+' : ''}{entry.points} pts
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Redeem modal */}
      {selectedReward && (
        <Modal
          open={redeemModal}
          onClose={() => { setRedeemModal(false); setSelectedReward(null); }}
          title="Utiliser mes points"
          size="sm"
          footer={
            <div className="flex justify-end gap-3">
              <Button variant="ghost" onClick={() => { setRedeemModal(false); setSelectedReward(null); }}>Annuler</Button>
              <Button onClick={redeem}>Confirmer ({selectedReward.cost} pts)</Button>
            </div>
          }
        >
          <div className="space-y-4">
            <div className="flex items-center gap-4 rounded-xl bg-brand-50 p-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-100">
                <selectedReward.icon className="h-6 w-6 text-brand-600" />
              </div>
              <div>
                <p className="font-semibold text-surface-900">{selectedReward.title}</p>
                <p className="text-sm text-surface-500">{selectedReward.description}</p>
              </div>
            </div>
            <div className="space-y-2 rounded-xl border border-surface-100 p-3 text-sm">
              <div className="flex justify-between">
                <span className="text-surface-500">Solde actuel</span>
                <span className="font-semibold text-surface-900">{points} pts</span>
              </div>
              <div className="flex justify-between text-red-500">
                <span>Coût</span>
                <span className="font-semibold">-{selectedReward.cost} pts</span>
              </div>
              <div className="flex justify-between border-t border-surface-100 pt-2">
                <span className="text-surface-500">Solde restant</span>
                <span className="font-bold text-surface-900">{points - selectedReward.cost} pts</span>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
