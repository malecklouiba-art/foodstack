'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Settings, Clock, Bell, Truck, CreditCard, Users,
  Upload, Save, Check, X, ChevronRight, MapPin,
} from 'lucide-react';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';

// ── Types ──────────────────────────────────────────────────────────────────────

type TabId = 'general' | 'horaires' | 'notifications' | 'livraison' | 'paiements' | 'equipe';

interface DaySchedule {
  open: boolean;
  start: string;
  end: string;
}

interface NotifSetting {
  id: string;
  label: string;
  desc: string;
  enabled: boolean;
}

// ── Tab definitions ────────────────────────────────────────────────────────────

const TABS: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: 'general',       label: 'Général',       icon: Settings   },
  { id: 'horaires',      label: 'Horaires',       icon: Clock      },
  { id: 'notifications', label: 'Notifications',  icon: Bell       },
  { id: 'livraison',     label: 'Livraison',      icon: Truck      },
  { id: 'paiements',     label: 'Paiements',      icon: CreditCard },
  { id: 'equipe',        label: 'Équipe',         icon: Users      },
];

// ── Initial state ──────────────────────────────────────────────────────────────

const INIT_SCHEDULE: Record<string, DaySchedule> = {
  Lun: { open: true,  start: '11:00', end: '23:00' },
  Mar: { open: true,  start: '11:00', end: '23:00' },
  Mer: { open: true,  start: '11:00', end: '23:00' },
  Jeu: { open: true,  start: '11:00', end: '23:00' },
  Ven: { open: true,  start: '11:00', end: '23:00' },
  Sam: { open: true,  start: '11:00', end: '00:00' },
  Dim: { open: true,  start: '11:00', end: '00:00' },
};

const INIT_NOTIFS: NotifSetting[] = [
  { id: 'new_order',     label: 'Nouvelle commande',  desc: 'Alerte lors de chaque nouvelle commande reçue',      enabled: true  },
  { id: 'cancel',        label: 'Commande annulée',   desc: 'Notification quand un client annule sa commande',    enabled: true  },
  { id: 'low_stock',     label: 'Stock faible',       desc: 'Alerte quand un article passe sous le seuil minimum',enabled: true  },
  { id: 'review',        label: 'Avis client',        desc: 'Notification lors d\'un nouvel avis déposé',         enabled: false },
  { id: 'daily_report',  label: 'Rapport quotidien',  desc: 'Résumé de la journée envoyé à 23h',                  enabled: true  },
];

// ── Sub-tab components ─────────────────────────────────────────────────────────

function GeneralTab() {
  const [form, setForm] = useState({
    name:    'FoodStack Bastille',
    desc:    'Restaurant burgers & pizzas artisanaux, au cœur du 11ème arrondissement.',
    email:   'contact@foodstack-bastille.fr',
    phone:   '01 43 55 78 92',
    address: '42 rue de la Roquette, 75011 Paris',
  });
  const [saved, setSaved] = useState(false);

  const set = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  function handleSave() {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-surface-700">Nom du restaurant</label>
          <input
            value={form.name}
            onChange={set('name')}
            className="w-full rounded-xl border border-surface-200 bg-white px-3.5 py-2.5 text-sm text-surface-900 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-surface-700">Email de contact</label>
          <input
            type="email"
            value={form.email}
            onChange={set('email')}
            className="w-full rounded-xl border border-surface-200 bg-white px-3.5 py-2.5 text-sm text-surface-900 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-surface-700">Téléphone</label>
          <input
            type="tel"
            value={form.phone}
            onChange={set('phone')}
            className="w-full rounded-xl border border-surface-200 bg-white px-3.5 py-2.5 text-sm text-surface-900 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-surface-700">Adresse</label>
          <input
            value={form.address}
            onChange={set('address')}
            className="w-full rounded-xl border border-surface-200 bg-white px-3.5 py-2.5 text-sm text-surface-900 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
          />
        </div>
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-medium text-surface-700">Description</label>
        <textarea
          value={form.desc}
          onChange={set('desc')}
          rows={3}
          className="w-full rounded-xl border border-surface-200 bg-white px-3.5 py-2.5 text-sm text-surface-900 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 resize-none"
        />
      </div>
      {/* Logo upload */}
      <div>
        <label className="mb-1.5 block text-sm font-medium text-surface-700">Logo du restaurant</label>
        <div className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-surface-200 bg-surface-50 px-6 py-10 text-center transition-colors hover:border-brand-300 hover:bg-brand-50">
          <div className="rounded-xl bg-white p-3 shadow-sm">
            <Upload className="h-6 w-6 text-brand-500" />
          </div>
          <div>
            <p className="text-sm font-medium text-surface-700">Glissez votre logo ici</p>
            <p className="mt-0.5 text-xs text-surface-400">PNG, JPG jusqu&apos;à 5 Mo — recommandé 400×400px</p>
          </div>
          <button className="rounded-xl border border-surface-200 bg-white px-4 py-2 text-sm font-medium text-surface-700 hover:bg-surface-50">
            Parcourir les fichiers
          </button>
        </div>
      </div>
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          className="flex items-center gap-2 rounded-xl bg-brand-500 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-600 active:scale-95"
        >
          {saved ? <Check className="h-4 w-4" /> : <Save className="h-4 w-4" />}
          {saved ? 'Enregistré !' : 'Enregistrer'}
        </button>
      </div>
    </div>
  );
}

function HorairesTab() {
  const [schedule, setSchedule] = useState(INIT_SCHEDULE);

  const setDay = (day: string, field: keyof DaySchedule, value: boolean | string) =>
    setSchedule((prev) => ({ ...prev, [day]: { ...prev[day], [field]: value } }));

  function applyToAll() {
    const ref = schedule['Lun'];
    setSchedule((prev) =>
      Object.fromEntries(Object.keys(prev).map((d) => [d, { ...ref }]))
    );
  }

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-2xl border border-surface-200 bg-white">
        <table className="w-full">
          <thead>
            <tr className="border-b border-surface-100 bg-surface-50">
              {['Jour', 'Ouvert', 'Ouverture', 'Fermeture'].map((h) => (
                <th key={h} className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-surface-400">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-100">
            {Object.entries(schedule).map(([day, s]) => (
              <tr key={day} className="hover:bg-surface-50">
                <td className="px-5 py-3.5 text-sm font-medium text-surface-800">{day}</td>
                <td className="px-5 py-3.5">
                  <button
                    onClick={() => setDay(day, 'open', !s.open)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${s.open ? 'bg-brand-500' : 'bg-surface-200'}`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${s.open ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </td>
                <td className="px-5 py-3.5">
                  <input
                    type="time"
                    value={s.start}
                    disabled={!s.open}
                    onChange={(e) => setDay(day, 'start', e.target.value)}
                    className="rounded-lg border border-surface-200 px-3 py-1.5 text-sm text-surface-900 outline-none focus:border-brand-400 disabled:opacity-40"
                  />
                </td>
                <td className="px-5 py-3.5">
                  <input
                    type="time"
                    value={s.end}
                    disabled={!s.open}
                    onChange={(e) => setDay(day, 'end', e.target.value)}
                    className="rounded-lg border border-surface-200 px-3 py-1.5 text-sm text-surface-900 outline-none focus:border-brand-400 disabled:opacity-40"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex justify-between">
        <button
          onClick={applyToAll}
          className="rounded-xl border border-surface-200 bg-white px-4 py-2 text-sm font-medium text-surface-700 transition-colors hover:bg-surface-50"
        >
          Appliquer à tous les jours
        </button>
        <button className="flex items-center gap-2 rounded-xl bg-brand-500 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-600">
          <Save className="h-4 w-4" />
          Enregistrer
        </button>
      </div>
    </div>
  );
}

function NotificationsTab() {
  const [notifs, setNotifs] = useState(INIT_NOTIFS);

  const toggle = (id: string) =>
    setNotifs((prev) => prev.map((n) => n.id === id ? { ...n, enabled: !n.enabled } : n));

  return (
    <div className="space-y-3">
      {notifs.map((notif) => (
        <div key={notif.id} className="flex items-center justify-between rounded-2xl border border-surface-200 bg-white px-5 py-4 hover:bg-surface-50 transition-colors">
          <div>
            <p className="text-sm font-medium text-surface-900">{notif.label}</p>
            <p className="mt-0.5 text-xs text-surface-400">{notif.desc}</p>
          </div>
          <button
            onClick={() => toggle(notif.id)}
            className={`relative ml-4 inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${notif.enabled ? 'bg-brand-500' : 'bg-surface-200'}`}
          >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${notif.enabled ? 'translate-x-6' : 'translate-x-1'}`} />
          </button>
        </div>
      ))}
    </div>
  );
}

function LivraisonTab() {
  const [radius, setRadius]   = useState('5');
  const [fee, setFee]         = useState('2.50');
  const [minOrder, setMinOrder] = useState('15');
  const [prepTime, setPrepTime] = useState('20');

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-surface-700">Rayon de livraison (km)</label>
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="1"
                max="20"
                value={radius}
                onChange={(e) => setRadius(e.target.value)}
                className="h-2 w-full cursor-pointer appearance-none rounded-full bg-surface-200 accent-brand-500"
              />
              <span className="w-14 rounded-xl border border-surface-200 bg-white px-3 py-1.5 text-center text-sm font-semibold text-surface-900">
                {radius} km
              </span>
            </div>
          </div>
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-surface-700">Frais de livraison (€)</label>
          <input
            type="number"
            step="0.10"
            value={fee}
            onChange={(e) => setFee(e.target.value)}
            className="w-full rounded-xl border border-surface-200 bg-white px-3.5 py-2.5 text-sm text-surface-900 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-surface-700">Montant minimum de commande (€)</label>
          <input
            type="number"
            value={minOrder}
            onChange={(e) => setMinOrder(e.target.value)}
            className="w-full rounded-xl border border-surface-200 bg-white px-3.5 py-2.5 text-sm text-surface-900 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-surface-700">Temps de préparation estimé (min)</label>
          <input
            type="number"
            value={prepTime}
            onChange={(e) => setPrepTime(e.target.value)}
            className="w-full rounded-xl border border-surface-200 bg-white px-3.5 py-2.5 text-sm text-surface-900 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
          />
        </div>
      </div>

      {/* Map placeholder */}
      <div>
        <label className="mb-1.5 block text-sm font-medium text-surface-700">Zone de livraison</label>
        <div className="flex h-52 items-center justify-center rounded-2xl border-2 border-dashed border-surface-200 bg-surface-50">
          <div className="text-center">
            <MapPin className="mx-auto h-8 w-8 text-surface-300" />
            <p className="mt-2 text-sm font-medium text-surface-500">Aperçu de la zone de livraison</p>
            <p className="mt-0.5 text-xs text-surface-400">Rayon : {radius} km autour de votre restaurant</p>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button className="flex items-center gap-2 rounded-xl bg-brand-500 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-600">
          <Save className="h-4 w-4" />
          Enregistrer
        </button>
      </div>
    </div>
  );
}

function ComingSoonTab({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="mb-4 rounded-2xl bg-surface-100 p-5">
        <Settings className="h-10 w-10 text-surface-400" />
      </div>
      <h3 className="text-lg font-semibold text-surface-700">{label}</h3>
      <p className="mt-2 text-sm text-surface-400">Cette section sera bientôt disponible.</p>
      <span className="mt-4 inline-flex items-center rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700">
        Bientôt disponible
      </span>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<TabId>('general');

  function renderContent() {
    switch (activeTab) {
      case 'general':       return <GeneralTab />;
      case 'horaires':      return <HorairesTab />;
      case 'notifications': return <NotificationsTab />;
      case 'livraison':     return <LivraisonTab />;
      case 'paiements':     return <ComingSoonTab label="Paiements" />;
      case 'equipe':        return <ComingSoonTab label="Équipe" />;
    }
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-surface-900">Paramètres</h1>
        <p className="mt-1 text-sm text-surface-500">Configuration de votre restaurant</p>
      </div>

      {/* Content */}
      <div className="flex gap-6">
        {/* Sidebar */}
        <div className="w-56 shrink-0">
          <nav className="space-y-1">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors ${
                    active
                      ? 'bg-brand-50 text-brand-700'
                      : 'text-surface-600 hover:bg-surface-100 hover:text-surface-900'
                  }`}
                >
                  <Icon className={`h-4 w-4 shrink-0 ${active ? 'text-brand-600' : 'text-surface-400'}`} />
                  {tab.label}
                  {active && <ChevronRight className="ml-auto h-4 w-4 text-brand-400" />}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab content */}
        <div className="min-w-0 flex-1">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15 }}
            >
              <Card padding="lg">
                {renderContent()}
              </Card>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
