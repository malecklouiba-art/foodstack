'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import {
  Store, TrendingUp, Clock, MapPin, Settings,
  Plus, X, ChevronRight, Edit2, Search,
  Building2, FileText, History, FolderOpen,
  Phone, Mail, User, CreditCard, Percent,
  CheckCircle2, AlertCircle, XCircle,
  Euro, Users, TrendingDown, Upload, Trash2, Download, Eye,
  ArrowLeft, KeyRound, Copy, Send,
} from 'lucide-react';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

// ── Types ────────────────────────────────────────────────────────────────────

type RestaurantStatus = 'open' | 'paused';
type CRMStatus = 'prospect' | 'négociation' | 'actif' | 'pause' | 'churned';
type AbonnementType = 'Starter' | 'Pro' | 'Business' | 'Enterprise';
type PaymentStatus = 'ok' | 'retard' | 'impaye';
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
  paymentStatus: PaymentStatus;
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

const REQUIRED_DOCS = ['Kbis', 'RIB', "Pièce d'identité", 'Contrat signé', 'Assurance'];

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

const PAYMENT_STATUS_CONFIG: Record<PaymentStatus, { label: string; icon: string; className: string }> = {
  ok:     { label: 'Paiement OK',  icon: '✓', className: 'bg-green-50 text-green-700' },
  retard: { label: 'Retard',       icon: '⚠', className: 'bg-yellow-50 text-yellow-700' },
  impaye: { label: 'Impayé',       icon: '✗', className: 'bg-red-50 text-red-700' },
};

const ABONNEMENT_COLORS: Record<AbonnementType, string> = {
  Starter:    'bg-orange-50 text-orange-600 border border-orange-200',
  Pro:        'bg-brand-50 text-brand-700 border border-brand-200',
  Business:   'bg-purple-50 text-purple-700 border border-purple-200',
  Enterprise: 'bg-gray-900 text-white border border-gray-700',
};

const ABONNEMENT_OPTIONS: AbonnementType[] = ['Starter', 'Pro', 'Business', 'Enterprise'];
const CRM_STATUS_OPTIONS: CRMStatus[] = ['prospect', 'négociation', 'actif', 'pause', 'churned'];

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatRevenue(n: number): string {
  return n.toLocaleString('fr-FR') + ' €';
}

function parseCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

function generateTempPassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#';
  return Array.from({ length: 12 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

// ── Credentials Modal ─────────────────────────────────────────────────────────

function CredentialsModal({
  email,
  password,
  onClose,
}: {
  email: string;
  password: string;
  onClose: () => void;
}) {
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [copiedPwd, setCopiedPwd] = useState(false);
  const [copiedBoth, setCopiedBoth] = useState(false);

  const copy = (text: string, setter: (v: boolean) => void) => {
    navigator.clipboard.writeText(text).then(() => {
      setter(true);
      setTimeout(() => setter(false), 1500);
    });
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-md rounded-2xl bg-white shadow-2xl overflow-hidden"
      >
        <div className="flex items-center gap-3 bg-gradient-to-r from-brand-500 to-brand-700 px-6 py-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20">
            <KeyRound className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Accès créés</h3>
            <p className="text-xs text-white/80">Transmettez ces identifiants au propriétaire</p>
          </div>
          <button onClick={onClose} className="ml-auto rounded-lg p-1.5 text-white/70 hover:bg-white/20">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 space-y-3">
            {/* Email */}
            <div>
              <p className="text-xs font-semibold text-gray-500 mb-1">Email de connexion</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800">
                  {email}
                </code>
                <button
                  onClick={() => copy(email, setCopiedEmail)}
                  className="flex items-center gap-1 rounded-lg bg-gray-100 px-3 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-200 transition-colors"
                >
                  <Copy className="h-3.5 w-3.5" />
                  {copiedEmail ? 'Copié' : 'Copier'}
                </button>
              </div>
            </div>
            {/* Password */}
            <div>
              <p className="text-xs font-semibold text-gray-500 mb-1">Mot de passe temporaire</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-mono text-gray-800 tracking-widest">
                  {password}
                </code>
                <button
                  onClick={() => copy(password, setCopiedPwd)}
                  className="flex items-center gap-1 rounded-lg bg-gray-100 px-3 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-200 transition-colors"
                >
                  <Copy className="h-3.5 w-3.5" />
                  {copiedPwd ? 'Copié' : 'Copier'}
                </button>
              </div>
            </div>
          </div>

          <p className="text-xs text-amber-700 bg-amber-50 rounded-xl px-4 py-3 flex items-start gap-2">
            <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
            Le propriétaire devra changer son mot de passe lors de la première connexion.
          </p>

          <div className="flex gap-3">
            <button
              onClick={() => copy(`Email: ${email}\nMot de passe: ${password}`, setCopiedBoth)}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-brand-500 py-2.5 text-sm font-semibold text-white hover:bg-brand-600 transition-colors"
            >
              <Copy className="h-4 w-4" />
              {copiedBoth ? 'Copié !' : 'Tout copier'}
            </button>
            <button
              onClick={onClose}
              className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Fermer
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// ── Detail Full-page view ─────────────────────────────────────────────────────

function RestaurantDetailPage({
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
  const [showCredentials, setShowCredentials] = useState(false);
  const [generatedCreds, setGeneratedCreds] = useState<{ email: string; password: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const TABS: DetailTab[] = ['Informations', 'Contrat', 'Historique', 'Documents'];

  function save(updated: Restaurant) {
    setR(updated);
    onUpdate(updated);
    (api.patch(`/restaurants/${updated.id}`, {
      name: updated.name,
      phone: updated.dirigeant.tel || undefined,
      settings: {
        crmStatus: updated.crmStatus,
        abonnement: updated.abonnement,
        abonnementMontant: updated.abonnementMontant,
        commission: updated.commission,
        paymentStatus: updated.paymentStatus,
        raisonSociale: updated.raisonSociale,
        siret: updated.siret,
      },
    }) as Promise<any>).catch(() => {});
  }

  function addNote() {
    if (!noteText.trim()) return;
    const entry: HistoryEntry = {
      id: `h${Date.now()}`,
      date: new Date().toISOString().slice(0, 10),
      action: noteAction,
      note: noteText.trim(),
      author: 'Vous',
    };
    save({ ...r, history: [entry, ...r.history] });
    setNoteText('');
  }

  function handleCreateAccess() {
    const email = r.dirigeant.email || `contact@${r.name.toLowerCase().replace(/\s+/g, '-')}.fr`;
    const password = generateTempPassword();
    setGeneratedCreds({ email, password });
    setShowCredentials(true);
    const entry: HistoryEntry = {
      id: `h${Date.now()}`,
      date: new Date().toISOString().slice(0, 10),
      action: 'Création accès',
      note: `Identifiants générés pour ${email}.`,
      author: 'Vous',
    };
    save({ ...r, history: [entry, ...r.history] });
  }

  function handleSendInvoice() {
    const email = r.dirigeant.email || 'contact@restaurant.fr';
    toast.success(`Facture envoyée à ${email}`, { duration: 3000 });
  }

  function handleSendContract() {
    const email = r.dirigeant.email || 'contact@restaurant.fr';
    toast.success(`Contrat envoyé à ${email}`, { duration: 3000 });
  }

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const sizeLabel = file.size > 1024 * 1024
      ? `${(file.size / 1024 / 1024).toFixed(1)} Mo`
      : `${(file.size / 1024).toFixed(0)} Ko`;

    // Match against required doc names
    const matchedRequired = REQUIRED_DOCS.find(req =>
      file.name.toLowerCase().includes(req.toLowerCase().replace(/['\s]/g, ''))
    );
    const docName = matchedRequired ?? file.name.replace(/\.[^.]+$/, '');

    // Replace existing or add new
    const existingIdx = r.documents.findIndex(d => d.name === docName);
    const newDoc: RestaurantDoc = {
      name: docName,
      status: 'fourni',
      fileName: file.name,
      fileSize: sizeLabel,
      uploadedAt: new Date().toLocaleDateString('fr-FR'),
    };
    const newDocs = existingIdx >= 0
      ? r.documents.map((d, i) => i === existingIdx ? newDoc : d)
      : [...r.documents, newDoc];

    save({ ...r, documents: newDocs });
    e.target.value = '';
    toast.success(`Document "${docName}" importé`, { duration: 2500 });
  }

  function deleteDoc(idx: number) {
    const updated = r.documents.filter((_, i) => i !== idx);
    save({ ...r, documents: updated });
  }

  const paymentCfg = PAYMENT_STATUS_CONFIG[r.paymentStatus];
  const recentHistory = r.history.slice(0, 5);

  return (
    <div className="min-h-full bg-surface-50">
      {/* Breadcrumb + back */}
      <div className="border-b border-gray-100 bg-white px-6 py-3">
        <div className="flex items-center gap-2 text-sm">
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 text-gray-500 hover:text-gray-700 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Restaurants
          </button>
          <ChevronRight className="h-4 w-4 text-gray-300" />
          <span className="font-semibold text-gray-800">{r.name}</span>
        </div>
      </div>

      {/* Hero header */}
      <div className={`bg-gradient-to-r ${r.color} px-6 py-8`}>
        <div className="mx-auto max-w-6xl flex items-center gap-6">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm text-3xl font-black text-white">
            {r.image}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold text-white">{r.name}</h1>
            <p className="mt-0.5 text-white/80">{r.raisonSociale}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <span className={`rounded-full px-3 py-1 text-xs font-semibold bg-white/90 ${CRM_STATUS_COLORS[r.crmStatus]}`}>
                {r.crmStatus.charAt(0).toUpperCase() + r.crmStatus.slice(1)}
              </span>
              <span className={`rounded-full px-3 py-1 text-xs font-semibold bg-white/90 ${ABONNEMENT_COLORS[r.abonnement]}`}>
                {r.abonnement}
              </span>
              <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-semibold text-white">
                {r.abonnementMontant}€/mois
              </span>
              <span className={`rounded-full px-3 py-1 text-xs font-semibold bg-white/90 ${paymentCfg.className}`}>
                {paymentCfg.label} {paymentCfg.icon}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl p-2 text-white/70 hover:bg-white/20 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-6xl px-6 py-6">
        <div className="flex gap-6">
          {/* Main panel */}
          <div className="flex-1 min-w-0">
            {/* Tabs */}
            <div className="flex gap-0 border-b border-gray-200 mb-6 overflow-x-auto">
              {TABS.map(t => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`mr-6 pb-3 text-sm font-semibold whitespace-nowrap border-b-2 transition-colors ${
                    tab === t ? 'border-brand-500 text-brand-600' : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>

            {/* ── Informations ── */}
            {tab === 'Informations' && (
              <div className="space-y-6">
                <div className="rounded-2xl border border-gray-100 bg-white p-6">
                  <h3 className="mb-4 text-sm font-bold text-gray-500 uppercase tracking-wide">Établissement</h3>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <Field label="Raison sociale" value={r.raisonSociale} />
                    <Field label="SIRET" value={r.siret} />
                    <Field label="Type cuisine" value={r.cuisine} />
                    <Field label="Adresse" value={r.address} icon={<MapPin className="h-3.5 w-3.5 text-gray-400" />} />
                    <Field label="Adresse facturation" value={r.adresseFacturation} icon={<MapPin className="h-3.5 w-3.5 text-gray-400" />} />
                    <Field label="Horaires" value={`${r.openTime} – ${r.closeTime}`} icon={<Clock className="h-3.5 w-3.5 text-gray-400" />} />
                  </div>
                </div>

                <div className="rounded-2xl border border-gray-100 bg-white p-6">
                  <h3 className="mb-4 text-sm font-bold text-gray-500 uppercase tracking-wide">Dirigeant</h3>
                  <div className="grid gap-4 sm:grid-cols-3">
                    <Field label="Nom" value={r.dirigeant.name} icon={<User className="h-3.5 w-3.5 text-gray-400" />} />
                    <Field label="Email" value={r.dirigeant.email} icon={<Mail className="h-3.5 w-3.5 text-gray-400" />} />
                    <Field label="Tél." value={r.dirigeant.tel} icon={<Phone className="h-3.5 w-3.5 text-gray-400" />} />
                  </div>
                </div>

                <div className="rounded-2xl border border-gray-100 bg-white p-6">
                  <h3 className="mb-4 text-sm font-bold text-gray-500 uppercase tracking-wide">Comptable</h3>
                  <div className="grid gap-4 sm:grid-cols-3">
                    <Field label="Nom" value={r.comptable.name} icon={<User className="h-3.5 w-3.5 text-gray-400" />} />
                    <Field label="Email" value={r.comptable.email} icon={<Mail className="h-3.5 w-3.5 text-gray-400" />} />
                    <Field label="Tél." value={r.comptable.tel} icon={<Phone className="h-3.5 w-3.5 text-gray-400" />} />
                  </div>
                </div>
              </div>
            )}

            {/* ── Contrat ── */}
            {tab === 'Contrat' && (
              <div className="space-y-6">
                {/* Stats cards */}
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="rounded-2xl border border-gray-100 bg-white p-5 text-center">
                    <CreditCard className="mx-auto mb-2 h-6 w-6 text-brand-600" />
                    <p className="text-xl font-bold text-brand-700">{r.abonnement}</p>
                    <p className="text-xs text-brand-500 mt-0.5">Plan</p>
                  </div>
                  <div className="rounded-2xl border border-gray-100 bg-white p-5 text-center">
                    <Euro className="mx-auto mb-2 h-6 w-6 text-green-600" />
                    <p className="text-xl font-bold text-green-700">{r.abonnementMontant} €/mois</p>
                    <p className="text-xs text-green-500 mt-0.5">Abonnement</p>
                  </div>
                  <div className="rounded-2xl border border-gray-100 bg-white p-5 text-center">
                    <Percent className="mx-auto mb-2 h-6 w-6 text-purple-600" />
                    <p className="text-xl font-bold text-purple-700">{r.commission}%</p>
                    <p className="text-xs text-purple-500 mt-0.5">Commission</p>
                  </div>
                </div>

                {/* Edit fields */}
                <div className="rounded-2xl border border-gray-100 bg-white p-6 space-y-4">
                  <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wide">Modifier le contrat</h3>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Statut CRM</span>
                    <select
                      value={r.crmStatus}
                      onChange={e => save({ ...r, crmStatus: e.target.value as CRMStatus })}
                      className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm focus:border-brand-500 focus:outline-none"
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
                      onChange={e => save({ ...r, abonnement: e.target.value as AbonnementType })}
                      className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm focus:border-brand-500 focus:outline-none"
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
                      onChange={e => save({ ...r, commission: parseFloat(e.target.value) || 0 })}
                      className="w-24 rounded-lg border border-gray-200 px-3 py-1.5 text-sm focus:border-brand-500 focus:outline-none"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Statut paiement</span>
                    <select
                      value={r.paymentStatus}
                      onChange={e => save({ ...r, paymentStatus: e.target.value as PaymentStatus })}
                      className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm focus:border-brand-500 focus:outline-none"
                    >
                      <option value="ok">Paiement OK ✓</option>
                      <option value="retard">Retard ⚠</option>
                      <option value="impaye">Impayé ✗</option>
                    </select>
                  </div>
                </div>

                {/* Actions */}
                <div className="rounded-2xl border border-gray-100 bg-white p-6 space-y-3">
                  <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-4">Actions</h3>

                  {/* Create access */}
                  <button
                    onClick={handleCreateAccess}
                    className="flex w-full items-center gap-3 rounded-xl border border-brand-200 bg-brand-50 px-5 py-3.5 text-sm font-semibold text-brand-700 hover:bg-brand-100 transition-colors"
                  >
                    <KeyRound className="h-4 w-4 shrink-0" />
                    <div className="text-left">
                      <p>Créer les accès</p>
                      <p className="text-xs font-normal text-brand-500">Génère email + mot de passe temporaire</p>
                    </div>
                    <ChevronRight className="h-4 w-4 ml-auto" />
                  </button>

                  {/* Send invoice */}
                  <button
                    onClick={handleSendInvoice}
                    className="flex w-full items-center gap-3 rounded-xl border border-gray-200 bg-white px-5 py-3.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <FileText className="h-4 w-4 shrink-0 text-gray-500" />
                    <div className="text-left">
                      <p>Envoyer la facture</p>
                      <p className="text-xs font-normal text-gray-400">Envoie par email à {r.dirigeant.email || 'contact@restaurant.fr'}</p>
                    </div>
                    <Send className="h-4 w-4 ml-auto text-gray-400" />
                  </button>

                  {/* Send contract */}
                  <button
                    onClick={handleSendContract}
                    className="flex w-full items-center gap-3 rounded-xl border border-gray-200 bg-white px-5 py-3.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <Edit2 className="h-4 w-4 shrink-0 text-gray-500" />
                    <div className="text-left">
                      <p>Envoyer le contrat</p>
                      <p className="text-xs font-normal text-gray-400">Envoie par email à {r.dirigeant.email || 'contact@restaurant.fr'}</p>
                    </div>
                    <Send className="h-4 w-4 ml-auto text-gray-400" />
                  </button>
                </div>
              </div>
            )}

            {/* ── Historique ── */}
            {tab === 'Historique' && (
              <div className="space-y-5">
                {/* Add note */}
                <div className="rounded-2xl border border-gray-100 bg-white p-6 space-y-3">
                  <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wide">Ajouter une entrée</h3>
                  <div className="flex gap-2 items-center">
                    <select
                      value={noteAction}
                      onChange={e => setNoteAction(e.target.value)}
                      className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
                    >
                      {['Note', 'Appel commercial', 'Email', 'Réunion', 'Support', 'Upgrade', 'Autre'].map(a => (
                        <option key={a} value={a}>{a}</option>
                      ))}
                    </select>
                    <span className="text-xs text-gray-400">{new Date().toLocaleDateString('fr-FR')}</span>
                  </div>
                  <textarea
                    value={noteText}
                    onChange={e => setNoteText(e.target.value)}
                    placeholder="Ajouter une note ou un compte-rendu..."
                    rows={3}
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm resize-none focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                  />
                  <button
                    onClick={addNote}
                    disabled={!noteText.trim()}
                    className="rounded-xl bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-600 disabled:opacity-40"
                  >
                    Ajouter
                  </button>
                </div>

                {/* Timeline */}
                <div className="space-y-3">
                  {r.history.map(entry => (
                    <div key={entry.id} className="flex gap-4">
                      <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-50">
                        <History className="h-4 w-4 text-brand-600" />
                      </div>
                      <div className="flex-1 rounded-2xl border border-gray-100 bg-white p-4">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-sm font-bold text-gray-700">{entry.action}</span>
                          <span className="text-xs text-gray-400">{entry.date} · {entry.author}</span>
                        </div>
                        <p className="text-sm text-gray-600">{entry.note}</p>
                      </div>
                    </div>
                  ))}
                  {r.history.length === 0 && (
                    <p className="py-12 text-center text-sm text-gray-400">Aucun historique</p>
                  )}
                </div>
              </div>
            )}

            {/* ── Documents ── */}
            {tab === 'Documents' && (
              <div className="space-y-4">
                {/* Upload button */}
                <label className="flex cursor-pointer items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-brand-300 bg-brand-50/40 px-6 py-5 text-sm font-semibold text-brand-700 transition-colors hover:bg-brand-50">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                    className="sr-only"
                    onChange={handleFileUpload}
                  />
                  <Upload className="h-5 w-5" />
                  Importer un document (PDF, image, Word)
                </label>

                {/* Required docs checklist */}
                <div className="rounded-2xl border border-gray-100 bg-white p-5">
                  <h3 className="mb-4 text-sm font-bold text-gray-500 uppercase tracking-wide">Documents requis</h3>
                  <div className="space-y-2">
                    {REQUIRED_DOCS.map(reqName => {
                      const doc = r.documents.find(d => d.name === reqName);
                      const ok = doc?.status === 'fourni';
                      return (
                        <div
                          key={reqName}
                          className={`flex items-center gap-3 rounded-xl px-4 py-3 ${ok ? 'bg-green-50' : 'bg-red-50'}`}
                        >
                          {ok
                            ? <CheckCircle2 className="h-4 w-4 shrink-0 text-green-600" />
                            : <XCircle className="h-4 w-4 shrink-0 text-red-500" />
                          }
                          <span className={`flex-1 text-sm font-medium ${ok ? 'text-green-800' : 'text-red-700'}`}>
                            {reqName}
                          </span>
                          <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${ok ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                            {ok ? 'Fourni ✓' : 'Manquant ✗'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Document list */}
                <div className="rounded-2xl border border-gray-100 bg-white p-5">
                  <h3 className="mb-4 text-sm font-bold text-gray-500 uppercase tracking-wide">
                    Fichiers importés ({r.documents.filter(d => d.status === 'fourni').length})
                  </h3>

                  {r.documents.filter(d => d.status === 'fourni').length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-gray-400">
                      <FolderOpen className="mb-2 h-8 w-8" />
                      <p className="text-sm">Aucun document importé</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {r.documents.map((doc, idx) => {
                        if (doc.status !== 'fourni') return null;
                        return (
                          <motion.div
                            key={`${doc.name}-${idx}`}
                            initial={{ opacity: 0, y: 4 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex items-center gap-4 rounded-xl border border-gray-100 bg-gray-50 px-4 py-3"
                          >
                            <div className="rounded-lg bg-green-50 p-2">
                              <FileText className="h-4 w-4 text-green-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="truncate text-sm font-semibold text-gray-800">{doc.name}</p>
                              <p className="text-xs text-gray-400 mt-0.5">
                                {[doc.fileName, doc.fileSize, doc.uploadedAt ? `Importé le ${doc.uploadedAt}` : null].filter(Boolean).join(' · ')}
                              </p>
                            </div>
                            <span className="shrink-0 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-bold text-green-700">
                              Fourni ✓
                            </span>
                            <div className="flex shrink-0 items-center gap-1">
                              <button
                                title="Télécharger"
                                className="rounded-lg p-1.5 text-gray-400 hover:bg-white hover:text-gray-600 transition-colors"
                              >
                                <Download className="h-3.5 w-3.5" />
                              </button>
                              <button
                                title="Supprimer"
                                onClick={() => deleteDoc(idx)}
                                className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar — Activité récente */}
          <div className="hidden lg:block w-72 shrink-0">
            <div className="sticky top-6 rounded-2xl border border-gray-100 bg-white p-5">
              <h3 className="mb-4 text-sm font-bold text-gray-500 uppercase tracking-wide">Activité récente</h3>
              <div className="space-y-3">
                {recentHistory.length === 0 ? (
                  <p className="text-xs text-gray-400 text-center py-4">Aucune activité</p>
                ) : (
                  recentHistory.map(entry => (
                    <div key={entry.id} className="flex gap-2.5">
                      <div className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-50">
                        <History className="h-3 w-3 text-brand-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <span className="truncate text-xs font-bold text-gray-700">{entry.action}</span>
                          <span className="shrink-0 text-[10px] text-gray-400">{entry.date}</span>
                        </div>
                        <p className="mt-0.5 text-xs text-gray-500 line-clamp-2">{entry.note}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Quick stats */}
              <div className="mt-5 pt-5 border-t border-gray-100 space-y-2.5">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Commandes</span>
                  <span className="font-bold text-gray-800">{r.ordersToday}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">CA du jour</span>
                  <span className="font-bold text-gray-800">{formatRevenue(r.revenue)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Horaires</span>
                  <span className="font-bold text-gray-800">{r.openTime}–{r.closeTime}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Credentials modal */}
      <AnimatePresence>
        {showCredentials && generatedCreds && (
          <CredentialsModal
            email={generatedCreds.email}
            password={generatedCreds.password}
            onClose={() => setShowCredentials(false)}
          />
        )}
      </AnimatePresence>
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

const PACK_PRICES: Record<AbonnementType, number> = {
  Starter: 99,
  Pro: 299,
  Business: 599,
  Enterprise: 999,
};

const PACK_FEATURES: Record<AbonnementType, string[]> = {
  Starter:    ['Jusqu\'à 100 commandes/mois', 'Borne 1 device', 'Support email'],
  Pro:        ['Commandes illimitées', '3 bornes + POS', 'Analytics avancés', 'Support prioritaire'],
  Business:   ['Multi-établissements', 'Bornes illimitées', 'API publique', 'Account manager dédié'],
  Enterprise: ['Tout Business', 'SLA 99.99%', 'Intégration sur-mesure', 'Onboarding équipe'],
};

function AddRestaurantModal({ onClose, onAdd }: { onClose: () => void; onAdd: (r: Restaurant) => void }) {
  const [form, setForm] = useState<RestaurantForm>(EMPTY_FORM);
  const [section, setSection] = useState<'basic' | 'contacts' | 'contrat' | 'paiement'>('basic');
  const [paid, setPaid] = useState(false);
  const [paymentLink, setPaymentLink] = useState<string | null>(null);
  const [linkCopied, setLinkCopied] = useState(false);
  const [processing, setProcessing] = useState(false);

  const packPrice = PACK_PRICES[form.abonnement];

  const generatePaymentLink = () => {
    const token = Math.random().toString(36).slice(2, 14) + Math.random().toString(36).slice(2, 14);
    setPaymentLink(`https://checkout.stripe.com/c/pay/cs_test_${token}`);
  };

  const simulatePayment = () => {
    setProcessing(true);
    setTimeout(() => {
      setPaid(true);
      setProcessing(false);
    }, 1500);
  };

  const set = (k: keyof RestaurantForm, v: string) => setForm(prev => ({ ...prev, [k]: v }));

  const handleSubmit = () => {
    if (!form.name.trim() || !paid) return;
    const initials = form.name.split(' ').filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase();
    const colors = ['from-pink-400 to-rose-500', 'from-cyan-400 to-blue-500', 'from-violet-400 to-purple-500'];
    const newR: Restaurant = {
      id: `r${Date.now()}`,
      name: form.name, address: form.address, adresseFacturation: form.adresseFacturation || form.address,
      cuisine: form.cuisine,
      status: 'open', crmStatus: form.crmStatus,
      paymentStatus: 'ok',
      ordersToday: 0, revenue: 0,
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
      history: [
        { id: 'h-pay', date: new Date().toISOString().slice(0, 10), action: 'Paiement', note: `Pack ${form.abonnement} payé via Stripe (${packPrice}€).`, author: 'Stripe' },
        { id: 'h0', date: new Date().toISOString().slice(0, 10), action: 'Création', note: 'Restaurant créé sur la plateforme.', author: 'Vous' },
      ],
      documents: REQUIRED_DOCS.map(name => ({ name, status: 'manquant' as DocStatus })),
    };
    onAdd(newR);
    onClose();
    (api.post('/restaurants', {
      name: form.name,
      address: form.address || form.adresseFacturation || '',
      phone: form.dirigeantTel || '',
      cuisine: form.cuisine || undefined,
      settings: {
        crmStatus: form.crmStatus,
        abonnement: form.abonnement,
        abonnementMontant: parseFloat(form.abonnementMontant) || 99,
        commission: parseFloat(form.commission) || 12,
        raisonSociale: form.raisonSociale || form.name,
        siret: form.siret,
      },
    }) as Promise<any>).catch(() => {});
  };

  const SECTIONS = [
    { key: 'basic',    label: 'Établissement' },
    { key: 'contacts', label: 'Contacts'       },
    { key: 'contrat',  label: 'Contrat'        },
    { key: 'paiement', label: 'Paiement'       },
  ] as const;

  const canAdvanceFromBasic = !!form.name.trim();
  const canAdvanceFromContacts = !!form.dirigeantEmail.trim();
  const sectionOrder: typeof SECTIONS[number]['key'][] = ['basic', 'contacts', 'contrat', 'paiement'];
  const currentIdx = sectionOrder.indexOf(section);
  const isLast = section === 'paiement';
  const canGoNext =
    section === 'basic' ? canAdvanceFromBasic :
    section === 'contacts' ? canAdvanceFromContacts :
    true;

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
                <div className="grid grid-cols-2 gap-2">
                  {ABONNEMENT_OPTIONS.map(s => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => {
                        setForm(prev => ({ ...prev, abonnement: s, abonnementMontant: String(PACK_PRICES[s]) }));
                        setPaid(false);
                        setPaymentLink(null);
                      }}
                      className={`rounded-xl border-2 px-3 py-2.5 text-left transition-all ${
                        form.abonnement === s
                          ? 'border-brand-500 bg-brand-50'
                          : 'border-surface-200 hover:border-surface-300'
                      }`}
                    >
                      <p className="text-sm font-bold text-surface-900">{s}</p>
                      <p className="text-xs text-surface-500">{PACK_PRICES[s]}€ /mois</p>
                    </button>
                  ))}
                </div>
              </div>
              <FormField label="Commission (%)" value={form.commission} onChange={v => set('commission', v)} placeholder="12" type="number" />
            </>
          )}

          {section === 'paiement' && (
            <>
              {/* Pack summary */}
              <div className="rounded-2xl border-2 border-brand-200 bg-brand-50/50 p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-brand-700">Pack sélectionné</p>
                    <p className="mt-1 text-2xl font-black text-surface-900">{form.abonnement}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-black text-brand-700">{packPrice}€</p>
                    <p className="text-xs text-surface-500">/ mois</p>
                  </div>
                </div>
                <ul className="mt-3 space-y-1.5">
                  {PACK_FEATURES[form.abonnement].map(f => (
                    <li key={f} className="flex items-center gap-2 text-sm text-surface-700">
                      <span className="text-brand-500">✓</span> {f}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Payment state */}
              {!paid ? (
                <>
                  {!paymentLink ? (
                    <button
                      onClick={generatePaymentLink}
                      className="w-full rounded-xl bg-[#635BFF] py-3 text-sm font-semibold text-white transition-colors hover:bg-[#5048d6]"
                    >
                      Générer le lien Stripe — {packPrice}€
                    </button>
                  ) : (
                    <div className="space-y-3">
                      <div className="rounded-xl border border-surface-200 bg-surface-50 p-3">
                        <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-surface-500">Lien Stripe envoyé au dirigeant</p>
                        <div className="flex items-center gap-2">
                          <code className="flex-1 truncate rounded-lg bg-white px-2 py-1.5 text-[11px] text-surface-700 border border-surface-200">
                            {paymentLink}
                          </code>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(paymentLink);
                              setLinkCopied(true);
                              setTimeout(() => setLinkCopied(false), 1500);
                            }}
                            className="rounded-lg bg-surface-900 px-2.5 py-1.5 text-[11px] font-semibold text-white hover:bg-surface-800"
                          >
                            {linkCopied ? 'Copié' : 'Copier'}
                          </button>
                        </div>
                        <p className="mt-2 text-[11px] text-surface-500">
                          Envoyé à <span className="font-semibold">{form.dirigeantEmail || 'l\'email du dirigeant'}</span>.
                          Le restaurant sera créé automatiquement dès le paiement confirmé.
                        </p>
                      </div>
                      <button
                        onClick={simulatePayment}
                        disabled={processing}
                        className="w-full rounded-xl border-2 border-dashed border-brand-300 bg-white py-2.5 text-sm font-semibold text-brand-700 transition-colors hover:bg-brand-50 disabled:opacity-50"
                      >
                        {processing ? 'Traitement Stripe…' : '⚡ Simuler paiement réussi (démo)'}
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex items-center gap-3 rounded-2xl border-2 border-green-300 bg-green-50 p-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-500 text-white">
                    ✓
                  </div>
                  <div>
                    <p className="text-sm font-bold text-green-900">Paiement confirmé</p>
                    <p className="text-xs text-green-700">{packPrice}€ encaissés via Stripe. Restaurant prêt à être créé.</p>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <div className="flex gap-3 border-t border-surface-100 px-6 py-4">
          <button
            onClick={currentIdx > 0 ? () => setSection(sectionOrder[currentIdx - 1]) : onClose}
            className="rounded-xl border border-surface-200 px-4 py-2.5 text-sm font-semibold text-surface-600 transition-colors hover:bg-surface-50"
          >
            {currentIdx > 0 ? 'Précédent' : 'Annuler'}
          </button>
          {!isLast ? (
            <button
              onClick={() => setSection(sectionOrder[currentIdx + 1])}
              disabled={!canGoNext}
              className="flex-1 rounded-xl bg-brand-500 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-600 disabled:opacity-40"
            >
              Suivant
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={!form.name.trim() || !paid}
              className="flex-1 rounded-xl bg-brand-500 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-600 disabled:opacity-40"
            >
              {paid ? 'Créer le restaurant' : 'En attente du paiement'}
            </button>
          )}
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
  const router = useRouter();
  const statusCfg = STATUS_CONFIG[restaurant.status];
  const paymentCfg = PAYMENT_STATUS_CONFIG[restaurant.paymentStatus];

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

          {/* Plan + payment info */}
          <div className="flex flex-wrap items-center gap-2">
            <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${ABONNEMENT_COLORS[restaurant.abonnement]}`}>
              {restaurant.abonnement}
            </span>
            <span className="rounded-full bg-orange-50 px-2.5 py-1 text-xs font-semibold text-orange-600 border border-orange-100">
              {restaurant.abonnementMontant}€/mois
            </span>
            <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${paymentCfg.className}`}>
              {paymentCfg.label} {paymentCfg.icon}
            </span>
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

          {/* Hours */}
          <div className="flex items-center justify-end">
            <div className="flex items-center gap-1 text-xs text-surface-500">
              <Clock className="h-3.5 w-3.5" />
              {restaurant.openTime} – {restaurant.closeTime}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={() => router.push(`/dashboard/restaurants/${restaurant.id}`)}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-brand-500 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-600"
            >
              <Store className="h-4 w-4" />
              Gérer
            </button>
            <button
              onClick={onOpenDetail}
              className="flex items-center justify-center rounded-xl border border-surface-200 px-3 py-2.5 text-surface-500 hover:bg-surface-50 transition-colors"
              title="Infos CRM"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

// ── Owner single-restaurant view ──────────────────────────────────────────────

function OwnerView({ restaurant, onUpdate }: { restaurant: Restaurant; onUpdate: (r: Restaurant) => void }) {
  const [selected, setSelected] = useState(false);
  return selected ? (
    <RestaurantDetailPage
      restaurant={restaurant}
      onClose={() => setSelected(false)}
      onUpdate={onUpdate}
    />
  ) : (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold text-surface-900">Mon restaurant</h1>
        <p className="mt-1 text-sm text-surface-500">Vue propriétaire</p>
      </div>
      <div className="max-w-sm">
        <RestaurantCard restaurant={restaurant} onOpenDetail={() => setSelected(true)} />
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

interface ApiRestaurant {
  id: string;
  name: string;
  street: string;
  city: string;
  postalCode: string;
  phone: string;
  email: string;
  isActive: boolean;
  isOpen: boolean;
  siret?: string;
  rating?: number;
  cuisine?: string | null;
}

function mergeApiRestaurant(api: ApiRestaurant): Restaurant {
  const address = `${api.street}, ${api.postalCode} ${api.city}`;
  const initials = api.name.split(' ').map((w) => w[0] ?? '').join('').toUpperCase().slice(0, 2);
  return {
    id: api.id,
    name: api.name,
    address,
    adresseFacturation: address,
    cuisine: api.cuisine ?? 'N/A',
    status: api.isOpen ? 'open' : ('paused' as RestaurantStatus),
    crmStatus: api.isActive ? 'actif' : ('pause' as CRMStatus),
    paymentStatus: 'ok',
    ordersToday: 0,
    revenue: 0,
    openTime: '11:00',
    closeTime: '23:00',
    image: initials,
    color: '#6366f1',
    raisonSociale: api.name,
    siret: api.siret ?? '',
    dirigeant: { name: '', email: api.email, tel: api.phone },
    comptable: { name: '', email: '', tel: '' },
    abonnement: 'Starter',
    abonnementMontant: 0,
    commission: 0,
    history: [],
    documents: REQUIRED_DOCS.map((d) => ({ name: d, status: 'manquant' })),
  };
}

export default function RestaurantsPage() {
  const authUser = useAuthStore((s) => s.user);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [showModal, setShowModal]     = useState(false);
  const [detailId, setDetailId]       = useState<string | null>(null);
  const [search, setSearch]           = useState('');
  const [crmFilter, setCrmFilter]     = useState<CRMStatus | 'all'>('all');

  // Use real auth role; fall back to cookie for demo/dev mode
  const [cookieRole, setCookieRole] = useState<string>('manager');
  useEffect(() => { if (!authUser) setCookieRole(parseCookie('fs_demo') ?? 'manager'); }, [authUser]);
  const role = authUser
    ? (authUser.role === 'restaurant_owner' ? 'owner' : authUser.role === 'super_admin' ? 'admin' : 'manager')
    : cookieRole;

  useEffect(() => {
    (api.get('/restaurants') as Promise<ApiRestaurant[]>)
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setRestaurants(data.map(mergeApiRestaurant));
        }
      })
      .catch(() => {});
  }, []);

  const filtered = useMemo(() => restaurants.filter(r => {
    if (crmFilter !== 'all' && r.crmStatus !== crmFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return r.name.toLowerCase().includes(q) || r.raisonSociale.toLowerCase().includes(q) || r.siret.includes(q);
    }
    return true;
  }), [restaurants, search, crmFilter]);

  const actifCount       = restaurants.filter(r => r.crmStatus === 'actif').length;
  const negocCount       = restaurants.filter(r => r.crmStatus === 'négociation').length;
  const mrrTotal         = restaurants.filter(r => r.crmStatus === 'actif').reduce((s, r) => s + r.abonnementMontant, 0);
  const churnedThisMonth = restaurants.filter(r => r.crmStatus === 'churned').length;

  const detailRestaurant = restaurants.find(r => r.id === detailId) ?? null;

  function updateRestaurant(updated: Restaurant) {
    setRestaurants(prev => prev.map(r => r.id === updated.id ? updated : r));
  }

  // Owner view — single restaurant
  if (role === 'owner') {
    if (restaurants.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-24 space-y-4 px-6">
          <Store className="h-12 w-12 text-gray-300" />
          <p className="text-lg font-semibold text-gray-600">Aucun restaurant trouvé</p>
          <p className="text-sm text-gray-400 text-center max-w-xs">
            Votre restaurant n&apos;a pas encore été configuré ou est en cours de chargement.
          </p>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-600"
          >
            <Plus className="h-4 w-4" />
            Créer mon restaurant
          </button>
          <AnimatePresence>
            {showModal && (
              <AddRestaurantModal
                onClose={() => setShowModal(false)}
                onAdd={r => setRestaurants(prev => [...prev, r])}
              />
            )}
          </AnimatePresence>
        </div>
      );
    }
    return (
      <OwnerView
        restaurant={restaurants[0]}
        onUpdate={r => setRestaurants(prev => prev.map(x => x.id === r.id ? r : x))}
      />
    );
  }

  // Detail full-page view
  if (detailRestaurant) {
    return (
      <RestaurantDetailPage
        restaurant={detailRestaurant}
        onClose={() => setDetailId(null)}
        onUpdate={updated => {
          updateRestaurant(updated);
          // Keep detail open with updated data — detailId stays set
        }}
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
          { label: 'Actifs',          value: String(actifCount),       icon: Store,        iconColor: 'text-green-600', iconBg: 'bg-green-50'  },
          { label: 'En négociation',  value: String(negocCount),       icon: TrendingUp,   iconColor: 'text-blue-600',  iconBg: 'bg-blue-50'   },
          { label: 'MRR total',       value: `${mrrTotal} €`,          icon: Euro,         iconColor: 'text-brand-600', iconBg: 'bg-brand-50'  },
          { label: 'Churned (30j)',   value: String(churnedThisMonth), icon: TrendingDown, iconColor: 'text-red-500',   iconBg: 'bg-red-50'    },
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

      {/* Add modal */}
      <AnimatePresence>
        {showModal && (
          <AddRestaurantModal
            onClose={() => setShowModal(false)}
            onAdd={r => setRestaurants(prev => [...prev, r])}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
