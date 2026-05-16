'use client';

import { useState, useEffect, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Store, Star, TrendingUp, Clock, MapPin, Settings,
  Plus, X, Pause, ChevronRight, Edit2, Search,
  Building2, FileText, History, FolderOpen,
  Phone, Mail, User, CreditCard, Percent,
  CheckCircle2, AlertCircle, XCircle,
  Euro, Users, TrendingDown, Upload, Trash2, Download, Eye,
} from 'lucide-react';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

// ── Types ────────────────────────────────────────────────────────────────────

type RestaurantStatus = 'open' | 'paused';
type CRMStatus = 'prospect' | 'négociation' | 'actif' | 'pause' | 'churned';
type AbonnementType = 'Starter' | 'Pro' | 'Business' | 'Enterprise';
type DocStatus = 'fourni' | 'manquant';
type DetailTab = 'Informations' | 'Contrat' | 'Historique' | 'Documents';

interface HistoryEntry {
  id: string;
  date: string;
  action: string;
  note: string;
  author: string;
}

interface RestaurantDoc {
  name: string;
  status: DocStatus;
  fileName?: string;
  fileSize?: string;
  uploadedAt?: string;
}

interface Restaurant {
  id: string;
  // Basic
  name: string;
  address: string;
  adresseFacturation: string;
  cuisine: string;
  status: RestaurantStatus;
  crmStatus: CRMStatus;
  rating: number;
  ordersToday: number;
  revenue: number;
  openTime: string;
  closeTime: string;
  image: string;
  color: string;
  // CRM
  raisonSociale: string;
  siret: string;
  dirigeant: { name: string; email: string; tel: string };
  comptable:  { name: string; email: string; tel: string };
  abonnement: AbonnementType;
  abonnementMontant: number;
  commission: number;
  // History & docs
  history: HistoryEntry[];
  documents: RestaurantDoc[];
}

// ── Mock data ────────────────────────────────────────────────────────────────

const RESTAURANTS_SEED: Restaurant[] = [
  {
    id: 'r1',
    name: 'FoodStack Bastille',
    address: '12 place de la Bastille, Paris 75011',
    adresseFacturation: '12 place de la Bastille, Paris 75011',
    cuisine: 'Française · Fusion',
    status: 'open',
    crmStatus: 'actif',
    rating: 4.8,
    ordersToday: 84,
    revenue: 12450,
    openTime: '11:00',
    closeTime: '23:00',
    image: 'FB',
    color: 'from-brand-400 to-brand-600',
    raisonSociale: 'FOODSTACK BASTILLE SAS',
    siret: '82345678900015',
    dirigeant: { name: 'Alexis Martin', email: 'alexis@foodstack-bastille.fr', tel: '+33 6 11 22 33 44' },
    comptable:  { name: 'Cabinet Lefèvre', email: 'contact@lefevre-compta.fr', tel: '+33 1 44 55 66 77' },
    abonnement: 'Pro',
    abonnementMontant: 299,
    commission: 12,
    history: [
      { id: 'h1', date: '2024-01-15', action: 'Onboarding', note: 'Restaurant configuré et activé sur la plateforme.', author: 'Admin' },
      { id: 'h2', date: '2024-03-10', action: 'Upgrade', note: 'Passage du plan Starter au plan Pro.', author: 'Support' },
      { id: 'h3', date: '2025-02-20', action: 'Appel commercial', note: 'Discussion renouvellement annuel. Client satisfait.', author: 'Sales' },
    ],
    documents: [
      { name: 'Kbis', status: 'fourni' },
      { name: 'RIB', status: 'fourni' },
      { name: 'Contrat signé', status: 'fourni' },
    ],
  },
  {
    id: 'r2',
    name: 'FoodStack Marais',
    address: '34 rue des Archives, Paris 75004',
    adresseFacturation: '34 rue des Archives, Paris 75004',
    cuisine: 'Méditerranéenne',
    status: 'open',
    crmStatus: 'actif',
    rating: 4.6,
    ordersToday: 61,
    revenue: 8920,
    openTime: '12:00',
    closeTime: '22:30',
    image: 'FM',
    color: 'from-blue-400 to-purple-500',
    raisonSociale: 'MARAIS RESTAURATION SARL',
    siret: '73456789000123',
    dirigeant: { name: 'Camille Dupont', email: 'camille@marais-food.fr', tel: '+33 6 22 33 44 55' },
    comptable:  { name: 'Expert-Compta Paris', email: 'paris@expert-compta.fr', tel: '+33 1 55 66 77 88' },
    abonnement: 'Business',
    abonnementMontant: 599,
    commission: 10,
    history: [
      { id: 'h1', date: '2024-02-03', action: 'Création compte', note: 'Inscription via formulaire web.', author: 'System' },
      { id: 'h2', date: '2024-04-12', action: 'Relance', note: 'Relance suite inactivité 2 semaines. Client répond positivement.', author: 'Sales' },
    ],
    documents: [
      { name: 'Kbis', status: 'fourni' },
      { name: 'RIB', status: 'fourni' },
      { name: 'Contrat signé', status: 'manquant' },
    ],
  },
  {
    id: 'r3',
    name: 'FoodStack Nation',
    address: '78 av du Trône, Paris 75012',
    adresseFacturation: 'BP 1234, 75012 Paris',
    cuisine: 'Asiatique · Sushi',
    status: 'paused',
    crmStatus: 'pause',
    rating: 4.4,
    ordersToday: 23,
    revenue: 3210,
    openTime: '11:30',
    closeTime: '23:30',
    image: 'FN',
    color: 'from-green-400 to-teal-500',
    raisonSociale: 'NATION SUSHI EURL',
    siret: '64567890000045',
    dirigeant: { name: 'Yuki Tanaka', email: 'yuki@nation-sushi.fr', tel: '+33 6 33 44 55 66' },
    comptable:  { name: 'Fiduciaire Tanaka', email: 'fiduciaire@tanaka.fr', tel: '+33 1 66 77 88 99' },
    abonnement: 'Starter',
    abonnementMontant: 99,
    commission: 15,
    history: [
      { id: 'h1', date: '2024-03-17', action: 'Création compte', note: 'Restaurant inscrit via recommandation.', author: 'System' },
      { id: 'h2', date: '2025-01-05', action: 'Mise en pause', note: 'Demande du client — rénovation du local jusqu\'en mars.', author: 'Support' },
    ],
    documents: [
      { name: 'Kbis', status: 'fourni' },
      { name: 'RIB', status: 'manquant' },
      { name: 'Contrat signé', status: 'fourni' },
    ],
  },
];

const STATUS_CONFIG: Record<RestaurantStatus, { label: string; variant: 'success' | 'warning' }> = {
  open:   { label: 'Ouvert',   variant: 'success' },
  paused: { label: 'En pause', variant: 'warning' },
};

const CRM_STATUS_COLORS: Record<CRMStatus, string> = {
  prospect:    'bg-blue-50 text-blue-700',
  négociation: 'bg-yellow-50 text-yellow-700',
  actif:       'bg-green-50 text-green-700',
  pause:       'bg-amber-50 text-amber-700',
  churned:     'bg-red-50 text-red-700',
};

const ABONNEMENT_OPTIONS: AbonnementType[] = ['Starter', 'Pro', 'Business', 'Enterprise'];
const CRM_STATUS_OPTIONS: CRMStatus[] = ['prospect', 'négociation', 'actif', 'pause', 'churned'];

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatRevenue(n: number): string {
  return n.toLocaleString('fr-FR') + ' €';
}

function RatingStars({ rating }: { rating: number }) {
  const full = Math.floor(rating);
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} className={`h-3.5 w-3.5 ${i < full ? 'fill-yellow-400 text-yellow-400' : 'text-surface-200'}`} />
      ))}
      <span className="ml-1 text-xs font-semibold text-surface-700">{rating}</span>
    </div>
  );
}

function parseCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

// ── Detail Modal ──────────────────────────────────────────────────────────────

function RestaurantDetailModal({
  restaurant,
  onClose,
  onUpdate,
}: {
  restaurant: Restaurant;
  onClose: () => void;
  onUpdate: (updated: Restaurant) => void;
}) {
  const [tab, setTab] = useState<DetailTab>('Informations');
  const [r, setR] = useState<Restaurant>(restaurant);
  const [noteText, setNoteText] = useState('');
  const [noteAction, setNoteAction] = useState('Note');

  const TABS: DetailTab[] = ['Informations', 'Contrat', 'Historique', 'Documents'];

  function addNote() {
    if (!noteText.trim()) return;
    const entry: HistoryEntry = {
      id: `h${Date.now()}`,
      date: new Date().toISOString().slice(0, 10),
      action: noteAction,
      note: noteText.trim(),
      author: 'Vous',
    };
    const updated = { ...r, history: [entry, ...r.history] };
    setR(updated);
    onUpdate(updated);
    setNoteText('');
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4">
      <motion.div
        initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 40 }}
        className="w-full sm:max-w-2xl rounded-t-2xl sm:rounded-2xl bg-white shadow-2xl overflow-hidden max-h-[92vh] flex flex-col"
      >
        {/* Header */}
        <div className={`flex items-center gap-4 bg-gradient-to-r ${r.color} px-6 py-5`}>
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/20 text-xl font-black text-white backdrop-blur-sm">
            {r.image}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold text-white truncate">{r.name}</h2>
            <p className="text-sm text-white/80">{r.raisonSociale}</p>
            <div className="mt-1 flex gap-2">
              <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${CRM_STATUS_COLORS[r.crmStatus]} bg-white/80`}>
                {r.crmStatus.charAt(0).toUpperCase() + r.crmStatus.slice(1)}
              </span>
              <span className="rounded-full bg-white/20 px-2 py-0.5 text-xs font-semibold text-white">{r.abonnement}</span>
            </div>
          </div>
          <button onClick={onClose} className="rounded-xl p-2 text-white/70 hover:bg-white/20"><X className="h-5 w-5" /></button>
        </div>

        {/* Tabs */}
        <div className="flex gap-0 border-b border-gray-100 px-6 pt-1 overflow-x-auto">
          {TABS.map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`mr-4 py-3 text-sm font-semibold whitespace-nowrap border-b-2 transition-colors ${
                tab === t ? 'border-brand-500 text-brand-600' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {/* ── Informations ── */}
          {tab === 'Informations' && (
            <div className="space-y-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Raison sociale" value={r.raisonSociale} />
                <Field label="SIRET" value={r.siret} />
                <Field label="Adresse" value={r.address} icon={<MapPin className="h-3.5 w-3.5 text-gray-400" />} />
                <Field label="Adresse facturation" value={r.adresseFacturation} icon={<MapPin className="h-3.5 w-3.5 text-gray-400" />} />
                <Field label="Type cuisine" value={r.cuisine} />
                <Field label="Horaires" value={`${r.openTime} – ${r.closeTime}`} icon={<Clock className="h-3.5 w-3.5 text-gray-400" />} />
              </div>

              <div>
                <p className="mb-2 text-xs font-bold text-gray-500 uppercase tracking-wide">Dirigeant</p>
                <div className="grid gap-2 sm:grid-cols-3">
                  <Field label="Nom" value={r.dirigeant.name} icon={<User className="h-3.5 w-3.5 text-gray-400" />} />
                  <Field label="Email" value={r.dirigeant.email} icon={<Mail className="h-3.5 w-3.5 text-gray-400" />} />
                  <Field label="Tél." value={r.dirigeant.tel} icon={<Phone className="h-3.5 w-3.5 text-gray-400" />} />
                </div>
              </div>

              <div>
                <p className="mb-2 text-xs font-bold text-gray-500 uppercase tracking-wide">Comptable</p>
                <div className="grid gap-2 sm:grid-cols-3">
                  <Field label="Nom" value={r.comptable.name} icon={<User className="h-3.5 w-3.5 text-gray-400" />} />
                  <Field label="Email" value={r.comptable.email} icon={<Mail className="h-3.5 w-3.5 text-gray-400" />} />
                  <Field label="Tél." value={r.comptable.tel} icon={<Phone className="h-3.5 w-3.5 text-gray-400" />} />
                </div>
              </div>
            </div>
          )}

          {/* ── Contrat ── */}
          {tab === 'Contrat' && (
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-xl bg-brand-50 p-4 text-center">
                  <CreditCard className="mx-auto mb-1 h-5 w-5 text-brand-600" />
                  <p className="text-lg font-bold text-brand-700">{r.abonnement}</p>
                  <p className="text-xs text-brand-500">Plan</p>
                </div>
                <div className="rounded-xl bg-green-50 p-4 text-center">
                  <Euro className="mx-auto mb-1 h-5 w-5 text-green-600" />
                  <p className="text-lg font-bold text-green-700">{r.abonnementMontant} €/mois</p>
                  <p className="text-xs text-green-500">Abonnement</p>
                </div>
                <div className="rounded-xl bg-purple-50 p-4 text-center">
                  <Percent className="mx-auto mb-1 h-5 w-5 text-purple-600" />
                  <p className="text-lg font-bold text-purple-700">{r.commission}%</p>
                  <p className="text-xs text-purple-500">Commission</p>
                </div>
              </div>

              <div className="rounded-xl border border-gray-100 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Statut CRM</span>
                  <select
                    value={r.crmStatus}
                    onChange={e => { const u = { ...r, crmStatus: e.target.value as CRMStatus }; setR(u); onUpdate(u); }}
                    className="rounded-lg border border-gray-200 px-2 py-1 text-sm focus:border-brand-500 focus:outline-none"
                  >
                    {CRM_STATUS_OPTIONS.map(s => (
                      <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Plan abonnement</span>
                  <select
                    value={r.abonnement}
                    onChange={e => { const u = { ...r, abonnement: e.target.value as AbonnementType }; setR(u); onUpdate(u); }}
                    className="rounded-lg border border-gray-200 px-2 py-1 text-sm focus:border-brand-500 focus:outline-none"
                  >
                    {ABONNEMENT_OPTIONS.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Commission (%)</span>
                  <input
                    type="number"
                    min={0} max={100} step={0.5}
                    value={r.commission}
                    onChange={e => { const u = { ...r, commission: parseFloat(e.target.value) || 0 }; setR(u); onUpdate(u); }}
                    className="w-20 rounded-lg border border-gray-200 px-2 py-1 text-sm focus:border-brand-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ── Historique ── */}
          {tab === 'Historique' && (
            <div className="space-y-4">
              {/* Add note */}
              <div className="rounded-xl border border-gray-200 p-4 space-y-3">
                <div className="flex gap-2">
                  <select
                    value={noteAction}
                    onChange={e => setNoteAction(e.target.value)}
                    className="rounded-lg border border-gray-200 px-2 py-1.5 text-sm focus:border-brand-500 focus:outline-none"
                  >
                    {['Note', 'Appel commercial', 'Email', 'Réunion', 'Support', 'Upgrade', 'Autre'].map(a => (
                      <option key={a} value={a}>{a}</option>
                    ))}
                  </select>
                  <span className="text-xs text-gray-400 self-center">{new Date().toLocaleDateString('fr-FR')}</span>
                </div>
                <textarea
                  value={noteText}
                  onChange={e => setNoteText(e.target.value)}
                  placeholder="Ajouter une note ou un compte-rendu..."
                  rows={3}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm resize-none focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                />
                <button
                  onClick={addNote}
                  disabled={!noteText.trim()}
                  className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-600 disabled:opacity-40"
                >
                  Ajouter
                </button>
              </div>

              {/* Timeline */}
              <div className="space-y-3">
                {r.history.map(entry => (
                  <div key={entry.id} className="flex gap-3">
                    <div className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-50">
                      <History className="h-3.5 w-3.5 text-brand-600" />
                    </div>
                    <div className="flex-1 rounded-xl border border-gray-100 bg-gray-50 p-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-gray-700">{entry.action}</span>
                        <span className="text-xs text-gray-400">{entry.date} · {entry.author}</span>
                      </div>
                      <p className="text-sm text-gray-600">{entry.note}</p>
                    </div>
                  </div>
                ))}
                {r.history.length === 0 && (
                  <p className="py-8 text-center text-sm text-gray-400">Aucun historique</p>
                )}
              </div>
            </div>
          )}

          {/* ── Documents ── */}
          {tab === 'Documents' && (
            <div className="space-y-3">
              {/* Add document button */}
              <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed border-brand-300 bg-brand-50/40 px-4 py-4 text-sm font-medium text-brand-700 transition-colors hover:bg-brand-50">
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                  className="sr-only"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const sizeKb = (file.size / 1024).toFixed(0);
                    const sizeLabel = file.size > 1024 * 1024
                      ? `${(file.size / 1024 / 1024).toFixed(1)} Mo`
                      : `${sizeKb} Ko`;
                    const newDoc: RestaurantDoc = {
                      name: file.name.replace(/\.[^.]+$/, ''),
                      status: 'fourni',
                      fileName: file.name,
                      fileSize: sizeLabel,
                      uploadedAt: new Date().toLocaleDateString('fr-FR'),
                    };
                    setR(prev => ({ ...prev, documents: [...prev.documents, newDoc] }));
                    onUpdate({ ...r, documents: [...r.documents, newDoc] });
                    e.target.value = '';
                  }}
                />
                <Upload className="h-4 w-4" />
                Importer un document (PDF, image, Word)
              </label>

              {/* Document list */}
              {r.documents.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-gray-400">
                  <FolderOpen className="mb-2 h-8 w-8" />
                  <p className="text-sm">Aucun document importé</p>
                </div>
              ) : (
                r.documents.map((doc, idx) => {
                  const ok = doc.status === 'fourni';
                  return (
                    <motion.div
                      key={`${doc.name}-${idx}`}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center gap-3 rounded-xl border border-gray-100 bg-white px-4 py-3 shadow-sm"
                    >
                      {/* Icon */}
                      <div className={`rounded-lg p-2 ${ok ? 'bg-green-50' : 'bg-red-50'}`}>
                        <FileText className={`h-4 w-4 ${ok ? 'text-green-600' : 'text-red-500'}`} />
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="truncate text-sm font-semibold text-gray-800">{doc.name}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          {doc.fileName && (
                            <span className="truncate text-xs text-gray-400">{doc.fileName}</span>
                          )}
                          {doc.fileSize && (
                            <span className="text-xs text-gray-400">· {doc.fileSize}</span>
                          )}
                          {doc.uploadedAt && (
                            <span className="text-xs text-gray-400">· {doc.uploadedAt}</span>
                          )}
                        </div>
                      </div>

                      {/* Status */}
                      <span className={`flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${
                        ok ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                      }`}>
                        {ok
                          ? <><CheckCircle2 className="h-3 w-3" />Fourni</>
                          : <><AlertCircle className="h-3 w-3" />Manquant</>
                        }
                      </span>

                      {/* Actions */}
                      <div className="flex shrink-0 items-center gap-1">
                        {ok && (
                          <button
                            title="Télécharger"
                            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
                          >
                            <Download className="h-3.5 w-3.5" />
                          </button>
                        )}
                        <button
                          title="Supprimer"
                          onClick={() => {
                            const updated = r.documents.filter((_, i) => i !== idx);
                            setR(prev => ({ ...prev, documents: updated }));
                            onUpdate({ ...r, documents: updated });
                          }}
                          className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </motion.div>
                  );
                })
              )}

              {/* Upload all required docs checklist */}
              {['Kbis', 'RIB', 'Contrat signé'].some(req => !r.documents.find(d => d.name === req && d.status === 'fourni')) && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
                  <p className="text-xs font-semibold text-amber-700 mb-2">Documents requis manquants :</p>
                  <div className="space-y-1">
                    {['Kbis', 'RIB', 'Contrat signé'].filter(req => !r.documents.find(d => d.name === req && d.status === 'fourni')).map(req => (
                      <p key={req} className="flex items-center gap-2 text-xs text-amber-600">
                        <AlertCircle className="h-3 w-3 shrink-0" />{req}
                      </p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

function Field({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <div className="rounded-xl bg-gray-50 px-3 py-2.5">
      <p className="text-xs font-semibold text-gray-400 mb-0.5">{label}</p>
      <p className="flex items-center gap-1.5 text-sm font-medium text-gray-800">
        {icon}{value || '—'}
      </p>
    </div>
  );
}

// ── Add / Edit modal ──────────────────────────────────────────────────────────

interface RestaurantForm {
  name: string; address: string; adresseFacturation: string; cuisine: string;
  openTime: string; closeTime: string;
  raisonSociale: string; siret: string;
  dirigeantName: string; dirigeantEmail: string; dirigeantTel: string;
  comptableName: string; comptableEmail: string; comptableTel: string;
  abonnement: AbonnementType; abonnementMontant: string;
  commission: string; crmStatus: CRMStatus;
}

const EMPTY_FORM: RestaurantForm = {
  name: '', address: '', adresseFacturation: '', cuisine: '',
  openTime: '', closeTime: '',
  raisonSociale: '', siret: '',
  dirigeantName: '', dirigeantEmail: '', dirigeantTel: '',
  comptableName: '', comptableEmail: '', comptableTel: '',
  abonnement: 'Starter', abonnementMontant: '99',
  commission: '12', crmStatus: 'prospect',
};

function AddRestaurantModal({ onClose, onAdd }: { onClose: () => void; onAdd: (r: Restaurant) => void }) {
  const [form, setForm] = useState<RestaurantForm>(EMPTY_FORM);
  const [section, setSection] = useState<'basic' | 'contacts' | 'contrat'>('basic');

  const set = (k: keyof RestaurantForm, v: string) => setForm(prev => ({ ...prev, [k]: v }));

  const handleSubmit = () => {
    if (!form.name.trim()) return;
    const initials = form.name.split(' ').filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase();
    const colors = ['from-pink-400 to-rose-500', 'from-cyan-400 to-blue-500', 'from-violet-400 to-purple-500'];
    const newR: Restaurant = {
      id: `r${Date.now()}`,
      name: form.name, address: form.address, adresseFacturation: form.adresseFacturation || form.address,
      cuisine: form.cuisine,
      status: 'open', crmStatus: form.crmStatus,
      rating: 0, ordersToday: 0, revenue: 0,
      openTime: form.openTime || '12:00', closeTime: form.closeTime || '22:00',
      image: initials || 'FS',
      color: colors[Math.floor(Math.random() * colors.length)],
      raisonSociale: form.raisonSociale || form.name,
      siret: form.siret,
      dirigeant: { name: form.dirigeantName, email: form.dirigeantEmail, tel: form.dirigeantTel },
      comptable:  { name: form.comptableName, email: form.comptableEmail, tel: form.comptableTel },
      abonnement: form.abonnement,
      abonnementMontant: parseFloat(form.abonnementMontant) || 99,
      commission: parseFloat(form.commission) || 12,
      history: [{ id: 'h0', date: new Date().toISOString().slice(0, 10), action: 'Création', note: 'Restaurant créé sur la plateforme.', author: 'Vous' }],
      documents: [
        { name: 'Kbis', status: 'manquant' },
        { name: 'RIB', status: 'manquant' },
        { name: 'Contrat signé', status: 'manquant' },
      ],
    };
    onAdd(newR);
    onClose();
  };

  const SECTIONS = [
    { key: 'basic',    label: 'Établissement' },
    { key: 'contacts', label: 'Contacts'       },
    { key: 'contrat',  label: 'Contrat'        },
  ] as const;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-surface-900/60 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 8 }}
        className="relative w-full max-w-lg rounded-2xl border border-surface-200 bg-white shadow-xl max-h-[90vh] flex flex-col"
      >
        <div className="border-b border-surface-100 px-6 py-5">
          <h2 className="text-lg font-semibold text-surface-900">Ajouter un restaurant</h2>
          <div className="mt-3 flex gap-1">
            {SECTIONS.map(s => (
              <button
                key={s.key}
                onClick={() => setSection(s.key)}
                className={`flex-1 rounded-lg py-1.5 text-xs font-semibold transition-all ${
                  section === s.key ? 'bg-brand-500 text-white' : 'text-gray-500 hover:bg-gray-100'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1.5 text-surface-400 transition-colors hover:bg-surface-100 hover:text-surface-600"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-3">
          {section === 'basic' && (
            <>
              <FormField label="Nom du restaurant *" value={form.name} onChange={v => set('name', v)} placeholder="FoodStack République" />
              <FormField label="Raison sociale" value={form.raisonSociale} onChange={v => set('raisonSociale', v)} placeholder="FOODSTACK RÉPUBLIQUE SAS" />
              <FormField label="SIRET" value={form.siret} onChange={v => set('siret', v)} placeholder="12345678900012" />
              <FormField label="Adresse" value={form.address} onChange={v => set('address', v)} placeholder="1 place de la République, Paris" />
              <FormField label="Adresse facturation" value={form.adresseFacturation} onChange={v => set('adresseFacturation', v)} placeholder="Idem adresse" />
              <FormField label="Type de cuisine" value={form.cuisine} onChange={v => set('cuisine', v)} placeholder="Italienne · Pizza" />
              <div className="grid grid-cols-2 gap-3">
                <FormField label="Ouverture" value={form.openTime} onChange={v => set('openTime', v)} placeholder="11:00" type="time" />
                <FormField label="Fermeture" value={form.closeTime} onChange={v => set('closeTime', v)} placeholder="23:00" type="time" />
              </div>
            </>
          )}

          {section === 'contacts' && (
            <>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Dirigeant</p>
              <FormField label="Nom" value={form.dirigeantName} onChange={v => set('dirigeantName', v)} placeholder="Jean Dupont" />
              <FormField label="Email" value={form.dirigeantEmail} onChange={v => set('dirigeantEmail', v)} placeholder="jean@restaurant.fr" type="email" />
              <FormField label="Téléphone" value={form.dirigeantTel} onChange={v => set('dirigeantTel', v)} placeholder="+33 6 12 34 56 78" />
              <p className="pt-2 text-xs font-bold text-gray-500 uppercase tracking-wide">Comptable</p>
              <FormField label="Nom / cabinet" value={form.comptableName} onChange={v => set('comptableName', v)} placeholder="Cabinet Dupont" />
              <FormField label="Email" value={form.comptableEmail} onChange={v => set('comptableEmail', v)} placeholder="compta@cabinet.fr" type="email" />
              <FormField label="Téléphone" value={form.comptableTel} onChange={v => set('comptableTel', v)} placeholder="+33 1 23 45 67 89" />
            </>
          )}

          {section === 'contrat' && (
            <>
              <div>
                <label className="mb-1 block text-xs font-semibold text-surface-600">Statut CRM</label>
                <select
                  value={form.crmStatus}
                  onChange={e => set('crmStatus', e.target.value)}
                  className="w-full rounded-xl border border-surface-200 px-3 py-2.5 text-sm focus:border-brand-400 focus:outline-none"
                >
                  {CRM_STATUS_OPTIONS.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-surface-600">Plan abonnement</label>
                <select
                  value={form.abonnement}
                  onChange={e => set('abonnement', e.target.value)}
                  className="w-full rounded-xl border border-surface-200 px-3 py-2.5 text-sm focus:border-brand-400 focus:outline-none"
                >
                  {ABONNEMENT_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <FormField label="Montant abonnement (€/mois)" value={form.abonnementMontant} onChange={v => set('abonnementMontant', v)} placeholder="299" type="number" />
              <FormField label="Commission (%)" value={form.commission} onChange={v => set('commission', v)} placeholder="12" type="number" />
            </>
          )}
        </div>

        <div className="flex gap-3 border-t border-surface-100 px-6 py-4">
          <button
            onClick={onClose}
            className="flex-1 rounded-xl border border-surface-200 py-2.5 text-sm font-semibold text-surface-600 transition-colors hover:bg-surface-50"
          >
            Annuler
          </button>
          <button
            onClick={handleSubmit}
            disabled={!form.name.trim()}
            className="flex-1 rounded-xl bg-brand-500 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-600 disabled:opacity-40"
          >
            Créer le restaurant
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function FormField({
  label, value, onChange, placeholder, type = 'text',
}: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-semibold text-surface-600">{label}</label>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full rounded-xl border border-surface-200 px-3 py-2.5 text-sm text-surface-900 placeholder-surface-400 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
      />
    </div>
  );
}

// ── Restaurant card ───────────────────────────────────────────────────────────

function RestaurantCard({ restaurant, onOpenDetail }: { restaurant: Restaurant; onOpenDetail: () => void }) {
  const statusCfg = STATUS_CONFIG[restaurant.status];

  return (
    <motion.div layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
      <Card padding="none" className="overflow-hidden hover:shadow-md transition-shadow">
        {/* Gradient header */}
        <div className={`flex items-center gap-4 bg-gradient-to-r ${restaurant.color} px-5 py-5`}>
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm">
            <span className="text-xl font-black text-white">{restaurant.image}</span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-base font-bold text-white">{restaurant.name}</p>
            <p className="mt-0.5 truncate text-xs text-white/80">{restaurant.cuisine}</p>
          </div>
          <div className="flex flex-col items-end gap-1">
            <Badge variant={statusCfg.variant} dot>{statusCfg.label}</Badge>
            <span className={`rounded-full px-2 py-0.5 text-xs font-semibold bg-white/80 ${CRM_STATUS_COLORS[restaurant.crmStatus]}`}>
              {restaurant.crmStatus.charAt(0).toUpperCase() + restaurant.crmStatus.slice(1)}
            </span>
          </div>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          {/* Address */}
          <div className="flex items-start gap-2 text-xs text-surface-500">
            <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-surface-400" />
            <span>{restaurant.address}</span>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-surface-50 p-3 text-center">
              <p className="text-lg font-bold text-surface-900">{restaurant.ordersToday}</p>
              <p className="text-xs text-surface-400">Commandes aujourd&apos;hui</p>
            </div>
            <div className="rounded-xl bg-surface-50 p-3 text-center">
              <p className="text-lg font-bold text-surface-900">{formatRevenue(restaurant.revenue)}</p>
              <p className="text-xs text-surface-400">Chiffre d&apos;affaires</p>
            </div>
          </div>

          {/* Rating + hours */}
          <div className="flex items-center justify-between">
            <RatingStars rating={restaurant.rating} />
            <div className="flex items-center gap-1 text-xs text-surface-500">
              <Clock className="h-3.5 w-3.5" />
              {restaurant.openTime} – {restaurant.closeTime}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-2 pt-1">
            <button
              onClick={onOpenDetail}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-brand-500 py-2 text-xs font-semibold text-white transition-colors hover:bg-brand-600"
            >
              <Store className="h-3.5 w-3.5" />
              Gérer
            </button>
            <button
              onClick={onOpenDetail}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-surface-200 py-2 text-xs font-semibold text-surface-600 transition-colors hover:bg-surface-50"
            >
              <Settings className="h-3.5 w-3.5" />
              Paramétrer
            </button>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

// ── Owner single-restaurant view ──────────────────────────────────────────────

function OwnerView({ restaurant, onUpdate }: { restaurant: Restaurant; onUpdate: (r: Restaurant) => void }) {
  const [detail, setDetail] = useState(false);
  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold text-surface-900">Mon restaurant</h1>
        <p className="mt-1 text-sm text-surface-500">Vue propriétaire</p>
      </div>
      <div className="max-w-sm">
        <RestaurantCard restaurant={restaurant} onOpenDetail={() => setDetail(true)} />
      </div>
      <AnimatePresence>
        {detail && (
          <RestaurantDetailModal
            restaurant={restaurant}
            onClose={() => setDetail(false)}
            onUpdate={r => { onUpdate(r); }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function RestaurantsPage() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>(RESTAURANTS_SEED);
  const [showModal, setShowModal]     = useState(false);
  const [detailId, setDetailId]       = useState<string | null>(null);
  const [search, setSearch]           = useState('');
  const [crmFilter, setCrmFilter]     = useState<CRMStatus | 'all'>('all');
  const [role, setRole]               = useState<string | null>(null);

  useEffect(() => {
    const val = parseCookie('fs_demo');
    setRole(val ?? 'manager');
  }, []);

  const filtered = useMemo(() => restaurants.filter(r => {
    if (crmFilter !== 'all' && r.crmStatus !== crmFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return r.name.toLowerCase().includes(q) || r.raisonSociale.toLowerCase().includes(q) || r.siret.includes(q);
    }
    return true;
  }), [restaurants, search, crmFilter]);

  const actifCount      = restaurants.filter(r => r.crmStatus === 'actif').length;
  const negocCount      = restaurants.filter(r => r.crmStatus === 'négociation').length;
  const mrrTotal        = restaurants.filter(r => r.crmStatus === 'actif').reduce((s, r) => s + r.abonnementMontant, 0);
  const churnedThisMonth= restaurants.filter(r => r.crmStatus === 'churned').length;

  const detailRestaurant = restaurants.find(r => r.id === detailId) ?? null;

  function updateRestaurant(updated: Restaurant) {
    setRestaurants(prev => prev.map(r => r.id === updated.id ? updated : r));
  }

  if (role === null) {
    return <div className="p-6 text-surface-400 text-sm">Chargement…</div>;
  }

  // Owner view — single restaurant
  if (role === 'owner') {
    return (
      <OwnerView
        restaurant={restaurants[0]}
        onUpdate={r => setRestaurants(prev => prev.map(x => x.id === r.id ? r : x))}
      />
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-surface-900">Restaurants</h1>
          <p className="mt-1 text-sm text-surface-500">Gérez vos établissements et prospects</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-600"
        >
          <Plus className="h-4 w-4" />
          Ajouter
        </button>
      </div>

      {/* Stats strip */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: 'Actifs',          value: String(actifCount),      icon: Store,        iconColor: 'text-green-600', iconBg: 'bg-green-50'  },
          { label: 'En négociation',  value: String(negocCount),      icon: TrendingUp,   iconColor: 'text-blue-600',  iconBg: 'bg-blue-50'   },
          { label: 'MRR total',       value: `${mrrTotal} €`,         icon: Euro,         iconColor: 'text-brand-600', iconBg: 'bg-brand-50'  },
          { label: 'Churned (30j)',   value: String(churnedThisMonth),icon: TrendingDown, iconColor: 'text-red-500',   iconBg: 'bg-red-50'    },
        ].map(({ label, value, icon: Icon, iconColor, iconBg }, i) => (
          <motion.div key={label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
            <Card padding="md" className="flex items-center gap-3">
              <div className={`rounded-xl p-2.5 ${iconBg}`}>
                <Icon className={`h-5 w-5 ${iconColor}`} />
              </div>
              <div>
                <p className="text-xl font-bold text-surface-900">{value}</p>
                <p className="text-xs text-surface-400">{label}</p>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Search + filter */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Nom, raison sociale, SIRET..."
            className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-9 pr-4 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
          />
        </div>
        <div className="flex flex-wrap gap-1 rounded-xl border border-gray-200 bg-white p-1">
          <button
            onClick={() => setCrmFilter('all')}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-all ${crmFilter === 'all' ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
          >
            Tous
          </button>
          {CRM_STATUS_OPTIONS.map(s => (
            <button
              key={s}
              onClick={() => setCrmFilter(s)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-all ${crmFilter === s ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Restaurant cards grid */}
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        <AnimatePresence mode="popLayout">
          {filtered.map(restaurant => (
            <RestaurantCard
              key={restaurant.id}
              restaurant={restaurant}
              onOpenDetail={() => setDetailId(restaurant.id)}
            />
          ))}
        </AnimatePresence>
      </div>

      {filtered.length === 0 && (
        <div className="py-16 text-center text-gray-400">Aucun restaurant trouvé</div>
      )}

      {/* Modals */}
      <AnimatePresence>
        {showModal && (
          <AddRestaurantModal
            onClose={() => setShowModal(false)}
            onAdd={r => setRestaurants(prev => [...prev, r])}
          />
        )}
        {detailRestaurant && (
          <RestaurantDetailModal
            restaurant={detailRestaurant}
            onClose={() => setDetailId(null)}
            onUpdate={updateRestaurant}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
