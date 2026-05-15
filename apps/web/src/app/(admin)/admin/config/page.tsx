'use client';

import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Settings, Building2, CreditCard, Webhook, Key, Mail, ToggleLeft,
  Upload, Plus, Trash2, Eye, EyeOff, Send, CheckCircle2, XCircle,
  ChevronDown, Edit2, Check, X, Copy, AlertTriangle,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';

// ── Types ─────────────────────────────────────────────────────────────────────

type Tab = 'plateforme' | 'plans' | 'webhooks' | 'apikeys' | 'smtp' | 'flags';

interface WebhookEntry {
  id: string;
  url: string;
  events: string[];
  lastTriggered: string;
  active: boolean;
}

interface ApiKey {
  id: string;
  name: string;
  prefix: string;
  created: string;
  lastUsed: string;
  permissions: string[];
  revoked: boolean;
}

interface Plan {
  id: string;
  name: string;
  price: number;
  period: string;
  features: string[];
  active: boolean;
  color: string;
  bg: string;
  border: string;
}

interface FeatureFlag {
  id: string;
  label: string;
  description: string;
  enabled: boolean;
}

// ── Demo data ─────────────────────────────────────────────────────────────────

const WEBHOOK_EVENTS = [
  'order.created',
  'order.updated',
  'payment.succeeded',
  'payment.failed',
];

const initWebhooks: WebhookEntry[] = [
  { id: 'wh1', url: 'https://api.partner.com/hooks/foodstack', events: ['order.created', 'payment.succeeded'], lastTriggered: '15 mai 2026 09:12', active: true },
  { id: 'wh2', url: 'https://erp.example.io/webhook', events: ['order.updated', 'payment.failed'], lastTriggered: '14 mai 2026 17:44', active: false },
];

const initApiKeys: ApiKey[] = [
  { id: 'k1', name: 'Production App', prefix: 'fsk_live_a3Kx...', created: '1 jan 2026', lastUsed: '15 mai 2026', permissions: ['read', 'write'], revoked: false },
  { id: 'k2', name: 'Analytics Dashboard', prefix: 'fsk_live_b7Qm...', created: '12 fév 2026', lastUsed: '10 mai 2026', permissions: ['read'], revoked: false },
  { id: 'k3', name: 'Old Integration', prefix: 'fsk_live_c2Rp...', created: '5 déc 2025', lastUsed: '1 mars 2026', permissions: ['read', 'write', 'admin'], revoked: true },
];

const initPlans: Plan[] = [
  {
    id: 'starter', name: 'Starter', price: 49, period: '/mois',
    features: ['1 emplacement', 'Menu en ligne', 'Commandes basiques', 'Support email'],
    active: true,
    color: 'text-surface-700', bg: 'bg-surface-50', border: 'border-surface-200',
  },
  {
    id: 'pro', name: 'Pro', price: 99, period: '/mois',
    features: ['3 emplacements', 'Analytics avancés', 'Livraison intégrée', 'Support prioritaire'],
    active: true,
    color: 'text-brand-600', bg: 'bg-brand-500/5', border: 'border-brand-500/30',
  },
  {
    id: 'enterprise', name: 'Enterprise', price: 299, period: '/mois',
    features: ['Illimité', 'API complète', 'SLA 99.9%', 'Account manager dédié'],
    active: true,
    color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-200',
  },
];

const initFlags: FeatureFlag[] = [
  { id: 'mobile_pay', label: 'Paiement mobile', description: 'Activer Apple Pay et Google Pay sur les commandes', enabled: true },
  { id: '2fa', label: '2FA obligatoire', description: 'Forcer l\'authentification à deux facteurs pour tous les admins', enabled: false },
  { id: 'maintenance', label: 'Mode maintenance', description: 'Afficher une page de maintenance aux utilisateurs finaux', enabled: false },
  { id: 'new_restaurants', label: 'Nouveaux restaurants', description: 'Permettre l\'inscription de nouveaux restaurants', enabled: true },
  { id: 'advanced_analytics', label: 'Analytics avancées', description: 'Activer les tableaux de bord analytics premium', enabled: true },
];

// ── Toast ─────────────────────────────────────────────────────────────────────

function useToast() {
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const show = useCallback((msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }, []);
  return { toast, show };
}

function Toast({ msg, type }: { msg: string; type: 'success' | 'error' }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 40 }}
      className={`fixed bottom-6 left-1/2 z-[100] -translate-x-1/2 flex items-center gap-2 rounded-2xl px-5 py-3 text-sm font-medium shadow-lg ${
        type === 'success' ? 'bg-brand-500 text-black' : 'bg-red-500 text-white'
      }`}
    >
      {type === 'success' ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
      {msg}
    </motion.div>
  );
}

// ── Tab nav ───────────────────────────────────────────────────────────────────

const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: 'plateforme', label: 'Plateforme',    icon: <Building2 className="h-4 w-4" /> },
  { id: 'plans',      label: 'Plans & tarifs', icon: <CreditCard className="h-4 w-4" /> },
  { id: 'webhooks',   label: 'Webhooks',      icon: <Webhook className="h-4 w-4" /> },
  { id: 'apikeys',    label: 'Clés API',      icon: <Key className="h-4 w-4" /> },
  { id: 'smtp',       label: 'SMTP / Email',  icon: <Mail className="h-4 w-4" /> },
  { id: 'flags',      label: 'Feature flags', icon: <ToggleLeft className="h-4 w-4" /> },
];

// ══════════════════════════════════════════════════════════════════════════════
// Section: Plateforme
// ══════════════════════════════════════════════════════════════════════════════

function SectionPlateforme({ show }: { show: (msg: string) => void }) {
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setLogoPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  }

  return (
    <div className="space-y-6">
      {/* Company identity */}
      <Card padding="lg">
        <CardHeader>
          <CardTitle>Identité de l'entreprise</CardTitle>
          <CardDescription>Informations légales et de contact de FoodStack</CardDescription>
        </CardHeader>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Nom de la société" defaultValue="FoodStack" />
          <Input label="SIRET" defaultValue="88293847200041" />
          <Input label="Adresse" defaultValue="12 rue de la Paix, 75001 Paris" className="sm:col-span-2" />
          <Input label="Email support" type="email" defaultValue="support@foodstack.io" />
          <Input label="Téléphone support" type="tel" defaultValue="+33 1 23 45 67 89" />
        </div>
      </Card>

      {/* Branding */}
      <Card padding="lg">
        <CardHeader>
          <CardTitle>Branding</CardTitle>
          <CardDescription>Logo, couleur principale et tagline</CardDescription>
        </CardHeader>
        <div className="space-y-5">
          {/* Logo upload */}
          <div>
            <p className="mb-2 text-sm font-medium text-surface-700">Logo</p>
            <div className="flex items-center gap-4">
              <div
                className="flex h-20 w-20 items-center justify-center rounded-2xl border-2 border-dashed border-surface-200 bg-surface-50 overflow-hidden cursor-pointer hover:border-brand-400 transition-colors"
                onClick={() => fileRef.current?.click()}
              >
                {logoPreview ? (
                  <img src={logoPreview} alt="Logo" className="h-full w-full object-contain" />
                ) : (
                  <Upload className="h-7 w-7 text-surface-400" />
                )}
              </div>
              <div>
                <Button size="sm" variant="ghost" onClick={() => fileRef.current?.click()} icon={<Upload className="h-3.5 w-3.5" />}>
                  Importer un logo
                </Button>
                <p className="mt-1 text-xs text-surface-400">PNG, SVG, WebP — max 2 Mo</p>
              </div>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {/* Color */}
            <div>
              <p className="mb-2 text-sm font-medium text-surface-700">Couleur principale</p>
              <div className="flex items-center gap-3">
                <input type="color" defaultValue="#1EFF6A" className="h-10 w-16 cursor-pointer rounded-xl border border-surface-200 bg-white p-0.5" />
                <Input defaultValue="#1EFF6A" className="font-mono text-sm" />
              </div>
            </div>
            <Input label="Tagline" defaultValue="La plateforme pour les restaurants modernes" />
          </div>
        </div>
      </Card>

      <div className="flex justify-end">
        <Button onClick={() => show('Configuration sauvegardée')}>Enregistrer</Button>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// Section: Plans & tarifs
// ══════════════════════════════════════════════════════════════════════════════

function SectionPlans({ show }: { show: (msg: string) => void }) {
  const [plans, setPlans] = useState<Plan[]>(initPlans);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editPrice, setEditPrice] = useState('');

  function startEdit(plan: Plan) {
    setEditingId(plan.id);
    setEditPrice(String(plan.price));
  }

  function commitEdit(id: string) {
    const val = parseInt(editPrice, 10);
    if (!isNaN(val) && val > 0) {
      setPlans(prev => prev.map(p => p.id === id ? { ...p, price: val } : p));
      show('Tarif mis à jour');
    }
    setEditingId(null);
  }

  function toggleActive(id: string) {
    setPlans(prev => prev.map(p => p.id === id ? { ...p, active: !p.active } : p));
  }

  return (
    <div className="space-y-5">
      {plans.map((plan) => (
        <Card key={plan.id} padding="lg">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className={`rounded-xl border px-4 py-2 ${plan.bg} ${plan.border}`}>
                <span className={`font-bold ${plan.color}`}>{plan.name}</span>
              </div>
              {/* Inline price edit */}
              <div className="flex items-center gap-2">
                {editingId === plan.id ? (
                  <>
                    <input
                      type="number"
                      value={editPrice}
                      onChange={e => setEditPrice(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') commitEdit(plan.id); if (e.key === 'Escape') setEditingId(null); }}
                      className="h-9 w-24 rounded-lg border border-brand-400 px-2 text-sm font-bold text-surface-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                      autoFocus
                    />
                    <span className="text-surface-400 text-sm">{plan.period}</span>
                    <button onClick={() => commitEdit(plan.id)} className="text-brand-500 hover:text-brand-600"><Check className="h-4 w-4" /></button>
                    <button onClick={() => setEditingId(null)} className="text-surface-400 hover:text-surface-600"><X className="h-4 w-4" /></button>
                  </>
                ) : (
                  <button
                    onClick={() => startEdit(plan)}
                    className="flex items-center gap-1.5 group"
                  >
                    <span className="text-2xl font-extrabold text-surface-900">{plan.price}€</span>
                    <span className="text-sm text-surface-400">{plan.period}</span>
                    <Edit2 className="h-3.5 w-3.5 text-surface-300 group-hover:text-brand-500 transition-colors" />
                  </button>
                )}
              </div>
            </div>
            {/* Active toggle */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-surface-500">{plan.active ? 'Actif' : 'Inactif'}</span>
              <button
                onClick={() => toggleActive(plan.id)}
                className={`relative h-6 w-11 rounded-full transition-colors ${plan.active ? 'bg-brand-500' : 'bg-surface-200'}`}
              >
                <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${plan.active ? 'translate-x-5' : 'translate-x-0.5'}`} />
              </button>
            </div>
          </div>

          <div className="mt-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-surface-500">Fonctionnalités</p>
            <ul className="grid gap-1.5 sm:grid-cols-2">
              {plan.features.map(f => (
                <li key={f} className="flex items-center gap-2 text-sm text-surface-600">
                  <CheckCircle2 className="h-3.5 w-3.5 flex-shrink-0 text-green-500" />
                  {f}
                </li>
              ))}
            </ul>
          </div>
        </Card>
      ))}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// Section: Webhooks
// ══════════════════════════════════════════════════════════════════════════════

function SectionWebhooks({ show }: { show: (msg: string, type?: 'success' | 'error') => void }) {
  const [webhooks, setWebhooks] = useState<WebhookEntry[]>(initWebhooks);
  const [modalOpen, setModalOpen] = useState(false);
  const [newUrl, setNewUrl] = useState('');
  const [newEvents, setNewEvents] = useState<string[]>([]);

  function addWebhook() {
    if (!newUrl) return;
    const entry: WebhookEntry = {
      id: `wh${Date.now()}`,
      url: newUrl,
      events: newEvents,
      lastTriggered: '—',
      active: true,
    };
    setWebhooks(prev => [...prev, entry]);
    setModalOpen(false);
    setNewUrl('');
    setNewEvents([]);
    show('Webhook ajouté');
  }

  function toggleEvent(ev: string) {
    setNewEvents(prev => prev.includes(ev) ? prev.filter(e => e !== ev) : [...prev, ev]);
  }

  function toggleWebhook(id: string) {
    setWebhooks(prev => prev.map(w => w.id === id ? { ...w, active: !w.active } : w));
  }

  function deleteWebhook(id: string) {
    setWebhooks(prev => prev.filter(w => w.id !== id));
    show('Webhook supprimé');
  }

  function testWebhook(url: string) {
    show(`Test envoyé à ${url.slice(0, 30)}…`);
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button size="sm" icon={<Plus className="h-4 w-4" />} onClick={() => setModalOpen(true)}>
          Ajouter un webhook
        </Button>
      </div>

      <Card padding="none">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-surface-100">
                {['URL', 'Événements', 'Dernier déclenchement', 'Statut', 'Actions'].map(h => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-surface-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-100">
              {webhooks.map(wh => (
                <tr key={wh.id} className="hover:bg-surface-50 transition-colors">
                  <td className="px-5 py-4 font-mono text-xs text-surface-700 max-w-[200px] truncate">{wh.url}</td>
                  <td className="px-5 py-4">
                    <div className="flex flex-wrap gap-1">
                      {wh.events.map(ev => (
                        <span key={ev} className="rounded bg-surface-100 px-1.5 py-0.5 text-xs text-surface-600 font-mono">{ev}</span>
                      ))}
                    </div>
                  </td>
                  <td className="px-5 py-4 text-surface-500">{wh.lastTriggered}</td>
                  <td className="px-5 py-4">
                    <button
                      onClick={() => toggleWebhook(wh.id)}
                      className={`relative h-5 w-9 rounded-full transition-colors ${wh.active ? 'bg-brand-500' : 'bg-surface-200'}`}
                    >
                      <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${wh.active ? 'translate-x-4' : 'translate-x-0.5'}`} />
                    </button>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <button onClick={() => testWebhook(wh.url)} className="text-xs text-brand-600 hover:underline font-medium">Tester</button>
                      <button onClick={() => deleteWebhook(wh.id)} className="text-red-400 hover:text-red-600 transition-colors">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Nouveau webhook"
        description="Configurez l'URL et les événements déclencheurs"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="ghost" size="sm" onClick={() => setModalOpen(false)}>Annuler</Button>
            <Button size="sm" onClick={addWebhook}>Ajouter</Button>
          </div>
        }
      >
        <div className="space-y-4">
          <Input label="URL" placeholder="https://votre-serveur.com/hook" value={newUrl} onChange={e => setNewUrl(e.target.value)} />
          <div>
            <p className="mb-2 text-sm font-medium text-surface-700">Événements</p>
            <div className="space-y-2">
              {WEBHOOK_EVENTS.map(ev => (
                <label key={ev} className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newEvents.includes(ev)}
                    onChange={() => toggleEvent(ev)}
                    className="h-4 w-4 rounded border-surface-300 accent-brand-500"
                  />
                  <span className="font-mono text-sm text-surface-700">{ev}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// Section: Clés API
// ══════════════════════════════════════════════════════════════════════════════

function SectionApiKeys({ show }: { show: (msg: string) => void }) {
  const [keys, setKeys] = useState<ApiKey[]>(initApiKeys);
  const [newKey, setNewKey] = useState<string | null>(null);
  const [showNewKey, setShowNewKey] = useState(true);
  const [genModalOpen, setGenModalOpen] = useState(false);
  const [keyName, setKeyName] = useState('');
  const [keyPerms, setKeyPerms] = useState<string[]>(['read']);

  function generateKey() {
    const fake = `fsk_live_${Math.random().toString(36).slice(2, 14)}`;
    const entry: ApiKey = {
      id: `k${Date.now()}`,
      name: keyName || 'Nouvelle clé',
      prefix: fake.slice(0, 18) + '...',
      created: '15 mai 2026',
      lastUsed: '—',
      permissions: keyPerms,
      revoked: false,
    };
    setKeys(prev => [...prev, entry]);
    setNewKey(fake);
    setShowNewKey(true);
    setGenModalOpen(false);
    setKeyName('');
  }

  function revokeKey(id: string) {
    setKeys(prev => prev.map(k => k.id === id ? { ...k, revoked: true } : k));
    show('Clé révoquée');
  }

  function copyKey() {
    if (newKey) navigator.clipboard.writeText(newKey);
    show('Clé copiée dans le presse-papiers');
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button size="sm" icon={<Plus className="h-4 w-4" />} onClick={() => setGenModalOpen(true)}>
          Générer une clé
        </Button>
      </div>

      {/* New key reveal banner */}
      <AnimatePresence>
        {newKey && showNewKey && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="flex items-center gap-3 rounded-2xl border border-brand-300 bg-brand-50 px-4 py-3"
          >
            <AlertTriangle className="h-4 w-4 text-brand-600 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-brand-700 mb-0.5">Copiez cette clé maintenant — elle ne sera plus visible.</p>
              <code className="text-xs font-mono text-brand-900 break-all">{newKey}</code>
            </div>
            <button onClick={copyKey} className="flex-shrink-0 text-brand-600 hover:text-brand-800 transition-colors"><Copy className="h-4 w-4" /></button>
            <button onClick={() => setShowNewKey(false)} className="flex-shrink-0 text-brand-400 hover:text-brand-600 transition-colors"><X className="h-4 w-4" /></button>
          </motion.div>
        )}
      </AnimatePresence>

      <Card padding="none">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-surface-100">
                {['Nom', 'Préfixe', 'Créée le', 'Dernière utilisation', 'Permissions', 'Actions'].map(h => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-surface-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-100">
              {keys.map(k => (
                <tr key={k.id} className={`hover:bg-surface-50 transition-colors ${k.revoked ? 'opacity-50' : ''}`}>
                  <td className="px-5 py-4 font-medium text-surface-900">{k.name}</td>
                  <td className="px-5 py-4 font-mono text-xs text-surface-600">{k.prefix}</td>
                  <td className="px-5 py-4 text-surface-500">{k.created}</td>
                  <td className="px-5 py-4 text-surface-500">{k.lastUsed}</td>
                  <td className="px-5 py-4">
                    <div className="flex flex-wrap gap-1">
                      {k.permissions.map(p => (
                        <Badge key={p} variant={p === 'admin' ? 'danger' : p === 'write' ? 'brand' : 'default'} size="sm">{p}</Badge>
                      ))}
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    {k.revoked ? (
                      <span className="text-xs text-red-400 font-medium">Révoquée</span>
                    ) : (
                      <button onClick={() => revokeKey(k.id)} className="text-xs text-red-500 hover:text-red-700 font-medium hover:underline">Révoquer</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal
        open={genModalOpen}
        onClose={() => setGenModalOpen(false)}
        title="Générer une clé API"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="ghost" size="sm" onClick={() => setGenModalOpen(false)}>Annuler</Button>
            <Button size="sm" onClick={generateKey}>Générer</Button>
          </div>
        }
      >
        <div className="space-y-4">
          <Input label="Nom de la clé" placeholder="ex: Production App" value={keyName} onChange={e => setKeyName(e.target.value)} />
          <div>
            <p className="mb-2 text-sm font-medium text-surface-700">Permissions</p>
            <div className="space-y-2">
              {['read', 'write', 'admin'].map(p => (
                <label key={p} className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={keyPerms.includes(p)}
                    onChange={() => setKeyPerms(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p])}
                    className="h-4 w-4 rounded border-surface-300 accent-brand-500"
                  />
                  <span className="text-sm text-surface-700 capitalize">{p}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// Section: SMTP
// ══════════════════════════════════════════════════════════════════════════════

function SectionSmtp({ show }: { show: (msg: string) => void }) {
  const [tls, setTls] = useState(true);

  return (
    <div className="space-y-6">
      <Card padding="lg">
        <CardHeader>
          <CardTitle>Configuration SMTP</CardTitle>
          <CardDescription>Serveur de messagerie sortant pour les emails transactionnels</CardDescription>
        </CardHeader>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Hôte SMTP" defaultValue="smtp.resend.com" />
          <Input label="Port" type="number" defaultValue="587" />
          <Input label="Utilisateur" defaultValue="apikey" />
          <Input label="Mot de passe" type="password" defaultValue="re_xxxxxxxxxxxx" />
          <Input label="Adresse From" type="email" defaultValue="noreply@foodstack.io" />
          <div className="flex items-center gap-3 self-end pb-0.5">
            <span className="text-sm font-medium text-surface-700">TLS</span>
            <button
              onClick={() => setTls(v => !v)}
              className={`relative h-6 w-11 rounded-full transition-colors ${tls ? 'bg-brand-500' : 'bg-surface-200'}`}
            >
              <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${tls ? 'translate-x-5' : 'translate-x-0.5'}`} />
            </button>
            <span className="text-sm text-surface-500">{tls ? 'Activé' : 'Désactivé'}</span>
          </div>
        </div>
      </Card>

      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          icon={<Send className="h-4 w-4" />}
          onClick={() => show('Email de test envoyé')}
        >
          Tester la configuration
        </Button>
        <Button onClick={() => show('Configuration SMTP sauvegardée')}>Enregistrer</Button>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// Section: Feature flags
// ══════════════════════════════════════════════════════════════════════════════

function SectionFlags({ show }: { show: (msg: string) => void }) {
  const [flags, setFlags] = useState<FeatureFlag[]>(initFlags);

  function toggle(id: string) {
    setFlags(prev => prev.map(f => {
      if (f.id !== id) return f;
      const next = { ...f, enabled: !f.enabled };
      show(`${next.label} ${next.enabled ? 'activé' : 'désactivé'}`);
      return next;
    }));
  }

  return (
    <Card padding="none">
      <div className="divide-y divide-surface-100">
        {flags.map(flag => (
          <div key={flag.id} className="flex items-center justify-between px-6 py-4 hover:bg-surface-50 transition-colors">
            <div className="flex-1 min-w-0 pr-6">
              <p className="font-medium text-surface-900">{flag.label}</p>
              <p className="mt-0.5 text-sm text-surface-500">{flag.description}</p>
            </div>
            <button
              onClick={() => toggle(flag.id)}
              className={`relative flex-shrink-0 h-6 w-11 rounded-full transition-colors ${flag.enabled ? 'bg-brand-500' : 'bg-surface-200'}`}
            >
              <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${flag.enabled ? 'translate-x-5' : 'translate-x-0.5'}`} />
            </button>
          </div>
        ))}
      </div>
    </Card>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// Page
// ══════════════════════════════════════════════════════════════════════════════

export default function AdminConfigPage() {
  const [activeTab, setActiveTab] = useState<Tab>('plateforme');
  const { toast, show } = useToast();

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-surface-900">Configuration</h1>
        <p className="mt-1 text-sm text-surface-500">Paramétrage global de la plateforme FoodStack</p>
      </div>

      {/* Tab bar */}
      <div className="flex flex-wrap gap-1 rounded-2xl border border-surface-100 bg-surface-50 p-1.5">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all ${
              activeTab === tab.id
                ? 'bg-white text-surface-900 shadow-sm'
                : 'text-surface-500 hover:text-surface-700'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.15 }}
        >
          {activeTab === 'plateforme' && <SectionPlateforme show={show} />}
          {activeTab === 'plans'      && <SectionPlans show={show} />}
          {activeTab === 'webhooks'   && <SectionWebhooks show={show} />}
          {activeTab === 'apikeys'    && <SectionApiKeys show={show} />}
          {activeTab === 'smtp'       && <SectionSmtp show={show} />}
          {activeTab === 'flags'      && <SectionFlags show={show} />}
        </motion.div>
      </AnimatePresence>

      {/* Toast */}
      <AnimatePresence>
        {toast && <Toast msg={toast.msg} type={toast.type} />}
      </AnimatePresence>
    </div>
  );
}
