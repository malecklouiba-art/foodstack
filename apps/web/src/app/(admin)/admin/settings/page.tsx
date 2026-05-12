'use client';

import { useState } from 'react';
import {
  Globe, Mail, CreditCard, Shield, Bell, Zap,
  Save, RefreshCw, AlertTriangle, CheckCircle2,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

type Tab = 'general' | 'email' | 'payments' | 'security' | 'notifications' | 'integrations';

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: 'general', label: 'Général', icon: Globe },
  { id: 'email', label: 'Email', icon: Mail },
  { id: 'payments', label: 'Paiements', icon: CreditCard },
  { id: 'security', label: 'Sécurité', icon: Shield },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'integrations', label: 'Intégrations', icon: Zap },
];

function Section({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="border-b border-surface-100 dark:border-surface-800 py-6 last:border-0">
      <div className="mb-4">
        <h3 className="font-semibold text-surface-900 dark:text-surface-50">{title}</h3>
        {description && <p className="mt-0.5 text-sm text-surface-500 dark:text-surface-400">{description}</p>}
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 sm:gap-4 sm:items-start">
      <div>
        <p className="text-sm font-medium text-surface-700 dark:text-surface-300">{label}</p>
        {hint && <p className="text-xs text-surface-400 mt-0.5">{hint}</p>}
      </div>
      <div className="sm:col-span-2">{children}</div>
    </div>
  );
}

function TextInput({ defaultValue, placeholder }: { defaultValue?: string; placeholder?: string }) {
  return (
    <input
      defaultValue={defaultValue}
      placeholder={placeholder}
      className="h-9 w-full rounded-lg border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 px-3 text-sm text-surface-900 dark:text-surface-50 placeholder:text-surface-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
    />
  );
}

function Toggle({ defaultChecked = false, label }: { defaultChecked?: boolean; label?: string }) {
  const [on, setOn] = useState(defaultChecked);
  return (
    <div className="flex items-center gap-3">
      <button
        onClick={() => setOn(!on)}
        className={`relative h-5 w-9 rounded-full transition-colors ${on ? 'bg-brand-500' : 'bg-surface-200 dark:bg-surface-700'}`}
      >
        <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${on ? 'translate-x-4' : 'translate-x-0.5'}`} />
      </button>
      {label && <span className="text-sm text-surface-700 dark:text-surface-300">{label}</span>}
    </div>
  );
}

export default function AdminSettingsPage() {
  const [tab, setTab] = useState<Tab>('general');
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-50">Configuration plateforme</h1>
          <p className="mt-1 text-sm text-surface-500 dark:text-surface-400">Paramètres globaux FoodStack</p>
        </div>
        <Button onClick={handleSave} icon={saved ? <CheckCircle2 className="h-4 w-4" /> : <Save className="h-4 w-4" />}>
          {saved ? 'Sauvegardé !' : 'Sauvegarder'}
        </Button>
      </div>

      <div className="flex gap-6">
        {/* Tab nav */}
        <nav className="w-44 flex-shrink-0 space-y-0.5">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                tab === t.id
                  ? 'bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-400'
                  : 'text-surface-600 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800'
              }`}
            >
              <t.icon className="h-4 w-4" />
              {t.label}
            </button>
          ))}
        </nav>

        {/* Tab content */}
        <div className="flex-1 rounded-2xl border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 p-6">
          {tab === 'general' && (
            <>
              <Section title="Plateforme" description="Informations de base de la plateforme">
                <Field label="Nom de la plateforme"><TextInput defaultValue="FoodStack" /></Field>
                <Field label="URL de base" hint="Utilisée pour les redirections"><TextInput defaultValue="https://foodstack.app" /></Field>
                <Field label="Email de support"><TextInput defaultValue="support@foodstack.app" /></Field>
                <Field label="Langue par défaut">
                  <select className="h-9 w-full rounded-lg border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 px-3 text-sm text-surface-900 dark:text-surface-50 focus:border-brand-500 focus:outline-none">
                    <option value="fr">Français</option>
                    <option value="en">English</option>
                    <option value="es">Español</option>
                  </select>
                </Field>
              </Section>
              <Section title="Maintenance" description="Mode maintenance et accès restreint">
                <Field label="Mode maintenance" hint="Bloque l'accès client"><Toggle /></Field>
                <Field label="Message de maintenance"><TextInput placeholder="Site en maintenance, retour dans quelques minutes…" /></Field>
              </Section>
            </>
          )}

          {tab === 'email' && (
            <>
              <Section title="Configuration SMTP" description="Serveur d'envoi des emails transactionnels">
                <Field label="Provider">
                  <select className="h-9 w-full rounded-lg border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 px-3 text-sm text-surface-900 dark:text-surface-50 focus:border-brand-500 focus:outline-none">
                    <option>Resend</option>
                    <option>SendGrid</option>
                    <option>SMTP custom</option>
                  </select>
                </Field>
                <Field label="Clé API"><TextInput placeholder="re_xxxxxxxxxxxx" /></Field>
                <Field label="Email expéditeur"><TextInput defaultValue="noreply@foodstack.app" /></Field>
                <Field label="Nom expéditeur"><TextInput defaultValue="FoodStack" /></Field>
              </Section>
              <Section title="Templates actifs">
                {[
                  'Confirmation de commande',
                  'Commande livrée',
                  'Réinitialisation mot de passe',
                  'Invitation employé',
                  'Facture mensuelle',
                ].map((t) => (
                  <Field key={t} label={t}><Toggle defaultChecked /></Field>
                ))}
              </Section>
            </>
          )}

          {tab === 'payments' && (
            <>
              <Section title="Stripe" description="Configuration du processeur de paiement">
                <Field label="Publishable key"><TextInput placeholder="pk_live_xxxxxxxxxxxx" /></Field>
                <Field label="Secret key"><TextInput placeholder="sk_live_xxxxxxxxxxxx" /></Field>
                <Field label="Webhook secret"><TextInput placeholder="whsec_xxxxxxxxxxxx" /></Field>
                <Field label="Mode test" hint="Utiliser les clés de test Stripe"><Toggle /></Field>
              </Section>
              <Section title="Commission plateforme">
                <Field label="Taux de commission" hint="% prélevé sur chaque commande">
                  <div className="flex items-center gap-2">
                    <input type="number" defaultValue={3.5} step={0.1} min={0} max={30}
                      className="h-9 w-28 rounded-lg border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 px-3 text-sm text-surface-900 dark:text-surface-50 focus:border-brand-500 focus:outline-none" />
                    <span className="text-sm text-surface-500">%</span>
                  </div>
                </Field>
                <Field label="Frais fixes par commande">
                  <div className="flex items-center gap-2">
                    <input type="number" defaultValue={0.25} step={0.01} min={0}
                      className="h-9 w-28 rounded-lg border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 px-3 text-sm text-surface-900 dark:text-surface-50 focus:border-brand-500 focus:outline-none" />
                    <span className="text-sm text-surface-500">€</span>
                  </div>
                </Field>
              </Section>
            </>
          )}

          {tab === 'security' && (
            <>
              <Section title="Authentification">
                <Field label="Durée de session" hint="En heures">
                  <input type="number" defaultValue={24} className="h-9 w-28 rounded-lg border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 px-3 text-sm text-surface-900 dark:text-surface-50 focus:border-brand-500 focus:outline-none" />
                </Field>
                <Field label="2FA obligatoire" hint="Pour tous les Super Admins"><Toggle defaultChecked /></Field>
                <Field label="Rate limiting" hint="Requêtes max par minute">
                  <input type="number" defaultValue={100} className="h-9 w-28 rounded-lg border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 px-3 text-sm text-surface-900 dark:text-surface-50 focus:border-brand-500 focus:outline-none" />
                </Field>
              </Section>
              <Section title="Logs & Audit">
                <Field label="Conserver les logs" hint="En jours">
                  <input type="number" defaultValue={90} className="h-9 w-28 rounded-lg border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 px-3 text-sm text-surface-900 dark:text-surface-50 focus:border-brand-500 focus:outline-none" />
                </Field>
                <Field label="Audit trail" hint="Journaliser toutes les actions admin"><Toggle defaultChecked /></Field>
                <Field label="Alertes sécurité" hint="Notifier par email en cas d'anomalie"><Toggle defaultChecked /></Field>
              </Section>
              <Section title="Zone de danger">
                <div className="rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-900/10 p-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-500" />
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-red-800 dark:text-red-400">Réinitialiser la plateforme</p>
                      <p className="mt-1 text-xs text-red-600 dark:text-red-500">Supprime toutes les données de test. Irréversible.</p>
                      <button className="mt-3 rounded-lg border border-red-300 bg-white dark:bg-red-900/20 px-3 py-1.5 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50">
                        Réinitialiser
                      </button>
                    </div>
                  </div>
                </div>
              </Section>
            </>
          )}

          {tab === 'notifications' && (
            <Section title="Alertes Super Admin" description="Quand être notifié par email">
              {[
                { label: 'Nouveau restaurant inscrit', on: true },
                { label: 'Abonnement souscrit / annulé', on: true },
                { label: 'Paiement Stripe échoué', on: true },
                { label: 'Utilisation CPU > 80%', on: true },
                { label: 'Erreur critique (5xx > seuil)', on: true },
                { label: 'Restaurant suspendu automatiquement', on: false },
                { label: 'Rapport hebdomadaire MRR', on: true },
              ].map((item) => (
                <Field key={item.label} label={item.label}>
                  <Toggle defaultChecked={item.on} />
                </Field>
              ))}
            </Section>
          )}

          {tab === 'integrations' && (
            <Section title="Services tiers" description="Clés API des services externes">
              {[
                { label: 'Google Maps API', placeholder: 'AIza…', configured: false },
                { label: 'Twilio (SMS)', placeholder: 'ACxxxxxxx', configured: false },
                { label: 'Sentry DSN', placeholder: 'https://xxx@sentry.io/…', configured: false },
                { label: 'Datadog API Key', placeholder: 'xxxxxxx', configured: false },
                { label: 'Intercom App ID', placeholder: 'xxxxxxx', configured: false },
              ].map((svc) => (
                <Field key={svc.label} label={svc.label}>
                  <div className="flex items-center gap-2">
                    <TextInput placeholder={svc.placeholder} />
                    {svc.configured
                      ? <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-green-500" />
                      : <span className="flex-shrink-0 text-xs text-surface-400">Non configuré</span>
                    }
                  </div>
                </Field>
              ))}
            </Section>
          )}
        </div>
      </div>
    </div>
  );
}
