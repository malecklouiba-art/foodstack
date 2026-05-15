'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, X, Store, Mail, Calendar, Euro, ExternalLink, Ban,
  Phone, User, FileText, Settings, ChevronRight, Clock,
  PhoneCall, AtSign, MapPin, RefreshCw,
} from 'lucide-react';
import { clsx } from 'clsx';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

// ── Types ─────────────────────────────────────────────────────────────────────

type Plan   = 'Starter' | 'Pro' | 'Enterprise';
type Status = 'Actif' | 'Suspendu' | 'Trial';
type PanelTab = 'informations' | 'contact' | 'historique' | 'acces';
type ActionType = 'appel' | 'email' | 'visite' | 'relance' | 'autre';

interface Restaurant {
  id:      string;
  name:    string;
  owner:   string;
  email:   string;
  plan:    Plan;
  status:  Status;
  mrr:     number;
  joined:  string;
  orders:  number;
  city:    string;
}

interface ContactInfo {
  dirigeantName:  string;
  dirigeantEmail: string;
  dirigeantTel:   string;
  comptableName:  string;
  comptableEmail: string;
  comptableTel:   string;
}

interface HistoriqueNote {
  id:        string;
  action:    ActionType;
  text:      string;
  timestamp: string;
}

// ── Demo data ─────────────────────────────────────────────────────────────────

const RESTAURANTS: Restaurant[] = [
  { id: 'r1', name: 'Le Petit Bistro',     owner: 'Julien Martin',    email: 'j.martin@bistro.fr',       plan: 'Pro',        status: 'Actif',    mrr: 79,  joined: '15 jan. 2026', orders: 1240, city: 'Paris'      },
  { id: 'r2', name: 'Sushi Yama',           owner: 'Aiko Tanaka',      email: 'a.tanaka@sushiyama.fr',    plan: 'Enterprise', status: 'Actif',    mrr: 199, joined: '22 jan. 2026', orders: 3820, city: 'Lyon'       },
  { id: 'r3', name: 'Pizza Palace',         owner: 'Marco Rossi',      email: 'm.rossi@pizza-palace.fr',  plan: 'Starter',    status: 'Trial',    mrr: 0,   joined: '7 mai 2026',   orders: 18,   city: 'Marseille'  },
  { id: 'r4', name: 'Burger Factory',       owner: 'Sophie Dupont',    email: 's.dupont@burgerfact.fr',   plan: 'Pro',        status: 'Actif',    mrr: 79,  joined: '5 mar. 2026',  orders: 960,  city: 'Bordeaux'   },
  { id: 'r5', name: 'La Crêperie Dorée',    owner: 'Pierre Leblanc',   email: 'p.leblanc@creperie.fr',    plan: 'Starter',    status: 'Actif',    mrr: 29,  joined: '2 fév. 2026',  orders: 430,  city: 'Nantes'     },
  { id: 'r6', name: 'Tacos Azteca',         owner: 'Carlos Mendez',    email: 'c.mendez@tacos.fr',        plan: 'Pro',        status: 'Suspendu', mrr: 0,   joined: '10 déc. 2025', orders: 750,  city: 'Toulouse'   },
  { id: 'r7', name: 'Le Ramen House',       owner: 'Hana Kimura',      email: 'h.kimura@ramen.fr',        plan: 'Starter',    status: 'Suspendu', mrr: 0,   joined: '18 nov. 2025', orders: 200,  city: 'Strasbourg' },
  { id: 'r8', name: 'Cloud Kitchen Alpha',  owner: 'Thomas Bernard',   email: 't.bernard@cloudkitchen.fr', plan: 'Enterprise', status: 'Actif',    mrr: 199, joined: '3 avr. 2026',  orders: 2100, city: 'Paris'      },
];

const INIT_CONTACTS: Record<string, ContactInfo> = {
  r1: { dirigeantName: 'Julien Martin',   dirigeantEmail: 'j.martin@bistro.fr',       dirigeantTel: '+33 6 11 22 33 44', comptableName: 'Isabelle Morin',   comptableEmail: 'i.morin@cabinet.fr',   comptableTel: '+33 1 40 10 20 30' },
  r2: { dirigeantName: 'Aiko Tanaka',     dirigeantEmail: 'a.tanaka@sushiyama.fr',    dirigeantTel: '+33 6 55 66 77 88', comptableName: 'Rémi Fontaine',    comptableEmail: 'r.fontaine@fisc.fr',   comptableTel: '+33 4 72 01 02 03' },
  r3: { dirigeantName: 'Marco Rossi',     dirigeantEmail: 'm.rossi@pizza-palace.fr',  dirigeantTel: '+33 6 99 88 77 66', comptableName: '',                 comptableEmail: '',                     comptableTel: '' },
  r4: { dirigeantName: 'Sophie Dupont',   dirigeantEmail: 's.dupont@burgerfact.fr',   dirigeantTel: '+33 6 31 41 51 61', comptableName: 'Arnaud Chevallier',comptableEmail: 'a.chevallier@bx.fr',   comptableTel: '+33 5 56 01 02 03' },
  r5: { dirigeantName: 'Pierre Leblanc',  dirigeantEmail: 'p.leblanc@creperie.fr',    dirigeantTel: '+33 6 21 31 41 51', comptableName: 'Nathalie Perrin',  comptableEmail: 'n.perrin@nantes.fr',   comptableTel: '+33 2 40 01 02 03' },
  r6: { dirigeantName: 'Carlos Mendez',   dirigeantEmail: 'c.mendez@tacos.fr',        dirigeantTel: '+33 6 61 71 81 91', comptableName: '',                 comptableEmail: '',                     comptableTel: '' },
  r7: { dirigeantName: 'Hana Kimura',     dirigeantEmail: 'h.kimura@ramen.fr',        dirigeantTel: '+33 6 07 08 09 10', comptableName: '',                 comptableEmail: '',                     comptableTel: '' },
  r8: { dirigeantName: 'Thomas Bernard',  dirigeantEmail: 't.bernard@cloudkitchen.fr',dirigeantTel: '+33 6 40 50 60 70', comptableName: 'Laura Vidal',      comptableEmail: 'l.vidal@compta.fr',    comptableTel: '+33 1 47 03 04 05' },
};

const INIT_HISTORIQUE: Record<string, HistoriqueNote[]> = {
  r1: [
    { id: 'h1', action: 'appel',   text: 'Appel de bienvenue — client satisfait, souhaite explorer fonctions avancées.', timestamp: '14 mai 2026, 10:32' },
    { id: 'h2', action: 'email',   text: 'Envoi guide démarrage rapide + lien vers documentation Pro.', timestamp: '13 mai 2026, 15:00' },
  ],
  r2: [
    { id: 'h3', action: 'visite',  text: 'Visite on-site pour audit technique. Intégration caisse OK.', timestamp: '10 mai 2026, 09:00' },
  ],
  r6: [
    { id: 'h4', action: 'relance', text: 'Relance paiement — 2e tentative. Laisser un message vocal.', timestamp: '12 mai 2026, 14:15' },
    { id: 'h5', action: 'appel',   text: 'Pas de réponse. Envoi SMS.', timestamp: '9 mai 2026, 11:00' },
  ],
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function statusBadge(status: Status) {
  if (status === 'Actif') return <Badge variant="success" dot>{status}</Badge>;
  if (status === 'Trial') return <Badge variant="warning" dot>{status}</Badge>;
  return <Badge variant="danger" dot>{status}</Badge>;
}

function planBadge(plan: Plan) {
  if (plan === 'Enterprise') return <Badge variant="info">{plan}</Badge>;
  if (plan === 'Pro')        return <Badge variant="brand">{plan}</Badge>;
  return <Badge variant="default">{plan}</Badge>;
}

const ACTION_LABELS: Record<ActionType, string> = {
  appel: 'Appel', email: 'Email', visite: 'Visite', relance: 'Relance', autre: 'Autre',
};

const ACTION_COLORS: Record<ActionType, string> = {
  appel:   'bg-blue-100 text-blue-700',
  email:   'bg-purple-100 text-purple-700',
  visite:  'bg-green-100 text-green-700',
  relance: 'bg-orange-100 text-orange-700',
  autre:   'bg-surface-100 text-surface-600',
};

type FilterStatus = 'tous' | 'actif' | 'suspendu' | 'trial';

// ── Slide Panel ───────────────────────────────────────────────────────────────

interface PanelProps {
  restaurant: Restaurant;
  contacts:   Record<string, ContactInfo>;
  historique: Record<string, HistoriqueNote[]>;
  statuses:   Record<string, Status>;
  onClose:    () => void;
  onToggleStatus: (id: string) => void;
  onSaveContact:  (id: string, c: ContactInfo) => void;
  onAddNote:      (id: string, note: HistoriqueNote) => void;
}

function RestaurantPanel({
  restaurant, contacts, historique, statuses,
  onClose, onToggleStatus, onSaveContact, onAddNote,
}: PanelProps) {
  const [activeTab, setActiveTab] = useState<PanelTab>('informations');
  const [contactForm, setContactForm] = useState<ContactInfo>(
    contacts[restaurant.id] ?? {
      dirigeantName: '', dirigeantEmail: '', dirigeantTel: '',
      comptableName: '', comptableEmail: '', comptableTel: '',
    }
  );
  const [noteText,   setNoteText]   = useState('');
  const [noteAction, setNoteAction] = useState<ActionType>('appel');
  const currentStatus = statuses[restaurant.id] ?? restaurant.status;
  const notes = historique[restaurant.id] ?? [];

  const tabs: { id: PanelTab; label: string }[] = [
    { id: 'informations', label: 'Informations' },
    { id: 'contact',      label: 'Contact'      },
    { id: 'historique',   label: 'Historique'   },
    { id: 'acces',        label: 'Accès'        },
  ];

  function handleAddNote() {
    if (!noteText.trim()) return;
    const now = new Date();
    const ts  = now.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
      + ', ' + now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    onAddNote(restaurant.id, {
      id: `n-${Date.now()}`, action: noteAction, text: noteText.trim(), timestamp: ts,
    });
    setNoteText('');
  }

  return (
    <div className="flex flex-col h-full">
      {/* Panel header */}
      <div className="flex items-center justify-between border-b border-surface-100 dark:border-surface-700 px-5 py-4 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-500/10">
            <Store className="h-4.5 w-4.5 text-brand-500" />
          </div>
          <div>
            <p className="font-semibold text-surface-900 text-sm leading-tight">{restaurant.name}</p>
            <p className="text-xs text-surface-500">{restaurant.city}</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="rounded-lg p-1.5 text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-surface-100 dark:border-surface-700 flex-shrink-0 overflow-x-auto">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={clsx(
              'px-3 py-2.5 text-xs font-medium whitespace-nowrap border-b-2 transition-colors',
              activeTab === t.id
                ? 'border-brand-500 text-brand-600 dark:text-brand-400'
                : 'border-transparent text-surface-500 hover:text-surface-700 dark:hover:text-surface-300'
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4">

        {/* ── Informations ── */}
        {activeTab === 'informations' && (
          <>
            <div className="flex flex-wrap gap-2">
              {planBadge(restaurant.plan)}
              {statusBadge(currentStatus)}
            </div>
            <div className="space-y-3">
              {[
                { icon: User,     label: 'Propriétaire', value: restaurant.owner },
                { icon: Mail,     label: 'Email',        value: restaurant.email },
                { icon: MapPin,   label: 'Ville',        value: restaurant.city },
                { icon: Calendar, label: 'Inscrit le',   value: restaurant.joined },
                { icon: Euro,     label: 'MRR',          value: restaurant.mrr > 0 ? `${restaurant.mrr} €/mois` : 'Trial gratuit' },
                { icon: Store,    label: 'Plan',         value: restaurant.plan },
                { icon: ChevronRight, label: 'Statut',   value: currentStatus },
                { icon: FileText, label: 'Commandes',    value: `${restaurant.orders.toLocaleString('fr-FR')} total` },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex items-start gap-3">
                  <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-surface-100 dark:bg-surface-800">
                    <Icon className="h-3.5 w-3.5 text-surface-500" />
                  </div>
                  <div>
                    <p className="text-xs text-surface-400">{label}</p>
                    <p className="text-sm font-medium text-surface-900">{value}</p>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* ── Contact ── */}
        {activeTab === 'contact' && (
          <div className="space-y-5">
            {/* Dirigeant */}
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-surface-500">Dirigeant</p>
              <div className="space-y-2">
                <LabeledInput
                  icon={<User className="h-3.5 w-3.5" />}
                  placeholder="Nom complet"
                  value={contactForm.dirigeantName}
                  onChange={(v) => setContactForm((c) => ({ ...c, dirigeantName: v }))}
                />
                <LabeledInput
                  icon={<AtSign className="h-3.5 w-3.5" />}
                  placeholder="Email"
                  value={contactForm.dirigeantEmail}
                  onChange={(v) => setContactForm((c) => ({ ...c, dirigeantEmail: v }))}
                />
                <LabeledInput
                  icon={<Phone className="h-3.5 w-3.5" />}
                  placeholder="Téléphone"
                  value={contactForm.dirigeantTel}
                  onChange={(v) => setContactForm((c) => ({ ...c, dirigeantTel: v }))}
                />
              </div>
            </div>
            {/* Comptable */}
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-surface-500">Comptable</p>
              <div className="space-y-2">
                <LabeledInput
                  icon={<User className="h-3.5 w-3.5" />}
                  placeholder="Nom complet"
                  value={contactForm.comptableName}
                  onChange={(v) => setContactForm((c) => ({ ...c, comptableName: v }))}
                />
                <LabeledInput
                  icon={<AtSign className="h-3.5 w-3.5" />}
                  placeholder="Email"
                  value={contactForm.comptableEmail}
                  onChange={(v) => setContactForm((c) => ({ ...c, comptableEmail: v }))}
                />
                <LabeledInput
                  icon={<Phone className="h-3.5 w-3.5" />}
                  placeholder="Téléphone"
                  value={contactForm.comptableTel}
                  onChange={(v) => setContactForm((c) => ({ ...c, comptableTel: v }))}
                />
              </div>
            </div>
            <button
              onClick={() => onSaveContact(restaurant.id, contactForm)}
              className="w-full rounded-xl bg-brand-500 py-2 text-sm font-semibold text-black hover:bg-brand-400 transition-colors"
            >
              Enregistrer les contacts
            </button>
          </div>
        )}

        {/* ── Historique ── */}
        {activeTab === 'historique' && (
          <div className="space-y-4">
            {/* Add note */}
            <div className="space-y-2">
              <div className="flex gap-1.5 flex-wrap">
                {(Object.keys(ACTION_LABELS) as ActionType[]).map((a) => (
                  <button
                    key={a}
                    onClick={() => setNoteAction(a)}
                    className={clsx(
                      'rounded-lg px-2.5 py-1 text-xs font-medium transition-colors',
                      noteAction === a
                        ? ACTION_COLORS[a]
                        : 'bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-400 hover:bg-surface-200 dark:hover:bg-surface-700'
                    )}
                  >
                    {ACTION_LABELS[a]}
                  </button>
                ))}
              </div>
              <textarea
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="Ajouter une note…"
                rows={3}
                className="w-full resize-none rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 px-3 py-2 text-sm text-surface-900 placeholder-surface-400 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
              />
              <button
                onClick={handleAddNote}
                disabled={!noteText.trim()}
                className="w-full rounded-xl bg-brand-500 py-2 text-sm font-semibold text-black hover:bg-brand-400 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Ajouter note
              </button>
            </div>

            {/* Notes list */}
            {notes.length === 0 ? (
              <p className="text-center text-xs text-surface-400 py-4">Aucune note pour le moment.</p>
            ) : (
              <div className="space-y-3">
                {[...notes].reverse().map((note) => (
                  <div key={note.id} className="rounded-xl border border-surface-100 dark:border-surface-700 p-3 space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className={clsx('rounded-md px-2 py-0.5 text-xs font-medium', ACTION_COLORS[note.action])}>
                        {ACTION_LABELS[note.action]}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-surface-400">
                        <Clock className="h-3 w-3" />
                        {note.timestamp}
                      </span>
                    </div>
                    <p className="text-sm text-surface-800 dark:text-surface-200 leading-snug">{note.text}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Accès ── */}
        {activeTab === 'acces' && (
          <div className="space-y-3">
            <a
              href={`/dashboard?restaurant=${restaurant.id}`}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-semibold text-black hover:bg-brand-400 transition-colors"
            >
              <ExternalLink className="h-4 w-4" />
              Accéder au tableau de bord
            </a>
            <a
              href={`mailto:${restaurant.email}`}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 px-4 py-2.5 text-sm font-semibold text-surface-700 dark:text-surface-300 hover:bg-surface-50 dark:hover:bg-surface-700 transition-colors"
            >
              <Mail className="h-4 w-4" />
              Envoyer un email
            </a>
            {currentStatus !== 'Suspendu' ? (
              <button
                onClick={() => onToggleStatus(restaurant.id)}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-900/20 px-4 py-2.5 text-sm font-semibold text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
              >
                <Ban className="h-4 w-4" />
                Suspendre le compte
              </button>
            ) : (
              <button
                onClick={() => onToggleStatus(restaurant.id)}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-green-200 dark:border-green-900 bg-green-50 dark:bg-green-900/20 px-4 py-2.5 text-sm font-semibold text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/40 transition-colors"
              >
                <RefreshCw className="h-4 w-4" />
                Réactiver le compte
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Tiny helper: labeled input ────────────────────────────────────────────────

function LabeledInput({
  icon, placeholder, value, onChange,
}: {
  icon: React.ReactNode;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="relative flex items-center">
      <span className="absolute left-3 text-surface-400">{icon}</span>
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 pl-9 pr-3 py-2 text-sm text-surface-900 placeholder-surface-400 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
      />
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function RestaurantsPage() {
  const [search,    setSearch]    = useState('');
  const [filter,    setFilter]    = useState<FilterStatus>('tous');
  const [selected,  setSelected]  = useState<Restaurant | null>(null);
  const [statuses,  setStatuses]  = useState<Record<string, Status>>({});
  const [contacts,  setContacts]  = useState<Record<string, ContactInfo>>(INIT_CONTACTS);
  const [historique, setHistorique] = useState<Record<string, HistoriqueNote[]>>(INIT_HISTORIQUE);

  // Derive effective status
  const effectiveStatus = (r: Restaurant): Status => statuses[r.id] ?? r.status;

  const filtered = RESTAURANTS.filter((r) => {
    const matchSearch =
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.owner.toLowerCase().includes(search.toLowerCase()) ||
      r.city.toLowerCase().includes(search.toLowerCase());
    const es = effectiveStatus(r);
    const matchFilter =
      filter === 'tous'     ? true :
      filter === 'actif'    ? es === 'Actif' :
      filter === 'suspendu' ? es === 'Suspendu' :
      es === 'Trial';
    return matchSearch && matchFilter;
  });

  // Live stats derived from state
  const stats = {
    total:  RESTAURANTS.length,
    actifs: RESTAURANTS.filter((r) => effectiveStatus(r) === 'Actif').length,
    trial:  RESTAURANTS.filter((r) => effectiveStatus(r) === 'Trial').length,
    mrr:    RESTAURANTS.filter((r) => effectiveStatus(r) === 'Actif')
              .reduce((acc, r) => acc + r.mrr, 0),
  };

  function handleToggleStatus(id: string) {
    setStatuses((s) => {
      const current = s[id] ?? RESTAURANTS.find((r) => r.id === id)!.status;
      const next: Status = current === 'Suspendu' ? 'Actif' : 'Suspendu';
      return { ...s, [id]: next };
    });
  }

  function handleSaveContact(id: string, c: ContactInfo) {
    setContacts((cs) => ({ ...cs, [id]: c }));
  }

  function handleAddNote(id: string, note: HistoriqueNote) {
    setHistorique((h) => ({ ...h, [id]: [...(h[id] ?? []), note] }));
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-surface-900">Restaurants</h1>
        <p className="mt-1 text-sm text-surface-500">Gestion de tous les restaurants sur la plateforme</p>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: 'Total',         value: stats.total,           color: 'text-surface-900'                       },
          { label: 'Actifs',        value: stats.actifs,          color: 'text-green-600 dark:text-green-400'     },
          { label: 'MRR total',     value: `${stats.mrr} €`,      color: 'text-brand-600 dark:text-brand-400'     },
          { label: 'En trial',      value: stats.trial,           color: 'text-yellow-600 dark:text-yellow-400'   },
        ].map((s) => (
          <Card key={s.label} padding="md">
            <p className="text-xs font-medium text-surface-500 uppercase tracking-wide">{s.label}</p>
            <p className={`mt-1 text-3xl font-bold ${s.color}`}>{s.value}</p>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card padding="md">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-surface-400" />
            <input
              type="text"
              placeholder="Rechercher un restaurant, propriétaire, ville…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 pl-9 pr-4 py-2 text-sm text-surface-900 placeholder-surface-400 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
            />
          </div>
          <div className="flex gap-1.5">
            {(['tous', 'actif', 'suspendu', 'trial'] as FilterStatus[]).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={clsx(
                  'rounded-lg px-3 py-1.5 text-xs font-medium capitalize transition-colors',
                  filter === f
                    ? 'bg-brand-500 text-black'
                    : 'bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-400 hover:bg-surface-200 dark:hover:bg-surface-700'
                )}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Table + Slide panel */}
      <div className="flex gap-6">
        <Card padding="none" className="flex-1 min-w-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-surface-100 dark:border-surface-700">
                  {['Restaurant', 'Plan', 'Statut', 'MRR', 'Inscrit le', 'Actions'].map((h) => (
                    <th key={h} className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-surface-500">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-100 dark:divide-surface-700">
                {filtered.map((r) => {
                  const es = effectiveStatus(r);
                  return (
                    <motion.tr
                      key={r.id}
                      layout
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      onClick={() => setSelected(r)}
                      className={clsx(
                        'cursor-pointer transition-colors',
                        selected?.id === r.id
                          ? 'bg-brand-500/10'
                          : 'hover:bg-surface-50 dark:hover:bg-surface-800/40'
                      )}
                    >
                      <td className="px-5 py-4">
                        <div>
                          <p className="font-medium text-surface-900">{r.name}</p>
                          <p className="text-xs text-surface-500">{r.owner} · {r.city}</p>
                        </div>
                      </td>
                      <td className="px-5 py-4">{planBadge(r.plan)}</td>
                      <td className="px-5 py-4">{statusBadge(es)}</td>
                      <td className="px-5 py-4 font-semibold text-surface-900">
                        {r.mrr > 0 ? `${r.mrr}€` : <span className="text-surface-400">—</span>}
                      </td>
                      <td className="px-5 py-4 text-surface-500">{r.joined}</td>
                      <td className="px-5 py-4">
                        <div className="flex gap-1.5" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => setSelected(r)}
                            className="flex items-center gap-1 rounded-lg bg-surface-100 dark:bg-surface-800 px-2.5 py-1.5 text-xs font-medium text-surface-700 dark:text-surface-300 hover:bg-surface-200 dark:hover:bg-surface-700 transition-colors"
                          >
                            <Settings className="h-3 w-3" />
                            Gérer
                          </button>
                          <button
                            onClick={() => { setSelected(r); }}
                            className="flex items-center gap-1 rounded-lg bg-brand-500/10 px-2.5 py-1.5 text-xs font-medium text-brand-600 dark:text-brand-400 hover:bg-brand-500/20 transition-colors"
                          >
                            <ExternalLink className="h-3 w-3" />
                            Accéder
                          </button>
                          <button
                            onClick={() => handleToggleStatus(r.id)}
                            className={clsx(
                              'flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors',
                              es === 'Suspendu'
                                ? 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 hover:bg-green-100'
                                : 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100'
                            )}
                          >
                            {es === 'Suspendu'
                              ? <><RefreshCw className="h-3 w-3" />Réactiver</>
                              : <><Ban className="h-3 w-3" />Suspendre</>
                            }
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-5 py-12 text-center text-sm text-surface-400">
                      Aucun restaurant trouvé.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Slide-in panel */}
        <AnimatePresence>
          {selected && (
            <motion.div
              key="panel"
              initial={{ opacity: 0, x: 24, width: 0 }}
              animate={{ opacity: 1, x: 0, width: 360 }}
              exit={{ opacity: 0, x: 24, width: 0 }}
              transition={{ type: 'spring', damping: 22, stiffness: 260 }}
              className="flex-shrink-0 overflow-hidden"
            >
              <Card padding="none" className="w-[360px] h-full flex flex-col overflow-hidden">
                <RestaurantPanel
                  restaurant={selected}
                  contacts={contacts}
                  historique={historique}
                  statuses={statuses}
                  onClose={() => setSelected(null)}
                  onToggleStatus={handleToggleStatus}
                  onSaveContact={handleSaveContact}
                  onAddNote={handleAddNote}
                />
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
