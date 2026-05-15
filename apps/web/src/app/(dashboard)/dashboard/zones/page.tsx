'use client';

import { useState } from 'react';
import {
  Plus,
  MapPin,
  Clock,
  Euro,
  ShoppingBag,
  Activity,
  Target,
  Percent,
  Pencil,
  X,
} from 'lucide-react';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { StatCard } from '@/components/ui/StatCard';
import { Modal } from '@/components/ui/Modal';
import { motion } from 'framer-motion';
import { clsx } from 'clsx';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Zone {
  id: string;
  name: string;
  radiusKm: number;
  feeEuros: number;
  deliveryTimeMin: number;
  deliveryTimeMax: number;
  active: boolean;
  ordersPerWeek: number;
  minOrderEuros: number;
  revenueWeek: number;
  avgOrderValue: number;
  cancellationRate: number;
}

interface AddZoneForm {
  name: string;
  radius: number;
  fee: string;
  minOrder: string;
  deliveryMin: string;
  deliveryMax: string;
}

// ─── Demo data ────────────────────────────────────────────────────────────────

const INITIAL_ZONES: Zone[] = [
  {
    id: 'z1',
    name: 'Zone Centre',
    radiusKm: 2,
    feeEuros: 0,
    deliveryTimeMin: 15,
    deliveryTimeMax: 25,
    active: true,
    ordersPerWeek: 145,
    minOrderEuros: 10,
    revenueWeek: 3480,
    avgOrderValue: 24,
    cancellationRate: 1.4,
  },
  {
    id: 'z2',
    name: 'Zone Proche',
    radiusKm: 4,
    feeEuros: 1.99,
    deliveryTimeMin: 25,
    deliveryTimeMax: 35,
    active: true,
    ordersPerWeek: 89,
    minOrderEuros: 15,
    revenueWeek: 2136,
    avgOrderValue: 24,
    cancellationRate: 2.8,
  },
  {
    id: 'z3',
    name: 'Zone Étendue',
    radiusKm: 6,
    feeEuros: 2.99,
    deliveryTimeMin: 35,
    deliveryTimeMax: 45,
    active: true,
    ordersPerWeek: 52,
    minOrderEuros: 20,
    revenueWeek: 1248,
    avgOrderValue: 24,
    cancellationRate: 4.2,
  },
  {
    id: 'z4',
    name: 'Zone Périphérie',
    radiusKm: 8,
    feeEuros: 3.99,
    deliveryTimeMin: 45,
    deliveryTimeMax: 60,
    active: true,
    ordersPerWeek: 23,
    minOrderEuros: 25,
    revenueWeek: 552,
    avgOrderValue: 24,
    cancellationRate: 6.5,
  },
];

// Zone brand color at different opacities for SVG rings
const ZONE_COLORS = [
  { fill: '#1EFF6A', fillOpacity: 0.18, stroke: '#1EFF6A', strokeOpacity: 0.7 },
  { fill: '#1EFF6A', fillOpacity: 0.11, stroke: '#1EFF6A', strokeOpacity: 0.5 },
  { fill: '#1EFF6A', fillOpacity: 0.07, stroke: '#1EFF6A', strokeOpacity: 0.35 },
  { fill: '#1EFF6A', fillOpacity: 0.04, stroke: '#1EFF6A', strokeOpacity: 0.2 },
];

// ─── SVG Concentric Zones Diagram ─────────────────────────────────────────────

function ZonesDiagram({ zones }: { zones: Zone[] }) {
  const cx = 160;
  const cy = 160;
  const maxRadius = zones[zones.length - 1]?.radiusKm ?? 8;
  const scale = 120 / maxRadius; // px per km, max ring fits in 120px radius

  return (
    <svg viewBox="0 0 320 320" className="w-full max-w-xs mx-auto" aria-label="Carte des zones de livraison">
      {/* Dark background circle */}
      <circle cx={cx} cy={cy} r={145} fill="#0f172a" fillOpacity={0.06} />

      {/* Zones — outermost first so inner layers paint on top */}
      {[...zones].reverse().map((zone, revIdx) => {
        const idx = zones.length - 1 - revIdx;
        const color = ZONE_COLORS[idx] ?? ZONE_COLORS[3];
        const r = zone.radiusKm * scale;
        return (
          <g key={zone.id}>
            <circle
              cx={cx}
              cy={cy}
              r={r}
              fill={color.fill}
              fillOpacity={color.fillOpacity}
              stroke={color.stroke}
              strokeOpacity={color.strokeOpacity}
              strokeWidth={1.5}
            />
          </g>
        );
      })}

      {/* Labels on the right side of each ring */}
      {zones.map((zone) => {
        const r = zone.radiusKm * scale;
        const labelX = cx + r * 0.72;
        const labelY = cy - r * 0.72;
        return (
          <g key={`label-${zone.id}`}>
            <line
              x1={cx + r * 0.65}
              y1={cy - r * 0.65}
              x2={cx + r * 0.58}
              y2={cy - r * 0.58}
              stroke="#1EFF6A"
              strokeOpacity={0.5}
              strokeWidth={1}
            />
            <text
              x={labelX}
              y={labelY - 4}
              fontSize={9}
              fontWeight={600}
              fill="#1EFF6A"
              fillOpacity={0.9}
              textAnchor="middle"
              className="select-none"
            >
              {zone.name}
            </text>
            <text
              x={labelX}
              y={labelY + 7}
              fontSize={8}
              fill="#94a3b8"
              textAnchor="middle"
              className="select-none"
            >
              {zone.radiusKm}km
            </text>
          </g>
        );
      })}

      {/* Centre pin */}
      <circle cx={cx} cy={cy} r={5} fill="#1EFF6A" fillOpacity={0.9} />
      <circle cx={cx} cy={cy} r={2.5} fill="#fff" />

      {/* Compass lines (decorative) */}
      {[0, 90, 180, 270].map((deg) => {
        const rad = (deg * Math.PI) / 180;
        return (
          <line
            key={deg}
            x1={cx + Math.cos(rad) * 8}
            y1={cy + Math.sin(rad) * 8}
            x2={cx + Math.cos(rad) * 130}
            y2={cy + Math.sin(rad) * 130}
            stroke="#1EFF6A"
            strokeOpacity={0.08}
            strokeWidth={1}
            strokeDasharray="3 4"
          />
        );
      })}
    </svg>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ZonesPage() {
  const [zones, setZones] = useState<Zone[]>(INITIAL_ZONES);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editZone, setEditZone] = useState<Zone | null>(null);
  const [addForm, setAddForm] = useState<AddZoneForm>({
    name: '',
    radius: 5,
    fee: '',
    minOrder: '',
    deliveryMin: '',
    deliveryMax: '',
  });

  const totalOrders = zones.reduce((a, z) => a + z.ordersPerWeek, 0);
  const maxRadius = Math.max(...zones.map((z) => z.radiusKm));
  const avgFee =
    zones.filter((z) => z.feeEuros > 0).reduce((a, z) => a + z.feeEuros, 0) /
    (zones.filter((z) => z.feeEuros > 0).length || 1);

  function handleToggleActive(id: string) {
    setZones((prev) =>
      prev.map((z) => (z.id === id ? { ...z, active: !z.active } : z))
    );
  }

  function handleAddZone() {
    const newZone: Zone = {
      id: `z${Date.now()}`,
      name: addForm.name || 'Nouvelle zone',
      radiusKm: addForm.radius,
      feeEuros: parseFloat(addForm.fee || '0'),
      deliveryTimeMin: parseInt(addForm.deliveryMin || '30', 10),
      deliveryTimeMax: parseInt(addForm.deliveryMax || '45', 10),
      active: true,
      ordersPerWeek: 0,
      minOrderEuros: parseFloat(addForm.minOrder || '0'),
      revenueWeek: 0,
      avgOrderValue: 0,
      cancellationRate: 0,
    };
    setZones((prev) => [...prev, newZone]);
    setShowAddModal(false);
    setAddForm({ name: '', radius: 5, fee: '', minOrder: '', deliveryMin: '', deliveryMax: '' });
  }

  function openAddModal() {
    setAddForm({ name: '', radius: 5, fee: '', minOrder: '', deliveryMin: '', deliveryMax: '' });
    setShowAddModal(true);
  }

  const sortedZones = [...zones].sort((a, b) => a.radiusKm - b.radiusKm);

  return (
    <div className="p-6 space-y-6">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-100">Zones de livraison</h1>
          <p className="mt-1 text-sm text-surface-500">{zones.filter((z) => z.active).length} zones actives · rayon max {maxRadius}km</p>
        </div>
        <Button icon={<Plus className="h-4 w-4" />} onClick={openAddModal}>
          Ajouter une zone
        </Button>
      </div>

      {/* ── Stats ── */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Zones actives"
          value={zones.filter((z) => z.active).length}
          icon={MapPin}
          iconColor="text-green-600 dark:text-green-400"
          iconBg="bg-green-50 dark:bg-green-900/20"
        />
        <StatCard
          title="Rayon max"
          value={`${maxRadius} km`}
          icon={Target}
          iconColor="text-blue-600 dark:text-blue-400"
          iconBg="bg-blue-50 dark:bg-blue-900/20"
        />
        <StatCard
          title="Commandes couvertes"
          value="97%"
          icon={Percent}
          iconColor="text-purple-600 dark:text-purple-400"
          iconBg="bg-purple-50 dark:bg-purple-900/20"
        />
        <StatCard
          title="Frais moy. de livraison"
          value={`${avgFee.toFixed(2)}€`}
          icon={Euro}
          iconColor="text-orange-600 dark:text-orange-400"
          iconBg="bg-orange-50 dark:bg-orange-900/20"
        />
      </div>

      {/* ── Map + Zone Cards ── */}
      <div className="grid gap-6 xl:grid-cols-5">
        {/* Leaflet Map */}
        <div className="xl:col-span-2 rounded-2xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 shadow-sm flex flex-col overflow-hidden">
          <div className="px-5 py-4 border-b border-surface-100 dark:border-surface-700 flex items-center gap-2">
            <MapPin className="h-4 w-4 text-brand-500" />
            <h2 className="text-sm font-semibold text-surface-700 dark:text-surface-300">
              Carte des zones
            </h2>
          </div>
          <div className="flex-1 flex items-center justify-center p-6">
            <ZonesDiagram zones={sortedZones} />
          </div>
        </div>

        {/* Zone Cards */}
        <div className="xl:col-span-3 grid gap-4 sm:grid-cols-2 content-start">
          {sortedZones.map((zone, idx) => (
            <motion.div
              key={zone.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.06 }}
              className={clsx(
                'rounded-2xl border p-5 shadow-sm transition-all',
                zone.active
                  ? 'border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800'
                  : 'border-surface-100 dark:border-surface-800 bg-surface-50 dark:bg-surface-900 opacity-60',
              )}
            >
              {/* Card header */}
              <div className="flex items-start justify-between gap-2 mb-4">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand-500/10">
                    <MapPin className="h-4 w-4 text-brand-500" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-surface-900 dark:text-surface-100">{zone.name}</p>
                    <p className="text-xs text-surface-400">Rayon {zone.radiusKm} km</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  {/* Toggle */}
                  <button
                    onClick={() => handleToggleActive(zone.id)}
                    className={clsx(
                      'relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none',
                      zone.active ? 'bg-brand-500' : 'bg-surface-200 dark:bg-surface-600',
                    )}
                    aria-label={zone.active ? 'Désactiver la zone' : 'Activer la zone'}
                  >
                    <span
                      className={clsx(
                        'inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform',
                        zone.active ? 'translate-x-[18px]' : 'translate-x-[3px]',
                      )}
                    />
                  </button>
                  <button
                    onClick={() => setEditZone(zone)}
                    className="rounded-lg p-1 text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-700 hover:text-surface-600 dark:hover:text-surface-300 transition-colors"
                    aria-label="Modifier la zone"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* Metrics */}
              <div className="grid grid-cols-2 gap-y-3 gap-x-4">
                <div>
                  <p className="text-xs text-surface-400 mb-0.5">Frais de livraison</p>
                  <p className="text-sm font-semibold text-surface-900 dark:text-surface-100">
                    {zone.feeEuros === 0 ? (
                      <span className="text-green-600 dark:text-green-400">Offert</span>
                    ) : (
                      `${zone.feeEuros.toFixed(2)}€`
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-surface-400 mb-0.5">Délai estimé</p>
                  <p className="text-sm font-semibold text-surface-900 dark:text-surface-100 flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5 text-surface-400" />
                    {zone.deliveryTimeMin}-{zone.deliveryTimeMax} min
                  </p>
                </div>
                <div>
                  <p className="text-xs text-surface-400 mb-0.5">Commandes / sem.</p>
                  <p className="text-sm font-semibold text-surface-900 dark:text-surface-100 flex items-center gap-1">
                    <ShoppingBag className="h-3.5 w-3.5 text-surface-400" />
                    {zone.ordersPerWeek}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-surface-400 mb-0.5">Statut</p>
                  <Badge variant={zone.active ? 'success' : 'default'} dot>
                    {zone.active ? 'Actif' : 'Inactif'}
                  </Badge>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* ── Performance Table ── */}
      <div>
        <h2 className="mb-4 text-lg font-semibold text-surface-900 dark:text-surface-100">
          Performance par zone — cette semaine
        </h2>
        <div className="overflow-hidden rounded-2xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 shadow-sm">
          <table className="w-full">
            <thead>
              <tr className="border-b border-surface-100 dark:border-surface-700 bg-surface-50 dark:bg-surface-900">
                {['Zone', 'Commandes', 'Revenus', 'Panier moy.', 'Taux annulation'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-surface-400">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-100 dark:divide-surface-700">
              {sortedZones.map((zone) => {
                const orderShare = totalOrders > 0 ? (zone.ordersPerWeek / totalOrders) * 100 : 0;
                return (
                  <tr key={zone.id} className="hover:bg-surface-50 dark:hover:bg-surface-900/50 transition-colors">
                    {/* Zone name */}
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2">
                        <div className="h-2.5 w-2.5 rounded-full bg-brand-500" style={{ opacity: 0.3 + (0.7 * (INITIAL_ZONES.findIndex(z => z.id === zone.id) === -1 ? 0 : (4 - INITIAL_ZONES.findIndex(z => z.id === zone.id)) / 4)) }} />
                        <span className="text-sm font-medium text-surface-900 dark:text-surface-100">{zone.name}</span>
                      </div>
                    </td>
                    {/* Orders */}
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-surface-900 dark:text-surface-100">{zone.ordersPerWeek}</span>
                        <div className="flex-1 max-w-[80px]">
                          <div className="h-1.5 w-full rounded-full bg-surface-100 dark:bg-surface-700">
                            <div
                              className="h-full rounded-full bg-brand-500"
                              style={{ width: `${orderShare}%` }}
                            />
                          </div>
                        </div>
                        <span className="text-xs text-surface-400">{orderShare.toFixed(0)}%</span>
                      </div>
                    </td>
                    {/* Revenue */}
                    <td className="px-4 py-3.5">
                      <span className="text-sm font-semibold text-surface-900 dark:text-surface-100">
                        {zone.revenueWeek.toLocaleString('fr-FR')}€
                      </span>
                    </td>
                    {/* Avg order */}
                    <td className="px-4 py-3.5">
                      <span className="text-sm text-surface-700 dark:text-surface-300">{zone.avgOrderValue}€</span>
                    </td>
                    {/* Cancellation */}
                    <td className="px-4 py-3.5">
                      <span
                        className={clsx(
                          'text-sm font-medium',
                          zone.cancellationRate < 3
                            ? 'text-green-600 dark:text-green-400'
                            : zone.cancellationRate < 6
                            ? 'text-yellow-600 dark:text-yellow-400'
                            : 'text-red-600 dark:text-red-400',
                        )}
                      >
                        {zone.cancellationRate.toFixed(1)}%
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="border-t border-surface-100 dark:border-surface-700 bg-surface-50 dark:bg-surface-900">
                <td className="px-4 py-3 text-xs font-semibold text-surface-600 dark:text-surface-400">Total</td>
                <td className="px-4 py-3 text-sm font-bold text-surface-900 dark:text-surface-100">{totalOrders}</td>
                <td className="px-4 py-3 text-sm font-bold text-surface-900 dark:text-surface-100">
                  {zones.reduce((a, z) => a + z.revenueWeek, 0).toLocaleString('fr-FR')}€
                </td>
                <td className="px-4 py-3 text-sm text-surface-500">—</td>
                <td className="px-4 py-3 text-sm text-surface-500">—</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* ── Add Zone Modal ── */}
      <Modal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Ajouter une zone de livraison"
        description="Configurez le périmètre et les conditions de la nouvelle zone"
        size="md"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setShowAddModal(false)}>Annuler</Button>
            <Button
              icon={<Plus className="h-4 w-4" />}
              onClick={handleAddZone}
              disabled={!addForm.name}
            >
              Créer la zone
            </Button>
          </div>
        }
      >
        <div className="space-y-5">
          <Input
            label="Nom de la zone"
            placeholder="Ex. Zone Nord"
            value={addForm.name}
            onChange={(e) => setAddForm((f) => ({ ...f, name: e.target.value }))}
            leftIcon={<MapPin className="h-4 w-4" />}
            required
          />

          {/* Radius slider */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-surface-700 dark:text-surface-300">
              Rayon de livraison
              <span className="ml-2 font-bold text-brand-500">{addForm.radius} km</span>
            </label>
            <input
              type="range"
              min={1}
              max={15}
              step={0.5}
              value={addForm.radius}
              onChange={(e) => setAddForm((f) => ({ ...f, radius: parseFloat(e.target.value) }))}
              className="w-full h-2 rounded-full appearance-none bg-surface-200 dark:bg-surface-700 accent-brand-500 cursor-pointer"
            />
            <div className="flex justify-between text-xs text-surface-400">
              <span>1 km</span>
              <span>15 km</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Frais de livraison (€)"
              type="number"
              placeholder="0.00"
              min="0"
              step="0.01"
              value={addForm.fee}
              onChange={(e) => setAddForm((f) => ({ ...f, fee: e.target.value }))}
              leftIcon={<Euro className="h-4 w-4" />}
              hint="0 = livraison offerte"
            />
            <Input
              label="Commande min. (€)"
              type="number"
              placeholder="0"
              min="0"
              value={addForm.minOrder}
              onChange={(e) => setAddForm((f) => ({ ...f, minOrder: e.target.value }))}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Délai min. (min)"
              type="number"
              placeholder="20"
              min="5"
              value={addForm.deliveryMin}
              onChange={(e) => setAddForm((f) => ({ ...f, deliveryMin: e.target.value }))}
              leftIcon={<Clock className="h-4 w-4" />}
            />
            <Input
              label="Délai max. (min)"
              type="number"
              placeholder="40"
              min="5"
              value={addForm.deliveryMax}
              onChange={(e) => setAddForm((f) => ({ ...f, deliveryMax: e.target.value }))}
              leftIcon={<Clock className="h-4 w-4" />}
            />
          </div>
        </div>
      </Modal>

      {/* ── Edit Zone Modal (lightweight) ── */}
      <Modal
        open={!!editZone}
        onClose={() => setEditZone(null)}
        title={editZone ? `Modifier — ${editZone.name}` : ''}
        size="sm"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setEditZone(null)}>Fermer</Button>
            <Button onClick={() => setEditZone(null)}>Enregistrer</Button>
          </div>
        }
      >
        {editZone && (
          <div className="space-y-4">
            <Input
              label="Nom"
              defaultValue={editZone.name}
              leftIcon={<MapPin className="h-4 w-4" />}
            />
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Frais (€)"
                type="number"
                defaultValue={editZone.feeEuros.toString()}
                leftIcon={<Euro className="h-4 w-4" />}
              />
              <Input
                label="Rayon (km)"
                type="number"
                defaultValue={editZone.radiusKm.toString()}
              />
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
