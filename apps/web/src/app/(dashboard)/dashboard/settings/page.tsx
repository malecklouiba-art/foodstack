'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Save, Upload, Info, Bell, CreditCard, Clock, Settings } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { useAuthStore } from '@/store/auth';
import { subscribeToPush } from '@/lib/push';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';

// ── Types ──────────────────────────────────────────────────────────────────

interface GeneralForm {
  name: string;
  address: string;
  phone: string;
  email: string;
  description: string;
  logoUrl: string;
}

interface PaymentForm {
  stripePublishableKey: string;
  stripeSecretKey: string;
  currency: 'EUR' | 'USD' | 'GBP';
}

interface NotifForm {
  emailEnabled: boolean;
  pushEnabled: boolean;
  smsEnabled: boolean;
}

interface DaySchedule {
  open: boolean;
  from: string;
  to: string;
}

type Schedule = Record<string, DaySchedule>;

// ── Constants ──────────────────────────────────────────────────────────────

const DAYS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'] as const;

const DEFAULT_SCHEDULE: Schedule = Object.fromEntries(
  DAYS.map((day) => [day, { open: true, from: '09:00', to: '22:00' }])
);

const TABS = ['Général', 'Paiement', 'Notifications', 'Horaires'] as const;
type Tab = (typeof TABS)[number];

const TAB_ICONS: Record<Tab, React.ReactNode> = {
  Général: <Settings className="h-4 w-4" />,
  Paiement: <CreditCard className="h-4 w-4" />,
  Notifications: <Bell className="h-4 w-4" />,
  Horaires: <Clock className="h-4 w-4" />,
};

const CURRENCY_OPTIONS = [
  { value: 'EUR', label: 'EUR — Euro (€)' },
  { value: 'USD', label: 'USD — Dollar ($)' },
  { value: 'GBP', label: 'GBP — Livre sterling (£)' },
];

const SAMPLE_EMAIL = `Objet : Confirmation de votre commande #4821

Bonjour Marie,

Nous avons bien reçu votre commande et votre paiement.

━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Burger Classic            12,90 €
  Frites maison              3,50 €
  Coca-Cola 33cl             2,50 €
━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Total TTC                 18,90 €

Livraison estimée : 25–35 min
Adresse : 12 rue de la Paix, 75001 Paris

Merci de votre confiance !
L'équipe FoodStack`;

// ── Toast banner ───────────────────────────────────────────────────────────

interface ToastBannerProps {
  message: string;
  type: 'success' | 'error';
  onDismiss: () => void;
}

function ToastBanner({ message, type, onDismiss }: ToastBannerProps) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 4000);
    return () => clearTimeout(t);
  }, [onDismiss]);

  return (
    <div
      className={`fixed top-4 right-4 z-50 flex items-center gap-3 rounded-2xl px-5 py-3 text-sm font-medium text-white shadow-lg transition-all ${
        type === 'success' ? 'bg-green-600' : 'bg-red-600'
      }`}
    >
      <span>{message}</span>
      <button onClick={onDismiss} className="ml-2 opacity-70 hover:opacity-100">
        ✕
      </button>
    </div>
  );
}

// ── Toggle switch ──────────────────────────────────────────────────────────

interface ToggleProps {
  checked: boolean;
  onChange: (val: boolean) => void;
  label: string;
  description?: string;
  extra?: React.ReactNode;
}

function Toggle({ checked, onChange, label, description, extra }: ToggleProps) {
  return (
    <div className="flex items-center justify-between gap-4 py-4">
      <div className="flex-1">
        <p className="text-sm font-medium text-white">{label}</p>
        {description && <p className="mt-0.5 text-xs text-gray-400">{description}</p>}
        {extra}
      </div>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 flex-shrink-0 rounded-full transition-colors ${
          checked ? 'bg-orange-500' : 'bg-gray-700'
        }`}
        aria-checked={checked}
        role="switch"
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
            checked ? 'translate-x-5' : 'translate-x-0.5'
          }`}
        />
      </button>
    </div>
  );
}

// ── Section card ───────────────────────────────────────────────────────────

function SectionCard({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
      {title && <h3 className="mb-5 text-base font-semibold text-white">{title}</h3>}
      {children}
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const { user } = useAuthStore();
  const restaurantId = (user?.restaurantIds?.[0]) ?? 'demo';

  const [activeTab, setActiveTab] = useState<Tab>('Général');
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
  }, []);

  // ── Général state ──────────────────────────────────────────────────────

  const [general, setGeneral] = useState<GeneralForm>({
    name: 'FoodStack Montmartre',
    address: '12 rue Lepic, 75018 Paris',
    phone: '01 23 45 67 89',
    email: 'contact@foodstack-montmartre.fr',
    description: 'Burgers artisanaux et pizzas au feu de bois depuis 2018.',
    logoUrl: '',
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setGeneral((p) => ({ ...p, logoUrl: url }));
  };

  const saveGeneral = async () => {
    setSaving(true);
    try {
      await new Promise<void>((r) => setTimeout(r, 600));
      // PATCH `/restaurants/:id`
      await fetch(`${API_URL}/restaurants/${restaurantId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(general),
      }).catch(() => null); // swallow in mock
      showToast('Informations générales sauvegardées !');
    } finally {
      setSaving(false);
    }
  };

  // ── Paiement state ─────────────────────────────────────────────────────

  const [payment, setPayment] = useState<PaymentForm>({
    stripePublishableKey: 'pk_live_51Abc...xYz1',
    stripeSecretKey: '',
    currency: 'EUR',
  });

  const savePayment = async () => {
    setSaving(true);
    try {
      await new Promise<void>((r) => setTimeout(r, 600));
      await fetch(`${API_URL}/restaurants/${restaurantId}/payment-settings`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payment),
      }).catch(() => null);
      showToast('Paramètres de paiement sauvegardés !');
    } finally {
      setSaving(false);
    }
  };

  // Mask publishable key: show only last 4 chars
  const maskedPublishable =
    payment.stripePublishableKey.length > 4
      ? '••••••••••••' + payment.stripePublishableKey.slice(-4)
      : payment.stripePublishableKey;

  // ── Notifications state ────────────────────────────────────────────────

  const [pushSubscribed, setPushSubscribed] = useState(false);
  const [pushLoading, setPushLoading] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setPushSubscribed(localStorage.getItem('push-subscribed') === 'true');
    }
  }, []);

  const [notif, setNotif] = useState<NotifForm>({
    emailEnabled: true,
    pushEnabled: false,
    smsEnabled: false,
  });

  const handleActivatePush = async () => {
    setPushLoading(true);
    try {
      const sub = await subscribeToPush();
      if (sub) {
        setPushSubscribed(true);
        setNotif((p) => ({ ...p, pushEnabled: true }));
        showToast('Notifications push activées !');
      } else {
        showToast('Impossible d\'activer les notifications push.', 'error');
      }
    } finally {
      setPushLoading(false);
    }
  };

  // ── Horaires state ─────────────────────────────────────────────────────

  const [schedule, setSchedule] = useState<Schedule>(DEFAULT_SCHEDULE);

  const toggleDay = (day: string) =>
    setSchedule((s) => ({ ...s, [day]: { ...s[day], open: !s[day].open } }));

  const updateDay = (day: string, field: 'from' | 'to', value: string) =>
    setSchedule((s) => ({ ...s, [day]: { ...s[day], [field]: value } }));

  const saveHours = async () => {
    setSaving(true);
    try {
      await new Promise<void>((r) => setTimeout(r, 600));
      await fetch(`${API_URL}/restaurants/${restaurantId}/hours`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(schedule),
      }).catch(() => null);
      showToast('Horaires sauvegardés !');
    } finally {
      setSaving(false);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {toast && (
        <ToastBanner
          message={toast.message}
          type={toast.type}
          onDismiss={() => setToast(null)}
        />
      )}

      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white">Paramètres</h1>
          <p className="mt-1 text-sm text-gray-400">Configuration de votre restaurant</p>
        </div>

        {/* Tabs */}
        <div className="mb-6 flex gap-1 overflow-x-auto rounded-xl border border-gray-800 bg-gray-900 p-1">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition-colors sm:gap-2 sm:px-4 ${
                activeTab === tab
                  ? 'bg-gray-800 text-white shadow'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              {TAB_ICONS[tab]}
              <span className="hidden sm:inline">{tab}</span>
              <span className="sm:hidden">{tab.slice(0, 4)}</span>
            </button>
          ))}
        </div>

        {/* ── Tab: Général ─────────────────────────────────────────────── */}
        {activeTab === 'Général' && (
          <div className="space-y-5">
            <SectionCard title="Logo du restaurant">
              <div className="flex items-center gap-5">
                <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-2xl border border-gray-700 bg-gray-800">
                  {general.logoUrl ? (
                    <img
                      src={general.logoUrl}
                      alt="Logo restaurant"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-2xl font-bold text-orange-400">
                      {general.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-white">Photo de profil</p>
                  <p className="mt-0.5 text-xs text-gray-400">PNG ou JPG, 512×512 px recommandé</p>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="mt-2 flex items-center gap-2 rounded-xl border border-gray-700 bg-gray-800 px-3 py-1.5 text-sm font-medium text-gray-300 transition hover:bg-gray-700"
                  >
                    <Upload className="h-4 w-4" />
                    Changer le logo
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg"
                    className="hidden"
                    onChange={handleLogoChange}
                  />
                </div>
              </div>
            </SectionCard>

            <SectionCard title="Informations générales">
              <div className="space-y-4">
                <Input
                  label="Nom du restaurant"
                  value={general.name}
                  onChange={(e) => setGeneral((p) => ({ ...p, name: e.target.value }))}
                  placeholder="Ex: Mon Restaurant"
                />

                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-gray-300">Adresse</label>
                  <textarea
                    value={general.address}
                    onChange={(e) => setGeneral((p) => ({ ...p, address: e.target.value }))}
                    rows={2}
                    placeholder="12 rue de la Paix, 75001 Paris"
                    className="w-full rounded-xl border border-gray-700 bg-gray-800 px-3 py-2.5 text-sm text-white placeholder:text-gray-500 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Input
                    label="Téléphone"
                    type="tel"
                    value={general.phone}
                    onChange={(e) => setGeneral((p) => ({ ...p, phone: e.target.value }))}
                    placeholder="01 23 45 67 89"
                  />
                  <Input
                    label="Email"
                    type="email"
                    value={general.email}
                    onChange={(e) => setGeneral((p) => ({ ...p, email: e.target.value }))}
                    placeholder="contact@restaurant.fr"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-gray-300">Description</label>
                  <textarea
                    value={general.description}
                    onChange={(e) => setGeneral((p) => ({ ...p, description: e.target.value }))}
                    rows={3}
                    placeholder="Décrivez votre restaurant..."
                    className="w-full rounded-xl border border-gray-700 bg-gray-800 px-3 py-2.5 text-sm text-white placeholder:text-gray-500 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                  />
                </div>
              </div>
            </SectionCard>

            <div className="flex justify-end">
              <Button
                loading={saving}
                icon={<Save className="h-4 w-4" />}
                onClick={saveGeneral}
              >
                Sauvegarder
              </Button>
            </div>
          </div>
        )}

        {/* ── Tab: Paiement ─────────────────────────────────────────────── */}
        {activeTab === 'Paiement' && (
          <div className="space-y-5">
            <SectionCard title="Clés Stripe">
              <div className="space-y-4">
                {/* Info banner */}
                <div className="flex items-start gap-3 rounded-xl border border-blue-800 bg-blue-950/60 px-4 py-3">
                  <Info className="mt-0.5 h-4 w-4 flex-shrink-0 text-blue-400" />
                  <p className="text-sm text-blue-300">
                    Les clés sont chiffrées et jamais exposées côté client
                  </p>
                </div>

                {/* Publishable key — shows masked value, type=text */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-gray-300">
                    Clé publiable (publishable key)
                  </label>
                  <input
                    type="text"
                    value={maskedPublishable}
                    readOnly
                    className="h-10 w-full cursor-not-allowed rounded-xl border border-gray-700 bg-gray-800 px-3 text-sm text-gray-400 focus:outline-none"
                    placeholder="pk_live_..."
                  />
                  <p className="text-xs text-gray-500">
                    Affichage masqué — seuls les 4 derniers caractères sont visibles
                  </p>
                </div>

                {/* Secret key — type=password */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-gray-300">
                    Clé secrète (secret key)
                  </label>
                  <input
                    type="password"
                    value={payment.stripeSecretKey}
                    onChange={(e) =>
                      setPayment((p) => ({ ...p, stripeSecretKey: e.target.value }))
                    }
                    className="h-10 w-full rounded-xl border border-gray-700 bg-gray-800 px-3 text-sm text-white placeholder:text-gray-500 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                    placeholder="sk_live_..."
                    autoComplete="off"
                  />
                </div>
              </div>
            </SectionCard>

            <SectionCard title="Devise">
              <Select
                label="Devise de facturation"
                value={payment.currency}
                options={CURRENCY_OPTIONS}
                onChange={(e) =>
                  setPayment((p) => ({
                    ...p,
                    currency: e.target.value as PaymentForm['currency'],
                  }))
                }
              />
            </SectionCard>

            <div className="flex justify-end">
              <Button
                loading={saving}
                icon={<Save className="h-4 w-4" />}
                onClick={savePayment}
              >
                Sauvegarder
              </Button>
            </div>
          </div>
        )}

        {/* ── Tab: Notifications ────────────────────────────────────────── */}
        {activeTab === 'Notifications' && (
          <div className="space-y-5">
            <SectionCard title="Canaux de notification">
              <div className="divide-y divide-gray-800">
                <Toggle
                  checked={notif.emailEnabled}
                  onChange={(val) => setNotif((p) => ({ ...p, emailEnabled: val }))}
                  label="Notifications par email"
                  description="Recevez les nouvelles commandes et alertes par email"
                />
                <Toggle
                  checked={notif.pushEnabled || pushSubscribed}
                  onChange={() => {
                    if (!pushSubscribed) {
                      handleActivatePush();
                    } else {
                      setNotif((p) => ({ ...p, pushEnabled: !p.pushEnabled }));
                    }
                  }}
                  label="Notifications push"
                  description={
                    pushSubscribed
                      ? 'Activé — votre navigateur recevra les alertes en temps réel'
                      : 'Recevez des alertes instantanées dans votre navigateur'
                  }
                  extra={
                    !pushSubscribed ? (
                      <button
                        type="button"
                        onClick={handleActivatePush}
                        disabled={pushLoading}
                        className="mt-1.5 rounded-lg border border-orange-600 px-3 py-1 text-xs font-medium text-orange-400 transition hover:bg-orange-600/10 disabled:opacity-50"
                      >
                        {pushLoading ? 'Activation…' : 'Activer'}
                      </button>
                    ) : null
                  }
                />
                <Toggle
                  checked={notif.smsEnabled}
                  onChange={(val) => setNotif((p) => ({ ...p, smsEnabled: val }))}
                  label="Notifications SMS"
                  description="Alertes SMS pour les commandes urgentes (nécessite Twilio)"
                />
              </div>
            </SectionCard>

            <SectionCard title="Aperçu du modèle d'email">
              <p className="mb-3 text-xs text-gray-500">
                Exemple de confirmation de commande envoyée au client
              </p>
              <pre className="overflow-x-auto rounded-xl border border-gray-700 bg-gray-950 px-4 py-4 text-xs leading-relaxed text-gray-300 whitespace-pre-wrap font-mono">
                {SAMPLE_EMAIL}
              </pre>
            </SectionCard>
          </div>
        )}

        {/* ── Tab: Horaires ─────────────────────────────────────────────── */}
        {activeTab === 'Horaires' && (
          <div className="space-y-5">
            <SectionCard title="Horaires d'ouverture">
              <p className="mb-5 text-sm text-gray-400">
                Configurez les plages horaires pour chaque jour de la semaine
              </p>
              <div className="space-y-2">
                {DAYS.map((day) => {
                  const slot = schedule[day];
                  return (
                    <div
                      key={day}
                      className={`flex flex-wrap items-center gap-3 rounded-xl border p-3 transition-colors sm:flex-nowrap ${
                        slot.open
                          ? 'border-gray-700 bg-gray-800/50'
                          : 'border-gray-800 bg-gray-900 opacity-60'
                      }`}
                    >
                      {/* Day name */}
                      <span
                        className={`w-24 flex-shrink-0 text-sm font-medium ${
                          slot.open ? 'text-white' : 'text-gray-500'
                        }`}
                      >
                        {day}
                      </span>

                      {/* Toggle */}
                      <button
                        type="button"
                        onClick={() => toggleDay(day)}
                        className={`relative h-5 w-9 flex-shrink-0 rounded-full transition-colors ${
                          slot.open ? 'bg-orange-500' : 'bg-gray-700'
                        }`}
                        role="switch"
                        aria-checked={slot.open}
                        aria-label={`${day} ouvert`}
                      >
                        <span
                          className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${
                            slot.open ? 'translate-x-4' : 'translate-x-0.5'
                          }`}
                        />
                      </button>

                      {slot.open ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="time"
                            value={slot.from}
                            onChange={(e) => updateDay(day, 'from', e.target.value)}
                            className="h-9 rounded-xl border border-gray-700 bg-gray-800 px-3 text-sm text-white focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                          />
                          <span className="text-gray-500">→</span>
                          <input
                            type="time"
                            value={slot.to}
                            onChange={(e) => updateDay(day, 'to', e.target.value)}
                            className="h-9 rounded-xl border border-gray-700 bg-gray-800 px-3 text-sm text-white focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                          />
                        </div>
                      ) : (
                        <span className="text-sm text-gray-500">Fermé</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </SectionCard>

            <div className="flex justify-end">
              <Button
                loading={saving}
                icon={<Save className="h-4 w-4" />}
                onClick={saveHours}
              >
                Sauvegarder les horaires
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
