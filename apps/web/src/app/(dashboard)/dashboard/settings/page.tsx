'use client';

import { useState } from 'react';
import {
  Store,
  Clock,
  MapPin,
  Phone,
  Mail,
  Globe,
  Upload,
  Save,
  Plus,
  Trash2,
  ToggleRight,
  ToggleLeft,
  ChevronDown,
  AlertTriangle,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import toast from 'react-hot-toast';

const DAYS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];

interface DaySchedule {
  open: boolean;
  from: string;
  to: string;
}

type Schedule = Record<string, DaySchedule>;

const DEFAULT_SCHEDULE: Schedule = {
  Lundi:    { open: true,  from: '11:00', to: '22:00' },
  Mardi:    { open: true,  from: '11:00', to: '22:00' },
  Mercredi: { open: true,  from: '11:00', to: '22:00' },
  Jeudi:    { open: true,  from: '11:00', to: '22:00' },
  Vendredi: { open: true,  from: '11:00', to: '23:30' },
  Samedi:   { open: true,  from: '12:00', to: '23:30' },
  Dimanche: { open: false, from: '12:00', to: '21:00' },
};

const DELIVERY_ZONES = [
  { id: 'z1', name: '1er arrondissement', radius: 2, enabled: true },
  { id: 'z2', name: '2ème arrondissement', radius: 2, enabled: true },
  { id: 'z3', name: '8ème arrondissement', radius: 3, enabled: false },
];

const TABS = ['Général', 'Horaires', 'Livraison', 'Intégrations'] as const;
type Tab = typeof TABS[number];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('Général');
  const [saving, setSaving] = useState(false);

  const [general, setGeneral] = useState({
    name: 'FoodStack Montmartre',
    description: 'Burgers artisanaux et pizzas au feu de bois depuis 2018.',
    phone: '01 23 45 67 89',
    email: 'contact@foodstack-montmartre.fr',
    website: 'https://foodstack.fr',
    address: '12 rue Lepic, 75018 Paris',
    minOrder: '15',
    deliveryFee: '2.90',
    deliveryTime: '25',
    currency: 'EUR',
    taxRate: '10',
  });

  const [schedule, setSchedule] = useState<Schedule>(DEFAULT_SCHEDULE);
  const [zones, setZones] = useState(DELIVERY_ZONES);
  const [newZone, setNewZone] = useState({ name: '', radius: '2' });

  const [integrations, setIntegrations] = useState({
    stripe: true,
    googleMaps: false,
    resend: false,
    twilio: false,
  });

  const handleSave = async () => {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 800));
    setSaving(false);
    toast.success('Paramètres sauvegardés');
  };

  const toggleDay = (day: string) =>
    setSchedule((s) => ({ ...s, [day]: { ...s[day], open: !s[day].open } }));

  const updateDay = (day: string, field: 'from' | 'to', value: string) =>
    setSchedule((s) => ({ ...s, [day]: { ...s[day], [field]: value } }));

  const toggleZone = (id: string) =>
    setZones((z) => z.map((z2) => (z2.id === id ? { ...z2, enabled: !z2.enabled } : z2)));

  const removeZone = (id: string) => setZones((z) => z.filter((z2) => z2.id !== id));

  const addZone = () => {
    if (!newZone.name.trim()) return;
    setZones((z) => [...z, { id: `z-${Date.now()}`, name: newZone.name, radius: Number(newZone.radius), enabled: true }]);
    setNewZone({ name: '', radius: '2' });
    toast.success('Zone ajoutée');
  };

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-900">Paramètres</h1>
          <p className="mt-1 text-sm text-surface-500">Configuration de votre restaurant</p>
        </div>
        <Button loading={saving} icon={<Save className="h-4 w-4" />} onClick={handleSave}>
          Sauvegarder
        </Button>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex gap-1 rounded-xl border border-surface-200 bg-surface-50 p-1 w-fit">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === tab
                ? 'bg-white text-surface-900 shadow-sm'
                : 'text-surface-500 hover:text-surface-700'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.15 }}
      >
        {/* ── GÉNÉRAL ── */}
        {activeTab === 'Général' && (
          <div className="space-y-5">
            {/* Logo */}
            <div className="rounded-2xl border border-surface-200 bg-white p-6 shadow-sm">
              <h3 className="mb-4 font-semibold text-surface-900">Identité visuelle</h3>
              <div className="flex items-center gap-5">
                <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-brand-100 text-3xl font-bold text-brand-600">
                  F
                </div>
                <div>
                  <p className="text-sm font-medium text-surface-900">Logo du restaurant</p>
                  <p className="mt-0.5 text-xs text-surface-400">PNG ou JPG, 512×512 px recommandé</p>
                  <button className="mt-2 flex items-center gap-2 rounded-xl border border-surface-200 px-3 py-1.5 text-sm font-medium text-surface-600 hover:bg-surface-50">
                    <Upload className="h-4 w-4" />
                    Changer le logo
                  </button>
                </div>
              </div>
            </div>

            {/* Infos */}
            <div className="rounded-2xl border border-surface-200 bg-white p-6 shadow-sm">
              <h3 className="mb-4 font-semibold text-surface-900">Informations générales</h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="mb-1.5 block text-sm font-semibold text-surface-700">Nom du restaurant</label>
                  <div className="relative">
                    <Store className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-surface-400" />
                    <input value={general.name} onChange={(e) => setGeneral((p) => ({ ...p, name: e.target.value }))}
                      className="h-11 w-full rounded-xl border border-surface-200 pl-9 pr-4 text-sm focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100" />
                  </div>
                </div>
                <div className="sm:col-span-2">
                  <label className="mb-1.5 block text-sm font-semibold text-surface-700">Description</label>
                  <textarea value={general.description} onChange={(e) => setGeneral((p) => ({ ...p, description: e.target.value }))}
                    rows={2} className="w-full rounded-xl border border-surface-200 px-4 py-2.5 text-sm focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100" />
                </div>
                {[
                  { key: 'phone', label: 'Téléphone', icon: Phone },
                  { key: 'email', label: 'Email', icon: Mail },
                  { key: 'website', label: 'Site web', icon: Globe },
                  { key: 'address', label: 'Adresse', icon: MapPin },
                ].map(({ key, label, icon: Icon }) => (
                  <div key={key} className={key === 'address' ? 'sm:col-span-2' : ''}>
                    <label className="mb-1.5 block text-sm font-semibold text-surface-700">{label}</label>
                    <div className="relative">
                      <Icon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-surface-400" />
                      <input value={(general as Record<string, string>)[key]}
                        onChange={(e) => setGeneral((p) => ({ ...p, [key]: e.target.value }))}
                        className="h-11 w-full rounded-xl border border-surface-200 pl-9 pr-4 text-sm focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Commandes */}
            <div className="rounded-2xl border border-surface-200 bg-white p-6 shadow-sm">
              <h3 className="mb-4 font-semibold text-surface-900">Paramètres commandes</h3>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                {[
                  { key: 'minOrder', label: 'Commande min. (€)', suffix: '€' },
                  { key: 'deliveryFee', label: 'Frais livraison (€)', suffix: '€' },
                  { key: 'deliveryTime', label: 'Délai estimé (min)', suffix: 'min' },
                  { key: 'taxRate', label: 'TVA (%)', suffix: '%' },
                ].map(({ key, label }) => (
                  <div key={key}>
                    <label className="mb-1.5 block text-sm font-semibold text-surface-700">{label}</label>
                    <input type="number" min="0" value={(general as Record<string, string>)[key]}
                      onChange={(e) => setGeneral((p) => ({ ...p, [key]: e.target.value }))}
                      className="h-11 w-full rounded-xl border border-surface-200 px-3 text-sm focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── HORAIRES ── */}
        {activeTab === 'Horaires' && (
          <div className="rounded-2xl border border-surface-200 bg-white p-6 shadow-sm">
            <h3 className="mb-1 font-semibold text-surface-900">Horaires d&apos;ouverture</h3>
            <p className="mb-5 text-sm text-surface-500">Configurez les plages horaires pour chaque jour de la semaine</p>
            <div className="space-y-3">
              {DAYS.map((day) => {
                const slot = schedule[day];
                return (
                  <div key={day} className={`flex items-center gap-4 rounded-xl border p-3 transition-colors ${slot.open ? 'border-surface-200' : 'border-surface-100 bg-surface-50'}`}>
                    <div className="w-28 flex-shrink-0">
                      <p className={`text-sm font-medium ${slot.open ? 'text-surface-900' : 'text-surface-400'}`}>{day}</p>
                    </div>
                    <button onClick={() => toggleDay(day)} className="flex-shrink-0">
                      {slot.open
                        ? <ToggleRight className="h-6 w-6 text-green-500" />
                        : <ToggleLeft className="h-6 w-6 text-surface-300" />}
                    </button>
                    {slot.open ? (
                      <div className="flex items-center gap-2">
                        <input type="time" value={slot.from} onChange={(e) => updateDay(day, 'from', e.target.value)}
                          className="h-9 rounded-xl border border-surface-200 px-3 text-sm focus:border-brand-400 focus:outline-none" />
                        <span className="text-surface-400">→</span>
                        <input type="time" value={slot.to} onChange={(e) => updateDay(day, 'to', e.target.value)}
                          className="h-9 rounded-xl border border-surface-200 px-3 text-sm focus:border-brand-400 focus:outline-none" />
                      </div>
                    ) : (
                      <span className="text-sm text-surface-400">Fermé</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── LIVRAISON ── */}
        {activeTab === 'Livraison' && (
          <div className="space-y-5">
            <div className="rounded-2xl border border-surface-200 bg-white p-6 shadow-sm">
              <h3 className="mb-1 font-semibold text-surface-900">Zones de livraison</h3>
              <p className="mb-5 text-sm text-surface-500">Définissez les zones où vous livrez</p>

              <div className="space-y-3">
                {zones.map((zone) => (
                  <div key={zone.id} className={`flex items-center gap-3 rounded-xl border p-3 ${zone.enabled ? 'border-surface-200' : 'border-surface-100 bg-surface-50 opacity-60'}`}>
                    <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${zone.enabled ? 'bg-brand-100 text-brand-600' : 'bg-surface-200 text-surface-400'}`}>
                      <MapPin className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-surface-900">{zone.name}</p>
                      <p className="text-xs text-surface-400">Rayon : {zone.radius} km</p>
                    </div>
                    <button onClick={() => toggleZone(zone.id)}>
                      {zone.enabled
                        ? <ToggleRight className="h-6 w-6 text-green-500" />
                        : <ToggleLeft className="h-6 w-6 text-surface-300" />}
                    </button>
                    <button onClick={() => removeZone(zone.id)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-surface-400 hover:bg-red-50 hover:text-red-500">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="mt-4 flex gap-3">
                <input value={newZone.name} onChange={(e) => setNewZone((p) => ({ ...p, name: e.target.value }))}
                  placeholder="Nom de la zone"
                  className="h-10 flex-1 rounded-xl border border-surface-200 px-3 text-sm focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100" />
                <input type="number" min="1" max="20" value={newZone.radius}
                  onChange={(e) => setNewZone((p) => ({ ...p, radius: e.target.value }))}
                  placeholder="km"
                  className="h-10 w-20 rounded-xl border border-surface-200 px-3 text-sm focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100" />
                <Button size="sm" icon={<Plus className="h-4 w-4" />} onClick={addZone}>
                  Ajouter
                </Button>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
              <AlertTriangle className="h-5 w-5 flex-shrink-0 text-amber-500 mt-0.5" />
              <p className="text-sm text-amber-700">
                Les polygones de zone sur carte interactive nécessitent une clé API Google Maps configurée dans les variables d&apos;environnement.
              </p>
            </div>
          </div>
        )}

        {/* ── INTÉGRATIONS ── */}
        {activeTab === 'Intégrations' && (
          <div className="space-y-3">
            {[
              { key: 'stripe', name: 'Stripe', desc: 'Paiements en ligne par carte', icon: '💳', docsUrl: '#', configured: true },
              { key: 'googleMaps', name: 'Google Maps', desc: 'Carte de suivi livraison en temps réel', icon: '🗺️', docsUrl: '#', configured: false },
              { key: 'resend', name: 'Resend', desc: 'Emails transactionnels (confirmations, factures)', icon: '📧', docsUrl: '#', configured: false },
              { key: 'twilio', name: 'Twilio', desc: 'Notifications SMS aux clients', icon: '📱', docsUrl: '#', configured: false },
            ].map(({ key, name, desc, icon, configured }) => {
              const enabled = integrations[key as keyof typeof integrations];
              return (
                <div key={key} className="flex items-center gap-4 rounded-2xl border border-surface-200 bg-white p-5 shadow-sm">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-surface-100 text-2xl">
                    {icon}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-surface-900">{name}</p>
                      {configured
                        ? <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">Configuré</span>
                        : <span className="rounded-full bg-surface-100 px-2 py-0.5 text-xs font-medium text-surface-500">Non configuré</span>}
                    </div>
                    <p className="text-sm text-surface-500">{desc}</p>
                  </div>
                  <button
                    onClick={() => setIntegrations((p) => ({ ...p, [key]: !p[key as keyof typeof integrations] }))}
                    className={`relative h-6 w-11 rounded-full transition-colors ${enabled ? 'bg-brand-500' : 'bg-surface-200'}`}
                  >
                    <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${enabled ? 'translate-x-5' : 'translate-x-0.5'}`} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </motion.div>
    </div>
  );
}
