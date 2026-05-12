'use client';

import { useState, useCallback } from 'react';
import {
  Users,
  Gift,
  ArrowLeftRight,
  TrendingUp,
  Search,
  Save,
  Trophy,
  Star,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';

// ─── Types ──────────────────────────────────────────────────────────────────

type Tier = 'bronze' | 'silver' | 'gold' | 'platinum';
type TransactionAction = 'earned' | 'redeemed';
type FilterTab = 'all' | 'earned' | 'redeemed';

interface Transaction {
  id: string;
  client: string;
  action: TransactionAction;
  points: number;
  orderId: string;
  date: string;
}

interface TopCustomer {
  rank: number;
  name: string;
  tier: Tier;
  totalPoints: number;
  totalSpent: number;
}

interface ProgramConfig {
  pointsPerEuro: number;
  pointValueEuros: number;
  silverThreshold: number;
  goldThreshold: number;
  platinumThreshold: number;
}

// ─── Mock data ───────────────────────────────────────────────────────────────

const MOCK_TRANSACTIONS: Transaction[] = [
  { id: 'TXN-001', client: 'Marie Lambert', action: 'earned', points: 230, orderId: 'ORD-8801', date: '2026-05-12' },
  { id: 'TXN-002', client: 'Pierre Dubois', action: 'redeemed', points: 500, orderId: 'ORD-8799', date: '2026-05-12' },
  { id: 'TXN-003', client: 'Sophie Martin', action: 'earned', points: 185, orderId: 'ORD-8798', date: '2026-05-11' },
  { id: 'TXN-004', client: 'Julien Kowalski', action: 'earned', points: 320, orderId: 'ORD-8797', date: '2026-05-11' },
  { id: 'TXN-005', client: 'Emma Rousseau', action: 'redeemed', points: 1000, orderId: 'ORD-8795', date: '2026-05-11' },
  { id: 'TXN-006', client: 'Lucas Bernard', action: 'earned', points: 90, orderId: 'ORD-8793', date: '2026-05-10' },
  { id: 'TXN-007', client: 'Chloé Petit', action: 'redeemed', points: 250, orderId: 'ORD-8792', date: '2026-05-10' },
  { id: 'TXN-008', client: 'Thomas Lefebvre', action: 'earned', points: 410, orderId: 'ORD-8790', date: '2026-05-10' },
  { id: 'TXN-009', client: 'Alice Moreau', action: 'earned', points: 165, orderId: 'ORD-8788', date: '2026-05-09' },
  { id: 'TXN-010', client: 'Nathan Simon', action: 'redeemed', points: 750, orderId: 'ORD-8787', date: '2026-05-09' },
  { id: 'TXN-011', client: 'Inès Garcia', action: 'earned', points: 280, orderId: 'ORD-8785', date: '2026-05-09' },
  { id: 'TXN-012', client: 'Maxime Laurent', action: 'earned', points: 350, orderId: 'ORD-8783', date: '2026-05-08' },
  { id: 'TXN-013', client: 'Camille Dupont', action: 'redeemed', points: 500, orderId: 'ORD-8782', date: '2026-05-08' },
  { id: 'TXN-014', client: 'Romain Fontaine', action: 'earned', points: 120, orderId: 'ORD-8780', date: '2026-05-08' },
  { id: 'TXN-015', client: 'Sarah Chevalier', action: 'earned', points: 490, orderId: 'ORD-8778', date: '2026-05-07' },
];

const TOP_CUSTOMERS: TopCustomer[] = [
  { rank: 1, name: 'Emma Rousseau', tier: 'platinum', totalPoints: 3420, totalSpent: 342.0 },
  { rank: 2, name: 'Thomas Lefebvre', tier: 'gold', totalPoints: 1850, totalSpent: 185.0 },
  { rank: 3, name: 'Sarah Chevalier', tier: 'gold', totalPoints: 1320, totalSpent: 132.0 },
  { rank: 4, name: 'Julien Kowalski', tier: 'silver', totalPoints: 740, totalSpent: 74.0 },
  { rank: 5, name: 'Marie Lambert', tier: 'silver', totalPoints: 610, totalSpent: 61.0 },
];

// ─── Tier config ─────────────────────────────────────────────────────────────

const TIER_CONFIG: Record<
  Tier,
  { label: string; color: string; badgeBg: string; badgeText: string; barColor: string }
> = {
  bronze: {
    label: 'Bronze',
    color: 'bg-amber-700',
    badgeBg: 'bg-amber-900/40',
    badgeText: 'text-amber-400',
    barColor: '#92400e',
  },
  silver: {
    label: 'Silver',
    color: 'bg-slate-400',
    badgeBg: 'bg-slate-800/60',
    badgeText: 'text-slate-300',
    barColor: '#94a3b8',
  },
  gold: {
    label: 'Gold',
    color: 'bg-yellow-500',
    badgeBg: 'bg-yellow-900/40',
    badgeText: 'text-yellow-400',
    barColor: '#eab308',
  },
  platinum: {
    label: 'Platinum',
    color: 'bg-purple-500',
    badgeBg: 'bg-purple-900/40',
    badgeText: 'text-purple-400',
    barColor: '#a855f7',
  },
};

const TIER_DISTRIBUTION: { tier: Tier; percent: number; count: number }[] = [
  { tier: 'bronze', percent: 45, count: 562 },
  { tier: 'silver', percent: 32, count: 399 },
  { tier: 'gold', percent: 18, count: 224 },
  { tier: 'platinum', percent: 5, count: 62 },
];

// ─── Sub-components ──────────────────────────────────────────────────────────

function TierBadge({ tier }: { tier: Tier }) {
  const cfg = TIER_CONFIG[tier];
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${cfg.badgeBg} ${cfg.badgeText}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${cfg.color}`} />
      {cfg.label}
    </span>
  );
}

// ─── Toast ───────────────────────────────────────────────────────────────────

function Toast({ message, onDone }: { message: string; onDone: () => void }) {
  return (
    <div
      className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-xl border border-green-700 bg-gray-900 px-4 py-3 shadow-xl"
      onAnimationEnd={onDone}
    >
      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-green-500 text-white">
        ✓
      </span>
      <span className="text-sm font-medium text-white">{message}</span>
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function LoyaltyPage() {
  // Config state
  const [config, setConfig] = useState<ProgramConfig>({
    pointsPerEuro: 10,
    pointValueEuros: 0.01,
    silverThreshold: 500,
    goldThreshold: 1000,
    platinumThreshold: 2500,
  });
  const [saving, setSaving] = useState(false);
  const [showToast, setShowToast] = useState(false);

  // Transactions state
  const [filterTab, setFilterTab] = useState<FilterTab>('all');
  const [search, setSearch] = useState('');

  const handleConfigChange = useCallback(
    (field: keyof ProgramConfig) => (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value;
      const parsed = parseFloat(raw);
      setConfig((prev) => ({ ...prev, [field]: isNaN(parsed) ? 0 : parsed }));
    },
    []
  );

  const handleSave = useCallback(async () => {
    setSaving(true);
    await new Promise<void>((resolve) => setTimeout(resolve, 600));
    setSaving(false);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  }, []);

  const filteredTransactions = MOCK_TRANSACTIONS.filter((tx) => {
    const matchesFilter =
      filterTab === 'all' ||
      (filterTab === 'earned' && tx.action === 'earned') ||
      (filterTab === 'redeemed' && tx.action === 'redeemed');
    const matchesSearch = tx.client.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="space-y-6 p-6">
      {/* ── Header ── */}
      <div>
        <h1 className="text-2xl font-bold text-white">Programme fidélité</h1>
        <p className="mt-1 text-sm text-gray-400">
          Gérez les points et récompenses de vos clients
        </p>
      </div>

      {/* ── Program stats ── */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          {
            label: 'Membres actifs',
            value: '1 247',
            icon: Users,
            iconBg: 'bg-blue-900/40',
            iconColor: 'text-blue-400',
          },
          {
            label: 'Points distribués ce mois',
            value: '48 320',
            icon: Star,
            iconBg: 'bg-yellow-900/40',
            iconColor: 'text-yellow-400',
          },
          {
            label: 'Points échangés ce mois',
            value: '12 840',
            icon: Gift,
            iconBg: 'bg-purple-900/40',
            iconColor: 'text-purple-400',
          },
          {
            label: "Taux d'engagement",
            value: '73%',
            icon: TrendingUp,
            iconBg: 'bg-green-900/40',
            iconColor: 'text-green-400',
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-2xl border border-gray-800 bg-gray-900 p-6"
          >
            <div
              className={`mb-4 flex h-10 w-10 items-center justify-center rounded-xl ${stat.iconBg}`}
            >
              <stat.icon className={`h-5 w-5 ${stat.iconColor}`} />
            </div>
            <p className="text-2xl font-bold text-white">{stat.value}</p>
            <p className="mt-1 text-sm text-gray-400">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* ── Tier distribution ── */}
      <div className="rounded-2xl border border-gray-800 bg-gray-900 p-6">
        <h2 className="mb-4 font-semibold text-white">Répartition par niveau</h2>

        {/* Stacked bar */}
        <div className="flex h-8 w-full overflow-hidden rounded-xl">
          {TIER_DISTRIBUTION.map((d) => (
            <div
              key={d.tier}
              className="flex items-center justify-center text-xs font-semibold text-white transition-all"
              style={{
                width: `${d.percent}%`,
                backgroundColor: TIER_CONFIG[d.tier].barColor,
              }}
              title={`${TIER_CONFIG[d.tier].label}: ${d.percent}%`}
            >
              {d.percent >= 10 ? `${d.percent}%` : ''}
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="mt-4 flex flex-wrap gap-4">
          {TIER_DISTRIBUTION.map((d) => (
            <div key={d.tier} className="flex items-center gap-2">
              <span
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: TIER_CONFIG[d.tier].barColor }}
              />
              <span className="text-sm text-gray-300">
                {TIER_CONFIG[d.tier].label}
              </span>
              <span className="text-sm font-semibold text-white">{d.percent}%</span>
              <span className="text-xs text-gray-500">({d.count} clients)</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Points configuration ── */}
      <div className="rounded-2xl border border-gray-800 bg-gray-900 p-6">
        <div className="mb-5 flex items-center gap-2">
          <ArrowLeftRight className="h-4 w-4 text-brand-500" />
          <h2 className="font-semibold text-white">Configuration des points</h2>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Input
            label="Points par euro"
            type="number"
            min={0}
            step={1}
            value={config.pointsPerEuro}
            onChange={handleConfigChange('pointsPerEuro')}
          />
          <Input
            label="Valeur d'un point en euros"
            type="number"
            min={0}
            step={0.001}
            value={config.pointValueEuros}
            onChange={handleConfigChange('pointValueEuros')}
          />
          <Input
            label="Seuil Silver (pts)"
            type="number"
            min={0}
            step={1}
            value={config.silverThreshold}
            onChange={handleConfigChange('silverThreshold')}
          />
          <Input
            label="Seuil Gold (pts)"
            type="number"
            min={0}
            step={1}
            value={config.goldThreshold}
            onChange={handleConfigChange('goldThreshold')}
          />
          <Input
            label="Seuil Platinum (pts)"
            type="number"
            min={0}
            step={1}
            value={config.platinumThreshold}
            onChange={handleConfigChange('platinumThreshold')}
          />
        </div>

        <div className="mt-5 flex justify-end">
          <Button
            variant="primary"
            icon={<Save className="h-4 w-4" />}
            loading={saving}
            onClick={() => { void handleSave(); }}
          >
            Enregistrer
          </Button>
        </div>
      </div>

      {/* ── Recent transactions ── */}
      <div className="rounded-2xl border border-gray-800 bg-gray-900">
        <div className="border-b border-gray-800 px-6 py-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="font-semibold text-white">Transactions récentes</h2>
            <div className="relative w-full sm:w-56">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
              <input
                type="text"
                placeholder="Rechercher un client…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-9 w-full rounded-xl border border-gray-700 bg-gray-800 pl-9 pr-3 text-sm text-white placeholder-gray-500 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              />
            </div>
          </div>

          {/* Filter tabs */}
          <div className="mt-3 flex gap-1 rounded-xl border border-gray-700 bg-gray-800 p-1 w-fit">
            {(
              [
                { key: 'all', label: 'Tous' },
                { key: 'earned', label: 'Gagné' },
                { key: 'redeemed', label: 'Échangé' },
              ] as { key: FilterTab; label: string }[]
            ).map((tab) => (
              <button
                key={tab.key}
                onClick={() => setFilterTab(tab.key)}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                  filterTab === tab.key
                    ? 'bg-gray-700 text-white shadow-sm'
                    : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Client
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Action
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                  Points
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Commande
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Date
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-gray-500">
                    Aucune transaction trouvée
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-gray-800/50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <Avatar name={tx.client} size="sm" />
                        <span className="font-medium text-white">{tx.client}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {tx.action === 'earned' ? (
                        <Badge variant="success" dot>
                          Gagné
                        </Badge>
                      ) : (
                        <Badge variant="info" dot>
                          Échangé
                        </Badge>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right font-semibold">
                      <span
                        className={
                          tx.action === 'earned' ? 'text-green-400' : 'text-blue-400'
                        }
                      >
                        {tx.action === 'earned' ? '+' : '−'}
                        {tx.points.toLocaleString('fr-FR')}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-400">{tx.orderId}</td>
                    <td className="px-6 py-4 text-gray-400">
                      {new Date(tx.date).toLocaleDateString('fr-FR')}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Top customers ── */}
      <div className="rounded-2xl border border-gray-800 bg-gray-900 p-6">
        <div className="mb-5 flex items-center gap-2">
          <Trophy className="h-4 w-4 text-yellow-400" />
          <h2 className="font-semibold text-white">Meilleurs clients</h2>
        </div>

        <div className="space-y-3">
          {TOP_CUSTOMERS.map((customer) => (
            <div
              key={customer.rank}
              className="flex items-center gap-4 rounded-xl border border-gray-800 bg-gray-800/40 px-4 py-3"
            >
              {/* Rank */}
              <span
                className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg text-xs font-bold ${
                  customer.rank === 1
                    ? 'bg-yellow-900/50 text-yellow-400'
                    : customer.rank === 2
                    ? 'bg-slate-700 text-slate-300'
                    : customer.rank === 3
                    ? 'bg-amber-900/50 text-amber-600'
                    : 'bg-gray-700 text-gray-400'
                }`}
              >
                {customer.rank}
              </span>

              {/* Avatar */}
              <Avatar name={customer.name} size="sm" />

              {/* Name + tier */}
              <div className="flex-1 min-w-0">
                <p className="truncate font-medium text-white">{customer.name}</p>
                <TierBadge tier={customer.tier} />
              </div>

              {/* Stats */}
              <div className="text-right">
                <p className="font-semibold text-white">
                  {customer.totalPoints.toLocaleString('fr-FR')} pts
                </p>
                <p className="text-xs text-gray-400">
                  {customer.totalSpent.toLocaleString('fr-FR', {
                    style: 'currency',
                    currency: 'EUR',
                  })}{' '}
                  dépensés
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Toast */}
      {showToast && (
        <Toast
          message="Configuration enregistrée avec succès"
          onDone={() => setShowToast(false)}
        />
      )}
    </div>
  );
}
