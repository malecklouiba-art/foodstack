'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  Settings, Clock, Bell, Truck, CreditCard, Users,
  Upload, Save, Check, X, ChevronRight, MapPin,
  AlertCircle, CheckCircle, Plus, Trash2, Edit2,
  Building2, RefreshCw, Shield, Eye, EyeOff,
  Printer, CreditCard as TPEIcon, Bluetooth, Wifi, Usb,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { useAuthStore } from '@/store/auth';
import api from '@/lib/api';

// ── Types ──────────────────────────────────────────────────────────────────────

type TabId = 'general' | 'horaires' | 'notifications' | 'livraison' | 'paiements' | 'equipe' | 'peripheriques';

interface RestaurantData {
  id?: string;
  name?: string;
  description?: string;
  email?: string;
  phone?: string;
  address?: string;
  street?: string;
  city?: string;
  postalCode?: string;
  openingHours?: Record<string, { open: boolean; start: string; end: string }>;
  businessHours?: Record<string, { open: boolean; start: string; end: string }>;
}

interface TabProps {
  restaurantId: string;
}

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
  { id: 'peripheriques', label: 'Périphériques',  icon: Printer    },
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

function GeneralTab({ restaurantId }: TabProps) {
  const [form, setForm] = useState({
    name:    '',
    desc:    '',
    email:   '',
    phone:   '',
    address: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!restaurantId) { setLoading(false); return; }
    (api.get(`/restaurants/${restaurantId}`) as Promise<RestaurantData>)
      .then((data) => {
        setForm({
          name:    data.name    ?? '',
          desc:    data.description ?? '',
          email:   data.email   ?? '',
          phone:   data.phone   ?? '',
          address: data.address ?? [data.street, data.city, data.postalCode].filter(Boolean).join(', '),
        });
      })
      .catch(() => toast.error('Impossible de charger les informations du restaurant'))
      .finally(() => setLoading(false));
  }, [restaurantId]);

  const setField = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  async function handleSave() {
    if (!restaurantId) return;
    setSaving(true);
    try {
      await api.patch(`/restaurants/${restaurantId}`, {
        name:        form.name,
        description: form.desc,
        email:       form.email,
        phone:       form.phone,
        address:     form.address,
      });
      toast.success('Informations enregistrées !');
    } catch {
      toast.error('Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <RefreshCw className="h-6 w-6 animate-spin text-brand-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-surface-700">Nom du restaurant</label>
          <input
            value={form.name}
            onChange={setField('name')}
            className="w-full rounded-xl border border-surface-200 bg-white px-3.5 py-2.5 text-sm text-surface-900 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-surface-700">Email de contact</label>
          <input
            type="email"
            value={form.email}
            onChange={setField('email')}
            className="w-full rounded-xl border border-surface-200 bg-white px-3.5 py-2.5 text-sm text-surface-900 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-surface-700">Téléphone</label>
          <input
            type="tel"
            value={form.phone}
            onChange={setField('phone')}
            className="w-full rounded-xl border border-surface-200 bg-white px-3.5 py-2.5 text-sm text-surface-900 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-surface-700">Adresse</label>
          <input
            value={form.address}
            onChange={setField('address')}
            className="w-full rounded-xl border border-surface-200 bg-white px-3.5 py-2.5 text-sm text-surface-900 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
          />
        </div>
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-medium text-surface-700">Description</label>
        <textarea
          value={form.desc}
          onChange={setField('desc')}
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
          disabled={saving}
          className="flex items-center gap-2 rounded-xl bg-brand-500 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-600 active:scale-95 disabled:opacity-60"
        >
          {saving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {saving ? 'Enregistrement…' : 'Enregistrer'}
        </button>
      </div>
    </div>
  );
}

function HorairesTab({ restaurantId }: TabProps) {
  const [schedule, setSchedule] = useState(INIT_SCHEDULE);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!restaurantId) { setLoading(false); return; }
    (api.get(`/restaurants/${restaurantId}`) as Promise<RestaurantData>)
      .then((data) => {
        const hours = data.businessHours ?? data.openingHours;
        if (hours && Object.keys(hours).length > 0) {
          setSchedule(hours as Record<string, DaySchedule>);
        }
      })
      .catch(() => toast.error('Impossible de charger les horaires'))
      .finally(() => setLoading(false));
  }, [restaurantId]);

  const setDay = (day: string, field: keyof DaySchedule, value: boolean | string) =>
    setSchedule((prev) => ({ ...prev, [day]: { ...prev[day], [field]: value } }));

  function applyToAll() {
    const ref = schedule['Lun'];
    setSchedule((prev) =>
      Object.fromEntries(Object.keys(prev).map((d) => [d, { ...ref }]))
    );
  }

  async function handleSave() {
    if (!restaurantId) return;
    setSaving(true);
    try {
      await api.patch(`/restaurants/${restaurantId}`, { businessHours: schedule });
      toast.success('Horaires enregistrés !');
    } catch {
      toast.error('Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <RefreshCw className="h-6 w-6 animate-spin text-brand-400" />
      </div>
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
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 rounded-xl bg-brand-500 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-600 disabled:opacity-60"
        >
          {saving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {saving ? 'Enregistrement…' : 'Enregistrer'}
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

// ── Paiements tab ─────────────────────────────────────────────────────────────

type PayMethod = 'card' | 'apple_pay' | 'google_pay' | 'cash';

const PAY_METHODS: { id: PayMethod; label: string; icon: string; desc: string }[] = [
  { id: 'card',       label: 'Carte bancaire',  icon: '💳', desc: 'Visa, Mastercard, AMEX' },
  { id: 'apple_pay',  label: 'Apple Pay',        icon: '', desc: 'Paiement mobile iOS' },
  { id: 'google_pay', label: 'Google Pay',       icon: '🪙', desc: 'Paiement mobile Android' },
  { id: 'cash',       label: 'Espèces',          icon: '💵', desc: 'Paiement à la livraison' },
];

function PaiementsTab() {
  const [stripeConnected] = useState(true);
  const [showKey, setShowKey] = useState(false);
  const [payoutSchedule, setPayoutSchedule] = useState<'daily' | 'weekly' | 'monthly'>('weekly');
  const [commission, setCommission] = useState('8');
  const [acceptedMethods, setAcceptedMethods] = useState<Set<PayMethod>>(
    new Set(['card', 'apple_pay', 'google_pay', 'cash'])
  );
  const [saved, setSaved] = useState(false);

  const toggleMethod = (id: PayMethod) =>
    setAcceptedMethods((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });

  const mockKey = 'pk_live_51J3m...xK9a';

  return (
    <div className="space-y-6">
      {/* Stripe connection status */}
      <div className={`flex items-start gap-4 rounded-2xl border p-5 ${
        stripeConnected ? 'border-green-200 bg-green-50' : 'border-yellow-200 bg-yellow-50'
      }`}>
        <div className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
          stripeConnected ? 'bg-green-100' : 'bg-yellow-100'
        }`}>
          {stripeConnected
            ? <CheckCircle className="h-5 w-5 text-green-600" />
            : <AlertCircle className="h-5 w-5 text-yellow-600" />}
        </div>
        <div className="flex-1 min-w-0">
          <p className={`font-semibold ${stripeConnected ? 'text-green-800' : 'text-yellow-800'}`}>
            {stripeConnected ? 'Stripe connecté' : 'Stripe non configuré'}
          </p>
          <p className={`mt-0.5 text-sm ${stripeConnected ? 'text-green-700' : 'text-yellow-700'}`}>
            {stripeConnected
              ? 'Compte · FoodStack Bastille · IBAN ****4521 · Vérifié'
              : 'Connectez votre compte Stripe pour accepter les paiements en ligne.'}
          </p>
        </div>
        <button className={`shrink-0 rounded-xl px-4 py-2 text-sm font-semibold transition-colors ${
          stripeConnected
            ? 'border border-green-300 text-green-700 hover:bg-green-100'
            : 'bg-yellow-500 text-white hover:bg-yellow-600'
        }`}>
          {stripeConnected ? 'Gérer' : 'Connecter Stripe'}
        </button>
      </div>

      {/* Stripe API key */}
      <div>
        <label className="mb-1.5 block text-sm font-medium text-surface-700">Clé publique Stripe</label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <input
              readOnly
              type={showKey ? 'text' : 'password'}
              value={mockKey}
              className="w-full rounded-xl border border-surface-200 bg-surface-50 px-3.5 py-2.5 pr-10 text-sm font-mono text-surface-600 outline-none"
            />
            <button
              onClick={() => setShowKey(!showKey)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-600"
            >
              {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          <button className="flex items-center gap-1.5 rounded-xl border border-surface-200 px-4 py-2.5 text-sm font-medium text-surface-600 hover:bg-surface-50 transition-colors">
            <RefreshCw className="h-3.5 w-3.5" />
            Régénérer
          </button>
        </div>
        <p className="mt-1.5 text-xs text-surface-400">Webhook URL : <span className="font-mono">https://foodstack.app/api/payments/webhook</span></p>
      </div>

      {/* Payment methods */}
      <div>
        <label className="mb-3 block text-sm font-medium text-surface-700">Méthodes de paiement acceptées</label>
        <div className="grid gap-3 sm:grid-cols-2">
          {PAY_METHODS.map((method) => {
            const active = acceptedMethods.has(method.id);
            return (
              <button
                key={method.id}
                onClick={() => toggleMethod(method.id)}
                className={`flex items-center gap-4 rounded-2xl border p-4 text-left transition-all ${
                  active
                    ? 'border-brand-300 bg-brand-50 ring-1 ring-brand-200'
                    : 'border-surface-200 bg-white hover:border-surface-300'
                }`}
              >
                <span className="text-2xl">{method.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-semibold ${active ? 'text-brand-800' : 'text-surface-900'}`}>{method.label}</p>
                  <p className="text-xs text-surface-400">{method.desc}</p>
                </div>
                <div className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
                  active ? 'border-brand-500 bg-brand-500' : 'border-surface-300'
                }`}>
                  {active && <Check className="h-3 w-3 text-white" />}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Commission + payout */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-surface-700">Commission plateforme (%)</label>
          <input
            type="number"
            min="0"
            max="30"
            step="0.5"
            value={commission}
            onChange={(e) => setCommission(e.target.value)}
            className="w-full rounded-xl border border-surface-200 bg-white px-3.5 py-2.5 text-sm text-surface-900 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
          />
          <p className="mt-1 text-xs text-surface-400">Prélevée sur chaque transaction</p>
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-surface-700">Fréquence des virements</label>
          <div className="flex rounded-xl border border-surface-200 bg-surface-50 p-0.5">
            {(['daily', 'weekly', 'monthly'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setPayoutSchedule(s)}
                className={`flex-1 rounded-lg py-2 text-xs font-semibold transition-colors ${
                  payoutSchedule === s ? 'bg-white text-surface-900 shadow-sm' : 'text-surface-500 hover:text-surface-700'
                }`}
              >
                {s === 'daily' ? 'Quotidien' : s === 'weekly' ? 'Hebdo' : 'Mensuel'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Payout summary */}
      <div className="rounded-2xl border border-surface-200 bg-white p-5">
        <div className="flex items-center gap-2 mb-4">
          <Building2 className="h-4 w-4 text-surface-400" />
          <p className="text-sm font-semibold text-surface-900">Prochain virement</p>
        </div>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-xl font-bold text-surface-900">3 420€</p>
            <p className="text-xs text-surface-400 mt-0.5">Montant</p>
          </div>
          <div>
            <p className="text-xl font-bold text-surface-900">15 mai</p>
            <p className="text-xs text-surface-400 mt-0.5">Date</p>
          </div>
          <div>
            <p className="text-xl font-bold text-surface-900">****4521</p>
            <p className="text-xs text-surface-400 mt-0.5">IBAN</p>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={() => { setSaved(true); setTimeout(() => setSaved(false), 2500); }}
          className="flex items-center gap-2 rounded-xl bg-brand-500 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-brand-600 transition-colors"
        >
          {saved ? <Check className="h-4 w-4" /> : <Save className="h-4 w-4" />}
          {saved ? 'Enregistré !' : 'Enregistrer'}
        </button>
      </div>
    </div>
  );
}

// ── Équipe tab ─────────────────────────────────────────────────────────────────

type MemberRole = 'owner' | 'manager' | 'staff' | 'driver';

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: MemberRole;
  active: boolean;
  lastLogin: string;
  avatar: string;
}

const ROLE_CONFIG: Record<MemberRole, { label: string; variant: 'brand' | 'success' | 'info' | 'warning'; perms: string[] }> = {
  owner:   { label: 'Propriétaire', variant: 'brand',   perms: ['Tout accès', 'Facturation', 'Équipe', 'Paramètres'] },
  manager: { label: 'Manager',      variant: 'success',  perms: ['Dashboard', 'Commandes', 'Menu', 'Inventaire', 'Livreurs'] },
  staff:   { label: 'Staff',        variant: 'info',     perms: ['Commandes', 'POS', 'Menu (lecture)'] },
  driver:  { label: 'Livreur',      variant: 'warning',  perms: ['Interface livreur', 'GPS tracking'] },
};

const INIT_TEAM: TeamMember[] = [
  { id: 't1', name: 'Jean Dupont',    email: 'jean@foodstack.fr',   role: 'owner',   active: true,  lastLogin: 'Aujourd\'hui 09:14', avatar: 'JD' },
  { id: 't2', name: 'Claire Morin',   email: 'claire@foodstack.fr', role: 'manager', active: true,  lastLogin: 'Aujourd\'hui 08:52', avatar: 'CM' },
  { id: 't3', name: 'Lucas Bernard',  email: 'lucas@foodstack.fr',  role: 'staff',   active: true,  lastLogin: 'Hier 22:30',         avatar: 'LB' },
  { id: 't4', name: 'Yasmine Kader',  email: 'yasmine@foodstack.fr',role: 'staff',   active: false, lastLogin: 'il y a 5 jours',     avatar: 'YK' },
  { id: 't5', name: 'Karim Benali',   email: 'karim@foodstack.fr',  role: 'driver',  active: true,  lastLogin: 'Aujourd\'hui 11:05', avatar: 'KB' },
];

function EquipeTab() {
  const [members, setMembers] = useState<TeamMember[]>(INIT_TEAM);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteForm, setInviteForm] = useState({ name: '', email: '', role: 'staff' as MemberRole });
  const [editId, setEditId] = useState<string | null>(null);

  const toggleActive = (id: string) =>
    setMembers((prev) => prev.map((m) => m.id === id ? { ...m, active: !m.active } : m));

  const remove = (id: string) =>
    setMembers((prev) => prev.filter((m) => m.id !== id));

  const handleInvite = () => {
    if (!inviteForm.name || !inviteForm.email) return;
    const newMember: TeamMember = {
      id: `t${Date.now()}`,
      name: inviteForm.name,
      email: inviteForm.email,
      role: inviteForm.role,
      active: true,
      lastLogin: 'Jamais connecté',
      avatar: inviteForm.name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase(),
    };
    setMembers((prev) => [...prev, newMember]);
    setInviteForm({ name: '', email: '', role: 'staff' });
    setShowInvite(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-surface-700">{members.length} membres · {members.filter((m) => m.active).length} actifs</p>
        </div>
        <button
          onClick={() => setShowInvite(!showInvite)}
          className="flex items-center gap-2 rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-brand-600 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Inviter un membre
        </button>
      </div>

      {/* Invite form */}
      <AnimatePresence>
        {showInvite && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="rounded-2xl border border-brand-200 bg-brand-50 p-5">
              <h3 className="mb-4 text-sm font-bold text-brand-900">Inviter un nouveau membre</h3>
              <div className="grid gap-3 sm:grid-cols-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-surface-600">Nom complet</label>
                  <input
                    placeholder="Marie Dupont"
                    value={inviteForm.name}
                    onChange={(e) => setInviteForm((f) => ({ ...f, name: e.target.value }))}
                    className="w-full rounded-xl border border-surface-200 bg-white px-3 py-2.5 text-sm text-surface-900 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-surface-600">Email</label>
                  <input
                    type="email"
                    placeholder="marie@restaurant.fr"
                    value={inviteForm.email}
                    onChange={(e) => setInviteForm((f) => ({ ...f, email: e.target.value }))}
                    className="w-full rounded-xl border border-surface-200 bg-white px-3 py-2.5 text-sm text-surface-900 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-surface-600">Rôle</label>
                  <select
                    value={inviteForm.role}
                    onChange={(e) => setInviteForm((f) => ({ ...f, role: e.target.value as MemberRole }))}
                    className="w-full rounded-xl border border-surface-200 bg-white px-3 py-2.5 text-sm text-surface-900 outline-none focus:border-brand-400"
                  >
                    {(Object.keys(ROLE_CONFIG) as MemberRole[]).map((r) => (
                      <option key={r} value={r}>{ROLE_CONFIG[r].label}</option>
                    ))}
                  </select>
                </div>
              </div>
              {inviteForm.role && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  <Shield className="h-3.5 w-3.5 text-surface-400 mt-0.5" />
                  {ROLE_CONFIG[inviteForm.role].perms.map((p) => (
                    <span key={p} className="rounded-full bg-white border border-surface-200 px-2.5 py-0.5 text-xs text-surface-600">{p}</span>
                  ))}
                </div>
              )}
              <div className="mt-4 flex gap-2">
                <button onClick={handleInvite} className="rounded-xl bg-brand-500 px-5 py-2 text-sm font-semibold text-white hover:bg-brand-600 transition-colors">
                  Envoyer l&apos;invitation
                </button>
                <button onClick={() => setShowInvite(false)} className="rounded-xl border border-surface-200 px-5 py-2 text-sm font-medium text-surface-600 hover:bg-surface-50 transition-colors">
                  Annuler
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Members list */}
      <div className="overflow-hidden rounded-2xl border border-surface-200 bg-white">
        <table className="w-full">
          <thead>
            <tr className="border-b border-surface-100 bg-surface-50">
              {['Membre', 'Rôle', 'Statut', 'Dernière connexion', 'Actions'].map((h) => (
                <th key={h} className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-surface-400">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-50">
            {members.map((member) => {
              const roleCfg = ROLE_CONFIG[member.role];
              return (
                <motion.tr key={member.id} layout className="hover:bg-surface-50 transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white ${
                        member.active ? 'bg-gradient-to-br from-brand-400 to-brand-600' : 'bg-surface-300'
                      }`}>
                        {member.avatar}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-surface-900">{member.name}</p>
                        <p className="truncate text-xs text-surface-400">{member.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <Badge variant={roleCfg.variant}>{roleCfg.label}</Badge>
                  </td>
                  <td className="px-5 py-4">
                    <button
                      onClick={() => toggleActive(member.id)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${member.active ? 'bg-brand-500' : 'bg-surface-200'}`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${member.active ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                  </td>
                  <td className="px-5 py-4">
                    <p className="text-sm text-surface-500">{member.lastLogin}</p>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <button className="rounded-lg p-1.5 text-surface-400 hover:bg-surface-100 hover:text-surface-700 transition-colors">
                        <Edit2 className="h-4 w-4" />
                      </button>
                      {member.role !== 'owner' && (
                        <button
                          onClick={() => remove(member.id)}
                          className="rounded-lg p-1.5 text-surface-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Role permissions */}
      <div>
        <p className="mb-3 text-sm font-semibold text-surface-700">Permissions par rôle</p>
        <div className="grid gap-3 sm:grid-cols-2">
          {(Object.entries(ROLE_CONFIG) as [MemberRole, typeof ROLE_CONFIG[MemberRole]][]).map(([role, cfg]) => (
            <div key={role} className="rounded-2xl border border-surface-200 bg-white p-4">
              <div className="mb-3 flex items-center gap-2">
                <Shield className="h-4 w-4 text-surface-400" />
                <Badge variant={cfg.variant}>{cfg.label}</Badge>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {cfg.perms.map((p) => (
                  <span key={p} className="flex items-center gap-1 rounded-full bg-surface-100 px-2.5 py-1 text-xs text-surface-600">
                    <Check className="h-3 w-3 text-green-500" />
                    {p}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Périphériques tab ─────────────────────────────────────────────────────────

type ConnType = 'bluetooth' | 'wifi' | 'usb';
interface Device { id: string; name: string; model: string; conn: ConnType; status: 'connected' | 'disconnected'; }

const CONN_ICONS: Record<ConnType, React.ElementType> = { bluetooth: Bluetooth, wifi: Wifi, usb: Usb };
const CONN_LABEL: Record<ConnType, string> = { bluetooth: 'Bluetooth', wifi: 'Wi-Fi', usb: 'USB' };

function PeripheriquesTab() {
  const [printers, setPrinters] = useState<Device[]>([
    { id: 'p1', name: 'Caisse principale', model: 'Epson TM-T20III', conn: 'usb', status: 'connected' },
    { id: 'p2', name: 'Cuisine',           model: 'Star TSP143III',  conn: 'wifi', status: 'connected' },
    { id: 'p3', name: 'Bar',               model: 'Bixolon SRP-350V',conn: 'bluetooth', status: 'disconnected' },
  ]);
  const [tpes, setTpes] = useState<Device[]>([
    { id: 't1', name: 'Terminal 1', model: 'Ingenico Move 5000', conn: 'bluetooth', status: 'connected' },
    { id: 't2', name: 'Terminal 2', model: 'Verifone V400m',     conn: 'wifi',      status: 'disconnected' },
  ]);
  const [showAddPrinter, setShowAddPrinter] = useState(false);
  const [showAddTPE, setShowAddTPE] = useState(false);
  const [addForm, setAddForm] = useState({ name: '', model: '', conn: 'usb' as ConnType });

  function testConnection(id: string, list: Device[], setList: React.Dispatch<React.SetStateAction<Device[]>>) {
    setList(prev => prev.map(d => d.id === id ? { ...d, status: 'connected' } : d));
    import('react-hot-toast').then(({ default: toast }) => toast.success('Connexion établie'));
  }

  function DeviceList({ devices, setDevices, type }: { devices: Device[]; setDevices: React.Dispatch<React.SetStateAction<Device[]>>; type: string }) {
    return (
      <div className="space-y-3">
        {devices.map(d => {
          const ConnIcon = CONN_ICONS[d.conn];
          return (
            <div key={d.id} className="flex items-center gap-4 rounded-xl border border-surface-200 bg-white p-4">
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${type === 'printer' ? 'bg-blue-50' : 'bg-purple-50'}`}>
                {type === 'printer' ? <Printer className="h-5 w-5 text-blue-600" /> : <TPEIcon className="h-5 w-5 text-purple-600" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-surface-900">{d.name}</p>
                <p className="text-xs text-surface-500">{d.model}</p>
                <div className="mt-1 flex items-center gap-2">
                  <ConnIcon className="h-3 w-3 text-surface-400" />
                  <span className="text-xs text-surface-500">{CONN_LABEL[d.conn]}</span>
                  <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${d.status === 'connected' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${d.status === 'connected' ? 'bg-green-500' : 'bg-red-500'}`} />
                    {d.status === 'connected' ? 'Connecté' : 'Déconnecté'}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => testConnection(d.id, devices, setDevices)}
                  className="rounded-lg border border-surface-200 bg-white px-3 py-1.5 text-xs font-medium text-surface-700 hover:bg-surface-50 transition-colors"
                >
                  Test
                </button>
                <button
                  onClick={() => setDevices(prev => prev.filter(x => x.id !== d.id))}
                  className="rounded-lg p-1.5 text-red-400 hover:bg-red-50 transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  function AddModal({ onAdd, onClose, type }: { onAdd: (d: Device) => void; onClose: () => void; type: string }) {
    const [form, setForm] = useState({ name: '', model: '', conn: 'usb' as ConnType });
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
        <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl" onClick={e => e.stopPropagation()}>
          <h3 className="mb-4 text-base font-bold text-surface-900">Ajouter {type === 'printer' ? 'une imprimante' : 'un TPE'}</h3>
          <div className="space-y-3">
            <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Nom du périphérique" className="w-full rounded-xl border border-surface-200 bg-surface-50 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none" />
            <input value={form.model} onChange={e => setForm(f => ({ ...f, model: e.target.value }))} placeholder="Modèle" className="w-full rounded-xl border border-surface-200 bg-surface-50 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none" />
            <select value={form.conn} onChange={e => setForm(f => ({ ...f, conn: e.target.value as ConnType }))} className="w-full rounded-xl border border-surface-200 bg-surface-50 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none">
              <option value="usb">USB</option>
              <option value="bluetooth">Bluetooth</option>
              <option value="wifi">Wi-Fi</option>
            </select>
          </div>
          <div className="mt-4 flex justify-end gap-3">
            <button onClick={onClose} className="rounded-xl border border-surface-200 px-4 py-2 text-sm font-medium text-surface-700 hover:bg-surface-50">Annuler</button>
            <button onClick={() => { if (form.name) { onAdd({ id: Date.now().toString(), ...form, status: 'disconnected' }); onClose(); } }} className="rounded-xl bg-brand-500 px-4 py-2 text-sm font-semibold text-black hover:bg-brand-600">Ajouter</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Printers */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-surface-900">Imprimantes</h3>
            <p className="text-xs text-surface-500 mt-0.5">Gestion des imprimantes tickets et cuisine</p>
          </div>
          <button onClick={() => setShowAddPrinter(true)} className="flex items-center gap-2 rounded-xl bg-brand-500 px-4 py-2 text-sm font-semibold text-black hover:bg-brand-600 transition-colors">
            <Plus className="h-4 w-4" /> Ajouter
          </button>
        </div>
        <DeviceList devices={printers} setDevices={setPrinters} type="printer" />
      </div>

      {/* TPEs */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-surface-900">Terminaux de paiement (TPE)</h3>
            <p className="text-xs text-surface-500 mt-0.5">Connexion Bluetooth / Wi-Fi aux terminaux bancaires</p>
          </div>
          <button onClick={() => setShowAddTPE(true)} className="flex items-center gap-2 rounded-xl bg-brand-500 px-4 py-2 text-sm font-semibold text-black hover:bg-brand-600 transition-colors">
            <Plus className="h-4 w-4" /> Ajouter
          </button>
        </div>
        <DeviceList devices={tpes} setDevices={setTpes} type="tpe" />
      </div>

      {showAddPrinter && <AddModal type="printer" onAdd={d => setPrinters(p => [...p, d])} onClose={() => setShowAddPrinter(false)} />}
      {showAddTPE && <AddModal type="tpe" onAdd={d => setTpes(t => [...t, d])} onClose={() => setShowAddTPE(false)} />}
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const { user } = useAuthStore();
  const restaurantId = user?.restaurantIds?.[0] ?? '';

  const [activeTab, setActiveTab] = useState<TabId>('general');

  function renderContent() {
    switch (activeTab) {
      case 'general':       return <GeneralTab restaurantId={restaurantId} />;
      case 'horaires':      return <HorairesTab restaurantId={restaurantId} />;
      case 'notifications': return <NotificationsTab />;
      case 'livraison':     return <LivraisonTab />;
      case 'paiements':     return <PaiementsTab />;
      case 'equipe':        return <EquipeTab />;
      case 'peripheriques': return <PeripheriquesTab />;
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
