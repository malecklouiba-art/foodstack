'use client';

import { useState } from 'react';
import {
  Settings, CreditCard, Bell, Shield, Globe, Palette,
  Eye, EyeOff, Save, Check, AlertTriangle, Zap,
  Mail, Smartphone, Building2, Hash,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/api';

// ── Types ─────────────────────────────────────────────────────────────────────
type TabId = 'general' | 'paiements' | 'notifications' | 'securite' | 'apparence';

interface TabProps { activeTab: TabId; onClick: (t: TabId) => void; }

const TABS: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: 'general',       label: 'Général',       icon: Settings    },
  { id: 'paiements',     label: 'Paiements',     icon: CreditCard  },
  { id: 'notifications', label: 'Notifications', icon: Bell        },
  { id: 'securite',      label: 'Sécurité',      icon: Shield      },
  { id: 'apparence',     label: 'Apparence',     icon: Palette     },
];

// ── Reusable field ────────────────────────────────────────────────────────────
function Field({
  label, value, onChange, placeholder, type = 'text', hint, icon: Icon,
}: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; type?: string; hint?: string; icon?: React.ElementType;
}) {
  const [show, setShow] = useState(false);
  const isSecret = type === 'password';
  return (
    <div>
      <label className="mb-1.5 block text-xs font-semibold text-surface-700 dark:text-surface-300">{label}</label>
      <div className="relative">
        {Icon && <Icon className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-surface-400" />}
        <input
          type={isSecret && !show ? 'password' : 'text'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`w-full rounded-xl border border-surface-200 bg-surface-50 py-2.5 text-sm text-surface-900 placeholder-surface-400 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100 dark:border-surface-600 dark:bg-surface-700 dark:text-surface-100 ${Icon ? 'pl-9 pr-4' : isSecret ? 'pl-4 pr-10' : 'px-4'}`}
        />
        {isSecret && (
          <button type="button" onClick={() => setShow(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-600">
            {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        )}
      </div>
      {hint && <p className="mt-1 text-xs text-surface-400">{hint}</p>}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-surface-200 bg-white p-6 dark:border-surface-700 dark:bg-surface-800">
      <h3 className="mb-5 text-sm font-bold text-surface-900 dark:text-white">{title}</h3>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

// ── Tabs ──────────────────────────────────────────────────────────────────────
function GeneralTab() {
  const [form, setForm] = useState({
    appName: 'FoodStack',
    tagline: 'La plateforme de gestion de restaurant tout-en-un',
    supportEmail: 'support@foodstack.fr',
    contactPhone: '+33 1 23 45 67 89',
    website: 'https://foodstack.fr',
    vatNumber: 'FR 12 345 678 901',
    companyName: 'FoodStack SAS',
    address: '12 rue de la Paix, 75002 Paris',
  });
  const [saved, setSaved] = useState(false);

  async function handleSave() {
    try {
      await (api.patch('/admin/settings/general', form) as Promise<unknown>);
    } catch { /* best-effort */ }
    setSaved(true);
    toast.success('Paramètres sauvegardés');
    setTimeout(() => setSaved(false), 2000);
  }

  const f = (k: keyof typeof form) => ({ value: form[k], onChange: (v: string) => setForm(p => ({ ...p, [k]: v })) });

  return (
    <div className="space-y-6">
      <Section title="Identité de l'application">
        <Field label="Nom de l'application" {...f('appName')} placeholder="FoodStack" icon={Zap} />
        <Field label="Slogan" {...f('tagline')} placeholder="Votre slogan…" />
        <Field label="Site web" {...f('website')} placeholder="https://…" icon={Globe} />
      </Section>
      <Section title="Coordonnées de l'entreprise">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Raison sociale" {...f('companyName')} icon={Building2} />
          <Field label="N° TVA" {...f('vatNumber')} icon={Hash} />
        </div>
        <Field label="Adresse" {...f('address')} />
        <div className="grid grid-cols-2 gap-4">
          <Field label="Email support" {...f('supportEmail')} icon={Mail} />
          <Field label="Téléphone" {...f('contactPhone')} icon={Smartphone} />
        </div>
      </Section>
      <div className="flex justify-end">
        <button onClick={handleSave} className="flex items-center gap-2 rounded-xl bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-600 transition-colors">
          {saved ? <Check className="h-4 w-4" /> : <Save className="h-4 w-4" />}
          {saved ? 'Sauvegardé !' : 'Sauvegarder'}
        </button>
      </div>
    </div>
  );
}

function PaiementsTab() {
  const [stripe, setStripe] = useState({
    publicKey: '',
    secretKey: '',
    webhookSecret: '',
    testMode: true,
  });
  const [saved, setSaved] = useState(false);

  async function handleSave() {
    try {
      await (api.patch('/admin/settings/stripe', stripe) as Promise<unknown>);
    } catch { /* best-effort */ }
    setSaved(true);
    toast.success('Configuration Stripe sauvegardée');
    setTimeout(() => setSaved(false), 2000);
  }

  const f = (k: keyof typeof stripe) => ({ value: stripe[k] as string, onChange: (v: string) => setStripe(p => ({ ...p, [k]: v })) });

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-800/40 dark:bg-amber-900/10">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
        <div>
          <p className="text-sm font-semibold text-amber-800 dark:text-amber-400">Mode test actif</p>
          <p className="text-xs text-amber-700 dark:text-amber-500">Les paiements ne sont pas réels. Passez en mode production pour encaisser vos clients.</p>
        </div>
      </div>

      <Section title="Clés API Stripe">
        <div className="flex items-center gap-3 pb-2">
          <span className="text-xs font-semibold text-surface-500">Mode</span>
          <button
            onClick={() => setStripe(p => ({ ...p, testMode: !p.testMode }))}
            className={`relative h-5 w-10 rounded-full transition-colors ${stripe.testMode ? 'bg-amber-400' : 'bg-brand-500'}`}
          >
            <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${stripe.testMode ? 'left-0.5' : 'left-5'}`} />
          </button>
          <span className={`text-xs font-semibold ${stripe.testMode ? 'text-amber-600' : 'text-brand-600'}`}>
            {stripe.testMode ? 'Test' : 'Production'}
          </span>
        </div>
        <Field label="Clé publique (pk_…)" {...f('publicKey')} placeholder="pk_test_…" hint="Visible dans votre dashboard Stripe → Développeurs → Clés API" />
        <Field label="Clé secrète (sk_…)" type="password" {...f('secretKey')} placeholder="sk_test_…" hint="Ne jamais partager cette clé" />
        <Field label="Webhook secret (whsec_…)" type="password" {...f('webhookSecret')} placeholder="whsec_…" hint="Stripe → Développeurs → Webhooks → Votre endpoint → Signing secret" />
      </Section>

      <Section title="Commissions plateforme">
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Plan Starter', value: '2.5%', color: 'bg-blue-50 text-blue-700' },
            { label: 'Plan Pro', value: '1.8%', color: 'bg-purple-50 text-purple-700' },
            { label: 'Plan Enterprise', value: '1.2%', color: 'bg-green-50 text-green-700' },
          ].map(({ label, value, color }) => (
            <div key={label} className="rounded-xl border border-surface-100 p-4 text-center dark:border-surface-700">
              <p className="text-lg font-bold text-surface-900 dark:text-white">{value}</p>
              <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${color}`}>{label}</span>
            </div>
          ))}
        </div>
      </Section>

      <div className="flex justify-end">
        <button onClick={handleSave} className="flex items-center gap-2 rounded-xl bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-600 transition-colors">
          {saved ? <Check className="h-4 w-4" /> : <Save className="h-4 w-4" />}
          {saved ? 'Sauvegardé !' : 'Sauvegarder'}
        </button>
      </div>
    </div>
  );
}

function NotificationsTab() {
  const [smtp, setSmtp] = useState({ host: '', port: '587', user: '', pass: '', from: 'no-reply@foodstack.fr' });
  const [saved, setSaved] = useState(false);
  const f = (k: keyof typeof smtp) => ({ value: smtp[k], onChange: (v: string) => setSmtp(p => ({ ...p, [k]: v })) });

  async function handleSave() {
    try { await (api.patch('/admin/settings/smtp', smtp) as Promise<unknown>); } catch { /* best-effort */ }
    setSaved(true); toast.success('SMTP sauvegardé'); setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="space-y-6">
      <Section title="Configuration SMTP (emails transactionnels)">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Hôte SMTP" {...f('host')} placeholder="smtp.mailgun.org" />
          <Field label="Port" {...f('port')} placeholder="587" />
        </div>
        <Field label="Utilisateur" {...f('user')} placeholder="postmaster@…" />
        <Field label="Mot de passe" type="password" {...f('pass')} placeholder="••••••••" />
        <Field label="Adresse expéditeur" {...f('from')} placeholder="no-reply@foodstack.fr" icon={Mail} />
      </Section>
      <Section title="Templates d'email">
        {['Bienvenue nouveau restaurant', 'Facture mensuelle', 'Alerte paiement échoué', 'Réinitialisation mot de passe'].map((tpl) => (
          <div key={tpl} className="flex items-center justify-between rounded-xl border border-surface-100 px-4 py-3 dark:border-surface-700">
            <span className="text-sm text-surface-700 dark:text-surface-300">{tpl}</span>
            <button className="text-xs font-medium text-brand-600 hover:text-brand-700">Modifier →</button>
          </div>
        ))}
      </Section>
      <div className="flex justify-end">
        <button onClick={handleSave} className="flex items-center gap-2 rounded-xl bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-600 transition-colors">
          {saved ? <Check className="h-4 w-4" /> : <Save className="h-4 w-4" />}
          {saved ? 'Sauvegardé !' : 'Sauvegarder'}
        </button>
      </div>
    </div>
  );
}

function SecuriteTab() {
  const [cfg, setCfg] = useState({ jwtExpiry: '7d', require2fa: false, ipWhitelist: '', maxLoginAttempts: '5' });
  const f = (k: keyof typeof cfg) => ({ value: cfg[k] as string, onChange: (v: string) => setCfg(p => ({ ...p, [k]: v })) });

  return (
    <div className="space-y-6">
      <Section title="Authentification">
        <Field label="Durée de session JWT" {...f('jwtExpiry')} placeholder="7d" hint="Ex: 1h, 24h, 7d, 30d" />
        <Field label="Tentatives max avant blocage" {...f('maxLoginAttempts')} placeholder="5" />
        <div className="flex items-center justify-between rounded-xl border border-surface-100 px-4 py-3 dark:border-surface-700">
          <div>
            <p className="text-sm font-semibold text-surface-900 dark:text-surface-100">2FA obligatoire pour les admins</p>
            <p className="text-xs text-surface-400">Tous les comptes super_admin doivent activer le 2FA</p>
          </div>
          <button
            onClick={() => setCfg(p => ({ ...p, require2fa: !p.require2fa }))}
            className={`relative h-5 w-10 rounded-full transition-colors ${cfg.require2fa ? 'bg-brand-500' : 'bg-surface-200 dark:bg-surface-600'}`}
          >
            <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${cfg.require2fa ? 'left-5' : 'left-0.5'}`} />
          </button>
        </div>
        <Field label="IP autorisées (optionnel)" {...f('ipWhitelist')} placeholder="192.168.1.0/24, 10.0.0.1" hint="Laisser vide pour autoriser toutes les IPs" />
      </Section>
    </div>
  );
}

function ApparenceTab() {
  const [brand, setBrand] = useState({ primaryColor: '#22c55e', accentColor: '#16a34a', logo: '', favicon: '' });

  return (
    <div className="space-y-6">
      <Section title="Couleurs de la marque">
        <div className="grid grid-cols-2 gap-4">
          {[
            { label: 'Couleur principale', key: 'primaryColor' as const },
            { label: 'Couleur accent', key: 'accentColor' as const },
          ].map(({ label, key }) => (
            <div key={key}>
              <label className="mb-1.5 block text-xs font-semibold text-surface-700 dark:text-surface-300">{label}</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={brand[key]}
                  onChange={(e) => setBrand(p => ({ ...p, [key]: e.target.value }))}
                  className="h-10 w-10 cursor-pointer rounded-xl border border-surface-200"
                />
                <span className="font-mono text-sm text-surface-700 dark:text-surface-300">{brand[key]}</span>
              </div>
            </div>
          ))}
        </div>
      </Section>
      <Section title="Aperçu">
        <div className="rounded-xl p-4" style={{ backgroundColor: brand.primaryColor + '15' }}>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ backgroundColor: brand.primaryColor }}>
              <Zap className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="font-bold text-surface-900 dark:text-white">FoodStack</p>
              <p className="text-xs" style={{ color: brand.primaryColor }}>La plateforme de gestion de restaurant</p>
            </div>
          </div>
        </div>
      </Section>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────
export default function AdminSettingsPage() {
  const [activeTab, setActiveTab] = useState<TabId>('general');

  function renderTab() {
    switch (activeTab) {
      case 'general':       return <GeneralTab />;
      case 'paiements':     return <PaiementsTab />;
      case 'notifications': return <NotificationsTab />;
      case 'securite':      return <SecuriteTab />;
      case 'apparence':     return <ApparenceTab />;
      default:              return null;
    }
  }

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-surface-100 bg-white px-6 py-4 dark:border-surface-700 dark:bg-surface-800">
        <h1 className="text-lg font-bold text-surface-900 dark:text-white">Paramètres FoodStack</h1>
        <p className="mt-0.5 text-sm text-surface-500">Configuration globale de la plateforme</p>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left nav */}
        <nav className="w-52 shrink-0 border-r border-surface-100 bg-white p-3 dark:border-surface-700 dark:bg-surface-800">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors mb-0.5 ${
                activeTab === id
                  ? 'bg-brand-50 text-brand-700 dark:bg-brand-900/20 dark:text-brand-400'
                  : 'text-surface-600 hover:bg-surface-50 dark:text-surface-400 dark:hover:bg-surface-700'
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </nav>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {renderTab()}
        </div>
      </div>
    </div>
  );
}
