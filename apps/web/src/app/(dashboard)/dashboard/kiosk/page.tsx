'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Monitor, Plus, Settings2, Power, PowerOff, Eye,
  Palette, Utensils, Clock, Wifi, WifiOff,
  ToggleLeft, ToggleRight, Edit2, Trash2, ExternalLink,
  CheckCircle, AlertCircle, Package,
} from 'lucide-react';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import Link from 'next/link';

// ── Types ─────────────────────────────────────────────────────────────────────

type KioskMode = 'both' | 'sur_place' | 'emporter';

interface Kiosk {
  id: string;
  name: string;
  location: string;
  active: boolean;
  mode: KioskMode;
  ordersToday: number;
  lastPing: string;
  color: string;
  waitTime: number;
}

// ── Mock data ─────────────────────────────────────────────────────────────────

const INIT_KIOSKS: Kiosk[] = [
  { id: 'k1', name: 'Borne #1 — Entrée', location: 'Hall principal', active: true,  mode: 'both',      ordersToday: 34, lastPing: 'il y a 10s',  color: '#f97316', waitTime: 12 },
  { id: 'k2', name: 'Borne #2 — Salle',  location: 'Salle principale', active: true,  mode: 'sur_place', ordersToday: 22, lastPing: 'il y a 25s',  color: '#f97316', waitTime: 15 },
  { id: 'k3', name: 'Borne #3 — Terrasse', location: 'Terrasse',      active: false, mode: 'both',      ordersToday: 0,  lastPing: 'il y a 4h',   color: '#6366f1', waitTime: 10 },
];

const MODE_LABELS: Record<KioskMode, string> = {
  both: 'Sur place & À emporter',
  sur_place: 'Sur place uniquement',
  emporter: 'À emporter uniquement',
};

const MENU_CATEGORIES = [
  { id: 'entrees',  label: 'Entrées',   enabled: true,  count: 8 },
  { id: 'plats',    label: 'Plats',     enabled: true,  count: 14 },
  { id: 'desserts', label: 'Desserts',  enabled: true,  count: 6 },
  { id: 'boissons', label: 'Boissons',  enabled: true,  count: 10 },
  { id: 'menus',    label: 'Menus',     enabled: false, count: 4 },
];

// ── Add Kiosk Modal ───────────────────────────────────────────────────────────

function AddKioskModal({ onClose, onAdd }: { onClose: () => void; onAdd: (k: Kiosk) => void }) {
  const [form, setForm] = useState({ name: '', location: '', mode: 'both' as KioskMode, color: '#f97316' });

  const handleAdd = () => {
    if (!form.name) return;
    onAdd({
      id: `k${Date.now()}`,
      name: form.name,
      location: form.location || 'Non défini',
      active: false,
      mode: form.mode,
      ordersToday: 0,
      lastPing: 'Jamais',
      color: form.color,
      waitTime: 10,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="mx-4 w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
      >
        <h2 className="mb-5 text-lg font-bold text-surface-900">Ajouter une borne</h2>
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-surface-600">Nom de la borne</label>
            <input
              placeholder="ex: Borne #4 — Caisse"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="w-full rounded-xl border border-surface-200 px-3 py-2.5 text-sm text-surface-900 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-surface-600">Emplacement</label>
            <input
              placeholder="ex: Hall d'entrée, Terrasse..."
              value={form.location}
              onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
              className="w-full rounded-xl border border-surface-200 px-3 py-2.5 text-sm text-surface-900 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-surface-600">Mode de commande</label>
            <select
              value={form.mode}
              onChange={(e) => setForm((f) => ({ ...f, mode: e.target.value as KioskMode }))}
              className="w-full rounded-xl border border-surface-200 bg-white px-3 py-2.5 text-sm text-surface-900 outline-none focus:border-brand-400"
            >
              {(Object.entries(MODE_LABELS) as [KioskMode, string][]).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-surface-600">Couleur d&apos;accentuation</label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={form.color}
                onChange={(e) => setForm((f) => ({ ...f, color: e.target.value }))}
                className="h-10 w-16 cursor-pointer rounded-lg border border-surface-200"
              />
              <span className="text-sm font-mono text-surface-600">{form.color}</span>
            </div>
          </div>
        </div>
        <div className="mt-6 flex gap-3">
          <button onClick={onClose} className="flex-1 rounded-xl border border-surface-200 py-2.5 text-sm font-semibold text-surface-600 hover:bg-surface-50 transition-colors">
            Annuler
          </button>
          <button onClick={handleAdd} className="flex-1 rounded-xl bg-brand-500 py-2.5 text-sm font-semibold text-white hover:bg-brand-600 transition-colors">
            Créer la borne
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ── Kiosk settings panel ──────────────────────────────────────────────────────

function KioskPanel({ kiosk, onClose, onChange }: {
  kiosk: Kiosk;
  onClose: () => void;
  onChange: (id: string, patch: Partial<Kiosk>) => void;
}) {
  const [categories, setCategories] = useState(MENU_CATEGORIES);
  const [waitTime, setWaitTime] = useState(String(kiosk.waitTime));
  const [color, setColor] = useState(kiosk.color);

  const toggleCat = (id: string) =>
    setCategories((prev) => prev.map((c) => c.id === id ? { ...c, enabled: !c.enabled } : c));

  return (
    <motion.div
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 24 }}
      className="flex w-80 shrink-0 flex-col overflow-hidden rounded-2xl border border-surface-200 bg-white shadow-lg"
    >
      <div className="border-b border-surface-100 p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-bold text-surface-900">{kiosk.name}</p>
            <p className="text-xs text-surface-400">{kiosk.location}</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-surface-100">
            <Settings2 className="h-4 w-4 text-surface-400" />
          </button>
        </div>
      </div>

      <div className="flex-1 space-y-5 overflow-y-auto p-5">
        {/* Mode */}
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-surface-600">Mode de commande</label>
          <select
            value={kiosk.mode}
            onChange={(e) => onChange(kiosk.id, { mode: e.target.value as KioskMode })}
            className="w-full rounded-xl border border-surface-200 bg-white px-3 py-2.5 text-sm text-surface-900 outline-none focus:border-brand-400"
          >
            {(Object.entries(MODE_LABELS) as [KioskMode, string][]).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </div>

        {/* Wait time */}
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-surface-600">Temps d&apos;attente affiché (min)</label>
          <input
            type="number"
            min="1"
            max="60"
            value={waitTime}
            onChange={(e) => { setWaitTime(e.target.value); onChange(kiosk.id, { waitTime: Number(e.target.value) }); }}
            className="w-full rounded-xl border border-surface-200 px-3 py-2.5 text-sm text-surface-900 outline-none focus:border-brand-400"
          />
        </div>

        {/* Color */}
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-surface-600">Couleur d&apos;accentuation</label>
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={color}
              onChange={(e) => { setColor(e.target.value); onChange(kiosk.id, { color: e.target.value }); }}
              className="h-10 w-16 cursor-pointer rounded-lg border border-surface-200"
            />
            <div className="flex-1 rounded-xl border border-surface-200 px-3 py-2 font-mono text-sm text-surface-600">{color}</div>
          </div>
        </div>

        {/* Categories */}
        <div>
          <label className="mb-2 block text-xs font-semibold text-surface-600">Catégories affichées</label>
          <div className="space-y-2">
            {categories.map((cat) => (
              <div key={cat.id} className="flex items-center justify-between rounded-xl border border-surface-100 px-3.5 py-2.5 hover:bg-surface-50">
                <div className="flex items-center gap-2">
                  <Utensils className="h-3.5 w-3.5 text-surface-400" />
                  <span className="text-sm text-surface-800">{cat.label}</span>
                  <span className="text-xs text-surface-400">({cat.count})</span>
                </div>
                <button
                  onClick={() => toggleCat(cat.id)}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${cat.enabled ? 'bg-brand-500' : 'bg-surface-200'}`}
                >
                  <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-sm transition-transform ${cat.enabled ? 'translate-x-4.5' : 'translate-x-0.5'}`} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Preview link */}
      <div className="border-t border-surface-100 p-4">
        <Link
          href={`/kiosk/${kiosk.id}`}
          target="_blank"
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-50 py-2.5 text-sm font-semibold text-brand-700 hover:bg-brand-100 transition-colors"
        >
          <ExternalLink className="h-4 w-4" />
          Aperçu de la borne
        </Link>
      </div>
    </motion.div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function KioskPage() {
  const [kiosks, setKiosks] = useState<Kiosk[]>(INIT_KIOSKS);
  const [selected, setSelected] = useState<Kiosk | null>(null);
  const [showAdd, setShowAdd] = useState(false);

  const toggle = (id: string) =>
    setKiosks((prev) => prev.map((k) => k.id === id ? { ...k, active: !k.active } : k));

  const remove = (id: string) => {
    setKiosks((prev) => prev.filter((k) => k.id !== id));
    if (selected?.id === id) setSelected(null);
  };

  const patch = (id: string, p: Partial<Kiosk>) =>
    setKiosks((prev) => prev.map((k) => k.id === id ? { ...k, ...p } : k));

  const add = (k: Kiosk) => setKiosks((prev) => [...prev, k]);

  const activeCount = kiosks.filter((k) => k.active).length;
  const totalOrders = kiosks.reduce((s, k) => s + k.ordersToday, 0);

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-surface-900">Bornes de commande</h1>
          <p className="mt-1 text-sm text-surface-500">{kiosks.length} borne{kiosks.length > 1 ? 's' : ''} · {activeCount} active{activeCount > 1 ? 's' : ''}</p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-600 transition-colors shadow-sm"
        >
          <Plus className="h-4 w-4" />
          Ajouter une borne
        </button>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: 'Bornes actives',    value: activeCount,    icon: Monitor,    color: 'text-green-600',  bg: 'bg-green-50' },
          { label: 'Commandes (jour)',   value: totalOrders,    icon: Package,    color: 'text-brand-600',  bg: 'bg-brand-50' },
          { label: 'En maintenance',     value: kiosks.filter((k) => !k.active).length, icon: AlertCircle, color: 'text-yellow-600', bg: 'bg-yellow-50' },
          { label: 'Bornes totales',     value: kiosks.length,  icon: CheckCircle,color: 'text-blue-600',   bg: 'bg-blue-50' },
        ].map(({ label, value, icon: Icon, color, bg }, i) => (
          <motion.div key={label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Card padding="md" className="flex items-center gap-3">
              <div className={`rounded-xl p-2.5 ${bg}`}><Icon className={`h-5 w-5 ${color}`} /></div>
              <div>
                <p className="text-base font-bold text-surface-900">{value}</p>
                <p className="text-xs text-surface-400">{label}</p>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Content */}
      <div className="flex gap-6">
        {/* Kiosk cards */}
        <div className="flex-1 min-w-0">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <AnimatePresence mode="popLayout">
              {kiosks.map((kiosk) => (
                <motion.div
                  key={kiosk.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                >
                  <Card
                    padding="md"
                    className={`cursor-pointer hover:shadow-md transition-all ${selected?.id === kiosk.id ? 'ring-2 ring-brand-400 shadow-md' : ''}`}
                    onClick={() => setSelected(selected?.id === kiosk.id ? null : kiosk)}
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2 mb-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl" style={{ backgroundColor: kiosk.color + '20' }}>
                          <Monitor className="h-5 w-5" style={{ color: kiosk.color }} />
                        </div>
                        <div className="min-w-0">
                          <p className="truncate font-bold text-surface-900 text-sm">{kiosk.name}</p>
                          <p className="truncate text-xs text-surface-400">{kiosk.location}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        {kiosk.active
                          ? <Wifi className="h-4 w-4 text-green-500" />
                          : <WifiOff className="h-4 w-4 text-surface-300" />}
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-2 mb-4">
                      <div className="rounded-xl bg-surface-50 p-3 text-center">
                        <p className="text-lg font-bold text-surface-900">{kiosk.ordersToday}</p>
                        <p className="text-xs text-surface-400">Commandes</p>
                      </div>
                      <div className="rounded-xl bg-surface-50 p-3 text-center">
                        <p className="text-lg font-bold text-surface-900">{kiosk.waitTime} min</p>
                        <p className="text-xs text-surface-400">Attente</p>
                      </div>
                    </div>

                    <div className="mb-4 flex items-center justify-between">
                      <Badge variant={kiosk.active ? 'success' : 'default'} dot>
                        {kiosk.active ? 'Active' : 'Inactive'}
                      </Badge>
                      <span className="text-xs text-surface-400">{MODE_LABELS[kiosk.mode].split('&')[0].trim()}</span>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <button
                        onClick={(e) => { e.stopPropagation(); toggle(kiosk.id); }}
                        className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-semibold transition-colors ${
                          kiosk.active
                            ? 'bg-red-50 text-red-600 hover:bg-red-100'
                            : 'bg-green-50 text-green-700 hover:bg-green-100'
                        }`}
                      >
                        {kiosk.active ? <PowerOff className="h-3.5 w-3.5" /> : <Power className="h-3.5 w-3.5" />}
                        {kiosk.active ? 'Désactiver' : 'Activer'}
                      </button>
                      <Link
                        href={`/kiosk/${kiosk.id}`}
                        target="_blank"
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center justify-center rounded-xl bg-surface-100 px-3 py-2 text-xs font-semibold text-surface-600 hover:bg-surface-200 transition-colors"
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </Link>
                      <button
                        onClick={(e) => { e.stopPropagation(); remove(kiosk.id); }}
                        className="flex items-center justify-center rounded-xl bg-surface-100 px-3 py-2 text-xs font-semibold text-surface-600 hover:bg-red-50 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    <p className="mt-2.5 text-right text-xs text-surface-400">Dernier ping : {kiosk.lastPing}</p>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {kiosks.length === 0 && (
            <div className="flex h-48 flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-surface-200 text-center">
              <Monitor className="h-8 w-8 text-surface-300" />
              <p className="text-sm text-surface-400">Aucune borne configurée</p>
              <button onClick={() => setShowAdd(true)} className="rounded-xl bg-brand-50 px-4 py-2 text-sm font-semibold text-brand-700 hover:bg-brand-100">
                Ajouter une borne
              </button>
            </div>
          )}
        </div>

        {/* Settings panel */}
        <AnimatePresence>
          {selected && (
            <KioskPanel
              key={selected.id}
              kiosk={kiosks.find((k) => k.id === selected.id) ?? selected}
              onClose={() => setSelected(null)}
              onChange={patch}
            />
          )}
        </AnimatePresence>
      </div>

      {/* Add modal */}
      <AnimatePresence>
        {showAdd && <AddKioskModal onClose={() => setShowAdd(false)} onAdd={add} />}
      </AnimatePresence>
    </div>
  );
}
