'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Gift, Star, Users, Award, CheckCircle, Edit2, Save, X,
  ShoppingCart, Zap, UserPlus, MessageSquare, Cake,
  TrendingUp, ToggleLeft, ToggleRight, Mail, MessageCircle,
  ExternalLink, Trophy,
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

interface TopClient {
  id: string;
  name: string;
  email: string;
  phone: string;
  points: number;
  tier: Tier;
}

// ── Static data ───────────────────────────────────────────────────────────────

const INITIAL_TIERS: TierConfig[] = [
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

const TOP_CLIENTS: TopClient[] = [
  { id: 'c3', name: 'Sophie Martin',     email: 'sophie.m@email.com',   phone: '+33 6 77 88 99 11', points: 3200, tier: 'Platinum' },
  { id: 'c1', name: 'Marie Leclerc',     email: 'marie.l@email.com',    phone: '+33 6 11 22 33 44', points: 2450, tier: 'Gold' },
  { id: 'c6', name: 'Antoine Bernard',   email: 'antoine.b@email.com',  phone: '+33 6 99 88 77 66', points: 1840, tier: 'Gold' },
  { id: 'c7', name: 'Camille Petit',     email: 'camille.p@email.com',  phone: '+33 6 23 45 67 89', points: 1520, tier: 'Gold' },
  { id: 'c8', name: 'Lucas Moreau',      email: 'lucas.m@email.com',    phone: '+33 6 34 56 78 90', points: 980,  tier: 'Silver' },
  { id: 'c2', name: 'Pierre Dubois',     email: 'pierre.d@email.com',   phone: '+33 6 55 44 33 22', points: 760,  tier: 'Silver' },
  { id: 'c9', name: 'Léa Garnier',       email: 'lea.g@email.com',      phone: '+33 6 45 67 89 01', points: 640,  tier: 'Silver' },
  { id: 'c10', name: 'Maxime Roux',      email: 'maxime.r@email.com',   phone: '+33 6 56 78 90 12', points: 510,  tier: 'Silver' },
  { id: 'c4', name: 'Julien Kowalski',   email: 'julien.k@email.com',   phone: '+33 6 22 33 44 55', points: 320,  tier: 'Bronze' },
  { id: 'c11', name: 'Inès Lambert',     email: 'ines.l@email.com',     phone: '+33 6 67 89 01 23', points: 210,  tier: 'Bronze' },
];

const TIER_PILL: Record<Tier, { bg: string; text: string; dot: string }> = {
  Bronze:   { bg: 'bg-amber-50',  text: 'text-amber-700',  dot: 'bg-amber-500' },
  Silver:   { bg: 'bg-slate-100', text: 'text-slate-600',  dot: 'bg-slate-400' },
  Gold:     { bg: 'bg-yellow-50', text: 'text-yellow-700', dot: 'bg-yellow-500' },
  Platinum: { bg: 'bg-purple-50', text: 'text-purple-700', dot: 'bg-purple-500' },
};

// ── Tier card (editable) ──────────────────────────────────────────────────────

function TierCard({
  tier,
  onSave,
}: {
  tier: TierConfig;
  onSave: (name: Tier, patch: Partial<TierConfig>) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draftRange, setDraftRange] = useState(tier.range);
  const [draftBenefits, setDraftBenefits] = useState(tier.benefits.join('\n'));

  function save() {
    onSave(tier.name, {
      range: draftRange,
      benefits: draftBenefits.split('\n').map((s) => s.trim()).filter(Boolean),
    });
    setEditing(false);
  }

  function cancel() {
    setDraftRange(tier.range);
    setDraftBenefits(tier.benefits.join('\n'));
    setEditing(false);
  }

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
            {editing ? (
              <input
                value={draftRange}
                onChange={(e) => setDraftRange(e.target.value)}
                className="mt-0.5 w-32 rounded-md border border-surface-200 px-2 py-0.5 text-xs text-surface-700 focus:border-brand-400 focus:outline-none"
              />
            ) : (
              <p className="text-xs text-surface-400">{tier.range}</p>
            )}
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
        {editing ? (
          <textarea
            value={draftBenefits}
            onChange={(e) => setDraftBenefits(e.target.value)}
            rows={4}
            className="w-full rounded-md border border-surface-200 px-2 py-1.5 text-xs text-surface-700 focus:border-brand-400 focus:outline-none"
          />
        ) : (
          <ul className="space-y-1.5">
            {tier.benefits.map((benefit) => (
              <li key={benefit} className="flex items-start gap-2">
                <CheckCircle className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${tier.textColor}`} />
                <span className="text-xs text-surface-700">{benefit}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Actions */}
      {editing ? (
        <div className="flex gap-2">
          <button
            onClick={save}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-brand-500 py-2 text-xs font-semibold text-white hover:bg-brand-600 transition-colors"
          >
            <Save className="h-3.5 w-3.5" />
            Enregistrer
          </button>
          <button
            onClick={cancel}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-surface-200 py-2 text-xs font-semibold text-surface-600 hover:bg-surface-50 transition-colors"
          >
            <X className="h-3.5 w-3.5" />
            Annuler
          </button>
        </div>
      ) : (
        <button
          onClick={() => setEditing(true)}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-surface-200 py-2 text-xs font-semibold text-surface-600 hover:bg-surface-50 transition-colors"
        >
          <Edit2 className="h-3.5 w-3.5" />
          Modifier
        </button>
      )}
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

// ── Message modal ─────────────────────────────────────────────────────────────

interface MessageDraft {
  client: TopClient;
  channel: 'email' | 'sms';
  subject: string;
  body: string;
}

function MessageModal({
  draft,
  onClose,
  onSend,
}: {
  draft: MessageDraft;
  onClose: () => void;
  onSend: (next: MessageDraft) => void;
}) {
  const [subject, setSubject] = useState(draft.subject);
  const [body, setBody] = useState(draft.body);
  const isEmail = draft.channel === 'email';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg rounded-2xl bg-white shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-surface-100 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${isEmail ? 'bg-brand-50' : 'bg-blue-50'}`}>
              {isEmail ? <Mail className="h-4 w-4 text-brand-600" /> : <MessageCircle className="h-4 w-4 text-blue-600" />}
            </div>
            <div>
              <p className="font-semibold text-surface-900">
                {isEmail ? 'Envoyer un email' : 'Envoyer un SMS'}
              </p>
              <p className="text-xs text-surface-500">À : {draft.client.name} · {isEmail ? draft.client.email : draft.client.phone}</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-surface-100 transition-colors" aria-label="Fermer">
            <X className="h-4 w-4 text-surface-400" />
          </button>
        </div>

        {/* Body */}
        <div className="space-y-4 px-6 py-5">
          {isEmail && (
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-surface-500">
                Sujet
              </label>
              <input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full rounded-xl border border-surface-200 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
                placeholder="Sujet de l'email"
              />
            </div>
          )}
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-surface-500">
              Message
            </label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={6}
              className="w-full rounded-xl border border-surface-200 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
              placeholder="Écrivez votre message ici…"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 border-t border-surface-100 px-6 py-4">
          <button
            onClick={onClose}
            className="rounded-xl border border-surface-200 px-4 py-2 text-sm font-medium text-surface-600 hover:bg-surface-50 transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={() => onSend({ ...draft, subject, body })}
            className="flex items-center gap-2 rounded-xl bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600 transition-colors"
          >
            {isEmail ? <Mail className="h-3.5 w-3.5" /> : <MessageCircle className="h-3.5 w-3.5" />}
            Envoyer (démo)
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function LoyaltyPage() {
  const [tiers, setTiers] = useState<TierConfig[]>(INITIAL_TIERS);
  const [rules, setRules] = useState<PointRule[]>(INITIAL_RULES);
  const [redemptions, setRedemptions] = useState<Redemption[]>(REDEMPTIONS);
  const [draft, setDraft] = useState<MessageDraft | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  function toggleRule(id: string) {
    setRules((prev) =>
      prev.map((r) => (r.id === id ? { ...r, active: !r.active, updatedAt: new Date().toLocaleDateString('fr-FR') } : r))
    );
  }

  function saveTier(name: Tier, patch: Partial<TierConfig>) {
    setTiers((prev) => prev.map((t) => (t.name === name ? { ...t, ...patch } : t)));
    showToast(`Palier ${name} mis à jour`);
  }

  function dismissRedemption(id: string) {
    setRedemptions((prev) => prev.filter((r) => r.id !== id));
  }

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 2200);
  }

  function openMessage(client: TopClient, channel: 'email' | 'sms') {
    setDraft({
      client,
      channel,
      subject: channel === 'email' ? `Vos points de fidélité chez FoodStack` : '',
      body:
        channel === 'email'
          ? `Bonjour ${client.name.split(' ')[0]},\n\nVous avez actuellement ${client.points} points fidélité. Profitez-en !\n\nL'équipe FoodStack`
          : `Bonjour ${client.name.split(' ')[0]}, vous avez ${client.points} pts FoodStack à utiliser !`,
    });
  }

  function sendMessage(next: MessageDraft) {
    setDraft(null);
    showToast(
      `${next.channel === 'email' ? 'Email' : 'SMS'} envoyé à ${next.client.name} (démo)`
    );
  }

  const STATS = [
    { label: 'Membres actifs', value: '369', icon: Users, color: 'text-brand-600', bg: 'bg-brand-50' },
    { label: 'Points distribués', value: '184 230', icon: Star, color: 'text-yellow-600', bg: 'bg-yellow-50' },
    { label: 'Récompenses échangées', value: String(redemptions.length + 42), icon: Gift, color: 'text-purple-600', bg: 'bg-purple-50' },
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
          {tiers.map((tier) => (
            <TierCard key={tier.name} tier={tier} onSave={saveTier} />
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
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50 shrink-0">
                            <RuleIcon className="h-4 w-4 text-brand-500" />
                          </div>
                          <span className="font-medium text-surface-900">{rule.action}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant="brand">{rule.points}</Badge>
                      </td>
                      <td className="px-6 py-4">
                        <Toggle active={rule.active} onToggle={() => toggleRule(rule.id)} />
                      </td>
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

      {/* Top clients leaderboard */}
      <Card padding="none">
        <CardHeader className="border-b border-surface-100 px-6 py-5">
          <div className="flex items-center gap-2">
            <Trophy className="h-4 w-4 text-brand-500" />
            <CardTitle>Top clients par points</CardTitle>
          </div>
          <Link
            href="/dashboard/customers"
            className="flex items-center gap-1 text-sm font-medium text-brand-600 hover:text-brand-700"
          >
            Voir tous les clients
            <ExternalLink className="h-3 w-3" />
          </Link>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-surface-100 text-left">
                {['#', 'Client', 'Palier', 'Points', 'Actions'].map((h) => (
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
              {TOP_CLIENTS.map((c, i) => {
                const pill = TIER_PILL[c.tier];
                return (
                  <tr key={c.id} className="transition-colors hover:bg-surface-50">
                    <td className="px-6 py-4">
                      <span
                        className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                          i === 0
                            ? 'bg-yellow-100 text-yellow-700'
                            : i === 1
                            ? 'bg-slate-200 text-slate-700'
                            : i === 2
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-surface-100 text-surface-500'
                        }`}
                      >
                        {i + 1}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-medium text-surface-900 whitespace-nowrap">{c.name}</p>
                      <p className="text-xs text-surface-400">{c.email}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${pill.bg} ${pill.text}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${pill.dot}`} />
                        {c.tier}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5">
                        <Star className="h-3.5 w-3.5 text-yellow-500" />
                        <span className="font-bold text-surface-900">{c.points.toLocaleString('fr-FR')}</span>
                        <span className="text-xs text-surface-400">pts</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => openMessage(c, 'email')}
                          className="flex items-center gap-1 rounded-lg border border-surface-200 px-2.5 py-1.5 text-xs font-medium text-surface-700 hover:bg-brand-50 hover:text-brand-700 hover:border-brand-200 transition-colors"
                          title="Envoyer un email"
                        >
                          <Mail className="h-3 w-3" />
                          Email
                        </button>
                        <button
                          onClick={() => openMessage(c, 'sms')}
                          className="flex items-center gap-1 rounded-lg border border-surface-200 px-2.5 py-1.5 text-xs font-medium text-surface-700 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 transition-colors"
                          title="Envoyer un SMS"
                        >
                          <MessageCircle className="h-3 w-3" />
                          SMS
                        </button>
                        <Link
                          href={`/dashboard/customers?id=${c.id}`}
                          className="flex items-center gap-1 rounded-lg bg-brand-500 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-brand-600 transition-colors"
                          title="Voir la fiche client"
                        >
                          <ExternalLink className="h-3 w-3" />
                          Fiche
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })}
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
          <span className="text-sm text-surface-400">{redemptions.length} récents</span>
        </CardHeader>
        <ul className="divide-y divide-surface-50">
          <AnimatePresence>
            {redemptions.map((item, i) => (
              <motion.li
                key={item.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 8 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-center justify-between px-6 py-4 hover:bg-surface-50 transition-colors"
              >
                <div className="flex items-center gap-3">
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
                <div className="flex items-center gap-3">
                  <span className="rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-600 whitespace-nowrap">
                    −{item.points} pts
                  </span>
                  <button
                    onClick={() => dismissRedemption(item.id)}
                    className="rounded-lg p-1 text-surface-400 hover:bg-surface-100 hover:text-surface-600 transition-colors"
                    aria-label="Masquer"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              </motion.li>
            ))}
          </AnimatePresence>
          {redemptions.length === 0 && (
            <li className="px-6 py-8 text-center text-sm text-surface-400">Aucun échange récent</li>
          )}
        </ul>
      </Card>

      {/* Message modal */}
      <AnimatePresence>
        {draft && (
          <MessageModal draft={draft} onClose={() => setDraft(null)} onSend={sendMessage} />
        )}
      </AnimatePresence>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            className="fixed bottom-6 right-6 z-50 rounded-xl bg-surface-900 px-4 py-2.5 text-sm font-medium text-white shadow-lg"
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
