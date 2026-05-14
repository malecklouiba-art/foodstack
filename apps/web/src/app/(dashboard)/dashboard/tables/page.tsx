'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TableIcon, Plus, Edit2, Trash2, Users, QrCode,
  CheckCircle, Clock, X, Utensils, LayoutGrid,
  LayoutList, AlertCircle, Download,
} from 'lucide-react';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { QRCodeSVG } from 'qrcode.react';

// ── Types ─────────────────────────────────────────────────────────────────────

type TableStatus = 'free' | 'occupied' | 'reserved' | 'cleaning';

interface RestaurantTable {
  id: string;
  number: number;
  capacity: number;
  status: TableStatus;
  section: string;
  currentOrderId?: string;
  reservedAt?: string;
  reservedBy?: string;
  occupiedSince?: string;
}

// ── Static data ────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<TableStatus, { label: string; color: string; bg: string; dot: string }> = {
  free:     { label: 'Libre',     color: 'text-green-700',  bg: 'bg-green-50',  dot: 'bg-green-500' },
  occupied: { label: 'Occupée',   color: 'text-red-700',    bg: 'bg-red-50',    dot: 'bg-red-500' },
  reserved: { label: 'Réservée',  color: 'text-blue-700',   bg: 'bg-blue-50',   dot: 'bg-blue-500' },
  cleaning: { label: 'Nettoyage', color: 'text-amber-700',  bg: 'bg-amber-50',  dot: 'bg-amber-500' },
};

const SECTIONS = ['Salle principale', 'Terrasse', 'Bar', 'VIP'];

const INIT_TABLES: RestaurantTable[] = [
  { id: 't1',  number: 1,  capacity: 2, status: 'occupied', section: 'Salle principale', currentOrderId: 'ORD-8821', occupiedSince: '12:30' },
  { id: 't2',  number: 2,  capacity: 4, status: 'free',     section: 'Salle principale' },
  { id: 't3',  number: 3,  capacity: 4, status: 'reserved', section: 'Salle principale', reservedAt: '14:00', reservedBy: 'Martin P.' },
  { id: 't4',  number: 4,  capacity: 6, status: 'occupied', section: 'Salle principale', currentOrderId: 'ORD-8819', occupiedSince: '12:00' },
  { id: 't5',  number: 5,  capacity: 2, status: 'cleaning', section: 'Salle principale' },
  { id: 't6',  number: 6,  capacity: 4, status: 'free',     section: 'Salle principale' },
  { id: 't7',  number: 7,  capacity: 8, status: 'free',     section: 'Salle principale' },
  { id: 't8',  number: 8,  capacity: 4, status: 'occupied', section: 'Salle principale', currentOrderId: 'ORD-8820', occupiedSince: '13:15' },
  { id: 't9',  number: 9,  capacity: 2, status: 'free',     section: 'Terrasse' },
  { id: 't10', number: 10, capacity: 4, status: 'free',     section: 'Terrasse' },
  { id: 't11', number: 11, capacity: 6, status: 'occupied', section: 'Terrasse', currentOrderId: 'ORD-8817', occupiedSince: '12:45' },
  { id: 't12', number: 12, capacity: 2, status: 'reserved', section: 'Terrasse', reservedAt: '15:00', reservedBy: 'Dubois L.' },
  { id: 't13', number: 13, capacity: 6, status: 'free',     section: 'Bar' },
  { id: 't14', number: 14, capacity: 4, status: 'free',     section: 'VIP' },
  { id: 't15', number: 15, capacity: 8, status: 'reserved', section: 'VIP', reservedAt: '20:00', reservedBy: 'Leclerc A.' },
];

// ── Modal ──────────────────────────────────────────────────────────────────────

interface TableForm {
  number: string;
  capacity: string;
  section: string;
}

const emptyForm = (): TableForm => ({ number: '', capacity: '4', section: 'Salle principale' });

function TableModal({
  table,
  onClose,
  onSave,
}: {
  table?: RestaurantTable;
  onClose: () => void;
  onSave: (data: TableForm) => void;
}) {
  const [form, setForm] = useState<TableForm>(
    table ? { number: String(table.number), capacity: String(table.capacity), section: table.section } : emptyForm()
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl"
      >
        <div className="mb-5 flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-900">{table ? 'Modifier la table' : 'Ajouter une table'}</h3>
          <button onClick={onClose} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Numéro de table</label>
            <input
              type="number"
              min="1"
              value={form.number}
              onChange={(e) => setForm(f => ({ ...f, number: e.target.value }))}
              className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              placeholder="1"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Capacité (couverts)</label>
            <div className="grid grid-cols-4 gap-2">
              {[2, 4, 6, 8].map(cap => (
                <button
                  key={cap}
                  onClick={() => setForm(f => ({ ...f, capacity: String(cap) }))}
                  className={`flex flex-col items-center gap-1 rounded-xl border py-2.5 text-sm font-medium transition-all ${
                    form.capacity === String(cap)
                      ? 'border-brand-500 bg-brand-500/10 text-brand-700'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  <Users className="h-4 w-4" />
                  {cap}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Section</label>
            <select
              value={form.section}
              onChange={(e) => setForm(f => ({ ...f, section: e.target.value }))}
              className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:border-brand-500 focus:outline-none"
            >
              {SECTIONS.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          <Button variant="secondary" className="flex-1" onClick={onClose}>Annuler</Button>
          <Button
            className="flex-1"
            onClick={() => onSave(form)}
            disabled={!form.number || !form.capacity}
          >
            {table ? 'Enregistrer' : 'Ajouter'}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}

// ── QR Modal ──────────────────────────────────────────────────────────────────

function QRModal({ table, onClose }: { table: RestaurantTable; onClose: () => void }) {
  const url = `${typeof window !== 'undefined' ? window.location.origin : 'https://foodstack.app'}/menu?table=${table.number}`;

  function download() {
    const svg = document.getElementById(`qr-table-${table.id}`)!;
    const svgData = new XMLSerializer().serializeToString(svg);
    const blob = new Blob([svgData], { type: 'image/svg+xml' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `table-${table.number}-qr.svg`;
    a.click();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-xs rounded-2xl bg-white p-6 shadow-xl text-center"
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-900">QR Code — Table {table.number}</h3>
          <button onClick={onClose} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100">
            <X className="h-4 w-4" />
          </button>
        </div>
        <p className="mb-4 text-xs text-gray-500">{table.section} · {table.capacity} couverts</p>
        <div className="flex justify-center rounded-xl border border-gray-100 bg-gray-50 p-4">
          <QRCodeSVG id={`qr-table-${table.id}`} value={url} size={160} level="M" />
        </div>
        <p className="mt-3 break-all text-xs text-gray-400">{url}</p>
        <Button className="mt-4 w-full" onClick={download} icon={<Download className="h-4 w-4" />}>
          Télécharger SVG
        </Button>
      </motion.div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function TablesPage() {
  const [tables, setTables] = useState<RestaurantTable[]>(INIT_TABLES);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sectionFilter, setSectionFilter] = useState<string>('Tous');
  const [statusFilter, setStatusFilter] = useState<TableStatus | 'all'>('all');
  const [editingTable, setEditingTable] = useState<RestaurantTable | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [qrTable, setQrTable] = useState<RestaurantTable | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const sections = ['Tous', ...SECTIONS.filter(s => tables.some(t => t.section === s))];

  const filtered = tables.filter(t => {
    if (sectionFilter !== 'Tous' && t.section !== sectionFilter) return false;
    if (statusFilter !== 'all' && t.status !== statusFilter) return false;
    return true;
  });

  const stats = {
    total: tables.length,
    free: tables.filter(t => t.status === 'free').length,
    occupied: tables.filter(t => t.status === 'occupied').length,
    reserved: tables.filter(t => t.status === 'reserved').length,
    covers: tables.filter(t => t.status === 'occupied').reduce((s, t) => s + t.capacity, 0),
  };

  function openAdd() {
    setEditingTable(null);
    setShowModal(true);
  }

  function openEdit(table: RestaurantTable) {
    setEditingTable(table);
    setShowModal(true);
  }

  function handleSave(form: TableForm) {
    if (editingTable) {
      setTables(prev => prev.map(t =>
        t.id === editingTable.id
          ? { ...t, number: Number(form.number), capacity: Number(form.capacity), section: form.section }
          : t
      ));
    } else {
      setTables(prev => [...prev, {
        id: `t${Date.now()}`,
        number: Number(form.number),
        capacity: Number(form.capacity),
        section: form.section,
        status: 'free',
      }]);
    }
    setShowModal(false);
  }

  function cycleStatus(table: RestaurantTable) {
    const cycle: TableStatus[] = ['free', 'occupied', 'reserved', 'cleaning'];
    const next = cycle[(cycle.indexOf(table.status) + 1) % cycle.length];
    setTables(prev => prev.map(t => t.id === table.id ? { ...t, status: next } : t));
  }

  function confirmDelete(id: string) { setDeleteId(id); }
  function doDelete() {
    if (deleteId) setTables(prev => prev.filter(t => t.id !== deleteId));
    setDeleteId(null);
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestion des tables</h1>
          <p className="mt-1 text-sm text-gray-500">{tables.length} tables · {stats.occupied} occupées · {stats.free} libres</p>
        </div>
        <Button onClick={openAdd} icon={<Plus className="h-4 w-4" />}>
          Ajouter une table
        </Button>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'Tables libres',   value: stats.free,     icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'Occupées',         value: stats.occupied, icon: Utensils,    color: 'text-red-600',   bg: 'bg-red-50' },
          { label: 'Réservées',        value: stats.reserved, icon: Clock,       color: 'text-blue-600',  bg: 'bg-blue-50' },
          { label: 'Couverts servis',  value: stats.covers,   icon: Users,       color: 'text-purple-600',bg: 'bg-purple-50' },
        ].map(s => {
          const Icon = s.icon;
          return (
            <Card key={s.label} padding="md" className="flex items-center gap-3">
              <div className={`rounded-xl p-2.5 ${s.bg}`}>
                <Icon className={`h-5 w-5 ${s.color}`} />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{s.value}</p>
                <p className="text-xs text-gray-500">{s.label}</p>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Filters + view toggle */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Section tabs */}
        <div className="flex gap-1 rounded-xl border border-gray-200 bg-white p-1">
          {sections.map(s => (
            <button
              key={s}
              onClick={() => setSectionFilter(s)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-all ${
                sectionFilter === s ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        {/* Status filter */}
        <div className="flex gap-1 rounded-xl border border-gray-200 bg-white p-1">
          <button
            onClick={() => setStatusFilter('all')}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-all ${statusFilter === 'all' ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
          >
            Toutes
          </button>
          {(Object.keys(STATUS_CONFIG) as TableStatus[]).map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-all ${statusFilter === s ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              {STATUS_CONFIG[s].label}
            </button>
          ))}
        </div>

        <div className="ml-auto flex gap-1 rounded-xl border border-gray-200 bg-white p-1">
          <button
            onClick={() => setViewMode('grid')}
            className={`rounded-lg p-1.5 transition-all ${viewMode === 'grid' ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
          >
            <LayoutGrid className="h-4 w-4" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`rounded-lg p-1.5 transition-all ${viewMode === 'list' ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
          >
            <LayoutList className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Tables grid */}
      {viewMode === 'grid' ? (
        <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          <AnimatePresence>
            {filtered.map(table => {
              const cfg = STATUS_CONFIG[table.status];
              return (
                <motion.div
                  key={table.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                >
                  <div className={`relative rounded-2xl border-2 p-4 transition-all ${
                    table.status === 'occupied' ? 'border-red-200 bg-red-50/50' :
                    table.status === 'reserved' ? 'border-blue-200 bg-blue-50/50' :
                    table.status === 'cleaning' ? 'border-amber-200 bg-amber-50/50' :
                    'border-green-200 bg-green-50/50'
                  }`}>
                    {/* Status dot */}
                    <div className={`absolute right-3 top-3 h-2.5 w-2.5 rounded-full ${cfg.dot}`} />

                    {/* Table number */}
                    <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-white shadow-sm">
                      <span className="text-xl font-bold text-gray-900">{table.number}</span>
                    </div>

                    <div className="mb-3">
                      <div className="flex items-center gap-1 text-sm font-semibold text-gray-800">
                        <Users className="h-3.5 w-3.5 text-gray-500" />
                        {table.capacity} couverts
                      </div>
                      <p className="mt-0.5 text-xs text-gray-500">{table.section}</p>
                      {table.status === 'occupied' && table.occupiedSince && (
                        <p className="mt-1 text-xs text-red-600">Depuis {table.occupiedSince}</p>
                      )}
                      {table.status === 'reserved' && (
                        <p className="mt-1 text-xs text-blue-600">{table.reservedAt} — {table.reservedBy}</p>
                      )}
                    </div>

                    <div className={`mb-3 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${cfg.bg} ${cfg.color}`}>
                      <div className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
                      {cfg.label}
                    </div>

                    <div className="flex gap-1.5">
                      <button
                        onClick={() => cycleStatus(table)}
                        title="Changer le statut"
                        className="flex-1 rounded-lg bg-white py-1.5 text-xs font-medium text-gray-700 shadow-sm hover:bg-gray-50"
                      >
                        Statut
                      </button>
                      <button
                        onClick={() => setQrTable(table)}
                        className="rounded-lg bg-white p-1.5 shadow-sm hover:bg-gray-50"
                        title="QR Code"
                      >
                        <QrCode className="h-3.5 w-3.5 text-gray-600" />
                      </button>
                      <button
                        onClick={() => openEdit(table)}
                        className="rounded-lg bg-white p-1.5 shadow-sm hover:bg-gray-50"
                        title="Modifier"
                      >
                        <Edit2 className="h-3.5 w-3.5 text-gray-600" />
                      </button>
                      <button
                        onClick={() => confirmDelete(table.id)}
                        className="rounded-lg bg-white p-1.5 shadow-sm hover:bg-red-50"
                        title="Supprimer"
                      >
                        <Trash2 className="h-3.5 w-3.5 text-red-400" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      ) : (
        /* List view */
        <Card padding="none">
          <div className="divide-y divide-gray-100">
            {filtered.map(table => {
              const cfg = STATUS_CONFIG[table.status];
              return (
                <div key={table.id} className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-gray-100 font-bold text-gray-900">
                    {table.number}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">Table {table.number}</span>
                      <span className="text-gray-400">·</span>
                      <span className="text-sm text-gray-500">{table.section}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Users className="h-3.5 w-3.5" />
                      {table.capacity} couverts
                      {table.status === 'occupied' && table.currentOrderId && (
                        <span className="text-red-600">· {table.currentOrderId}</span>
                      )}
                      {table.status === 'reserved' && (
                        <span className="text-blue-600">· {table.reservedAt} — {table.reservedBy}</span>
                      )}
                    </div>
                  </div>
                  <div className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${cfg.bg} ${cfg.color}`}>
                    <div className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
                    {cfg.label}
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => cycleStatus(table)} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600" title="Changer statut">
                      <Clock className="h-4 w-4" />
                    </button>
                    <button onClick={() => setQrTable(table)} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600" title="QR Code">
                      <QrCode className="h-4 w-4" />
                    </button>
                    <button onClick={() => openEdit(table)} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600" title="Modifier">
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button onClick={() => confirmDelete(table.id)} className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500" title="Supprimer">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Modals */}
      <AnimatePresence>
        {showModal && (
          <TableModal
            table={editingTable || undefined}
            onClose={() => setShowModal(false)}
            onSave={handleSave}
          />
        )}
        {qrTable && <QRModal table={qrTable} onClose={() => setQrTable(null)} />}
        {deleteId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl"
            >
              <div className="mb-4 flex items-start gap-3">
                <div className="rounded-xl bg-red-50 p-2.5">
                  <AlertCircle className="h-5 w-5 text-red-500" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">Supprimer cette table ?</h3>
                  <p className="mt-1 text-sm text-gray-500">Cette action est irréversible.</p>
                </div>
              </div>
              <div className="flex gap-3">
                <Button variant="secondary" className="flex-1" onClick={() => setDeleteId(null)}>Annuler</Button>
                <Button variant="danger" className="flex-1" onClick={doDelete}>Supprimer</Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
