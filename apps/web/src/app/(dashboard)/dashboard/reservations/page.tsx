'use client';

import { useState, useCallback } from 'react';
import {
  Calendar,
  Plus,
  Users,
  Table2,
  BarChart3,
  LayoutGrid,
  Clock,
  X,
  Check,
  UserCheck,
  XCircle,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';

// ─── Types ────────────────────────────────────────────────────────────────────

type TableStatus = 'libre' | 'reserve' | 'occupe' | 'hors-service';
type ReservationStatus = 'confirmee' | 'attente' | 'annulee' | 'arrivee';
type ViewMode = 'floor' | 'timeline';

interface TableData {
  id: string;
  number: number;
  seats: number;
  status: TableStatus;
  reservationId?: string;
}

interface Reservation {
  id: string;
  time: string;
  name: string;
  phone: string;
  email: string;
  covers: number;
  tableId: string;
  status: ReservationStatus;
  notes: string;
  duration: number; // minutes
}

interface NewReservationForm {
  name: string;
  phone: string;
  email: string;
  covers: string;
  date: string;
  time: string;
  tableId: string;
  notes: string;
}

// ─── Mock data ────────────────────────────────────────────────────────────────

const TODAY = '2026-05-13';

const MOCK_RESERVATIONS: Reservation[] = [
  { id: 'R001', time: '12:00', name: 'Dupont Marie', phone: '06 12 34 56 78', email: 'marie.dupont@email.com', covers: 2, tableId: 'T3', status: 'arrivee', notes: '', duration: 90 },
  { id: 'R002', time: '12:00', name: 'Martin Paul', phone: '06 23 45 67 89', email: 'paul.martin@email.com', covers: 4, tableId: 'T5', status: 'arrivee', notes: 'Anniversaire', duration: 90 },
  { id: 'R003', time: '12:15', name: 'Bernard Claire', phone: '06 34 56 78 90', email: 'claire.bernard@email.com', covers: 3, tableId: 'T2', status: 'arrivee', notes: '', duration: 75 },
  { id: 'R004', time: '12:30', name: 'Rousseau Jules', phone: '06 45 67 89 01', email: 'jules.rousseau@email.com', covers: 6, tableId: 'T8', status: 'confirmee', notes: 'Menu végétarien', duration: 90 },
  { id: 'R005', time: '12:45', name: 'Petit Sophie', phone: '06 56 78 90 12', email: 'sophie.petit@email.com', covers: 2, tableId: 'T1', status: 'confirmee', notes: '', duration: 60 },
  { id: 'R006', time: '13:00', name: 'Laurent Thomas', phone: '06 67 89 01 23', email: 'thomas.laurent@email.com', covers: 5, tableId: 'T6', status: 'confirmee', notes: 'Allergie aux noix', duration: 90 },
  { id: 'R007', time: '13:00', name: 'Simon Emma', phone: '06 78 90 12 34', email: 'emma.simon@email.com', covers: 4, tableId: 'T4', status: 'attente', notes: '', duration: 90 },
  { id: 'R008', time: '13:30', name: 'Moreau Nicolas', phone: '06 89 01 23 45', email: 'nicolas.moreau@email.com', covers: 2, tableId: 'T9', status: 'attente', notes: '', duration: 60 },
  { id: 'R009', time: '14:00', name: 'Garcia Ana', phone: '06 90 12 34 56', email: 'ana.garcia@email.com', covers: 8, tableId: 'T10', status: 'confirmee', notes: 'Repas d\'affaires', duration: 120 },
  { id: 'R010', time: '14:30', name: 'Fontaine Luc', phone: '07 01 23 45 67', email: 'luc.fontaine@email.com', covers: 3, tableId: 'T7', status: 'confirmee', notes: '', duration: 75 },
  { id: 'R011', time: '19:00', name: 'Chevalier Inès', phone: '07 12 34 56 78', email: 'ines.chevalier@email.com', covers: 2, tableId: 'T1', status: 'confirmee', notes: '', duration: 90 },
  { id: 'R012', time: '19:00', name: 'Lefebvre Marc', phone: '07 23 45 67 89', email: 'marc.lefebvre@email.com', covers: 4, tableId: 'T3', status: 'confirmee', notes: 'Table romantique', duration: 90 },
  { id: 'R013', time: '19:15', name: 'Kowalski Zoé', phone: '07 34 56 78 90', email: 'zoe.kowalski@email.com', covers: 6, tableId: 'T6', status: 'attente', notes: '', duration: 90 },
  { id: 'R014', time: '19:30', name: 'Dubois Alice', phone: '07 45 67 89 01', email: 'alice.dubois@email.com', covers: 2, tableId: 'T2', status: 'confirmee', notes: '', duration: 90 },
  { id: 'R015', time: '20:00', name: 'Lambert Éric', phone: '07 56 78 90 12', email: 'eric.lambert@email.com', covers: 10, tableId: 'T11', status: 'confirmee', notes: 'Réunion de famille', duration: 120 },
  { id: 'R016', time: '20:00', name: 'Perrin Cécile', phone: '07 67 89 01 23', email: 'cecile.perrin@email.com', covers: 4, tableId: 'T5', status: 'confirmee', notes: '', duration: 90 },
  { id: 'R017', time: '20:30', name: 'Colin Théo', phone: '07 78 90 12 34', email: 'theo.colin@email.com', covers: 2, tableId: 'T4', status: 'annulee', notes: '', duration: 90 },
  { id: 'R018', time: '21:00', name: 'Renard Julie', phone: '07 89 01 23 45', email: 'julie.renard@email.com', covers: 3, tableId: 'T9', status: 'confirmee', notes: '', duration: 75 },
];

const INITIAL_TABLES: TableData[] = [
  { id: 'T1', number: 1, seats: 2, status: 'reserve', reservationId: 'R005' },
  { id: 'T2', number: 2, seats: 4, status: 'occupe', reservationId: 'R003' },
  { id: 'T3', number: 3, seats: 2, status: 'occupe', reservationId: 'R001' },
  { id: 'T4', number: 4, seats: 4, status: 'reserve', reservationId: 'R007' },
  { id: 'T5', number: 5, seats: 4, status: 'occupe', reservationId: 'R002' },
  { id: 'T6', number: 6, seats: 6, status: 'reserve', reservationId: 'R006' },
  { id: 'T7', number: 7, seats: 4, status: 'libre', reservationId: undefined },
  { id: 'T8', number: 8, seats: 8, status: 'reserve', reservationId: 'R004' },
  { id: 'T9', number: 9, seats: 2, status: 'reserve', reservationId: 'R008' },
  { id: 'T10', number: 10, seats: 10, status: 'reserve', reservationId: 'R009' },
  { id: 'T11', number: 11, seats: 12, status: 'libre', reservationId: undefined },
  { id: 'T12', number: 12, seats: 4, status: 'hors-service', reservationId: undefined },
];

const EMPTY_FORM: NewReservationForm = {
  name: '',
  phone: '',
  email: '',
  covers: '',
  date: TODAY,
  time: '19:00',
  tableId: '',
  notes: '',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const TABLE_STATUS_CONFIG: Record<TableStatus, { label: string; color: string; ring: string; dot: string }> = {
  libre: { label: 'Libre', color: 'bg-green-500/20 border-green-500', ring: 'ring-green-500', dot: 'bg-green-400' },
  reserve: { label: 'Réservé', color: 'bg-amber-500/20 border-amber-500', ring: 'ring-amber-500', dot: 'bg-amber-400' },
  occupe: { label: 'Occupé', color: 'bg-red-500/20 border-red-500', ring: 'ring-red-500', dot: 'bg-red-400' },
  'hors-service': { label: 'Hors service', color: 'bg-gray-700/40 border-gray-600', ring: 'ring-gray-600', dot: 'bg-gray-500' },
};

const RESERVATION_STATUS_CONFIG: Record<ReservationStatus, { label: string; bg: string; text: string }> = {
  confirmee: { label: 'Confirmée', bg: 'bg-blue-900/40', text: 'text-blue-400' },
  attente: { label: 'En attente', bg: 'bg-yellow-900/40', text: 'text-yellow-400' },
  annulee: { label: 'Annulée', bg: 'bg-red-900/40', text: 'text-red-400' },
  arrivee: { label: 'Arrivée', bg: 'bg-green-900/40', text: 'text-green-400' },
};

// Timeline helpers
const TIMELINE_START = 12; // 12h
const TIMELINE_END = 23;   // 23h
const TIMELINE_HOURS = TIMELINE_END - TIMELINE_START;

function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + (m ?? 0);
}

function timeToPercent(time: string): number {
  const mins = timeToMinutes(time);
  const startMins = TIMELINE_START * 60;
  const totalMins = TIMELINE_HOURS * 60;
  return Math.max(0, Math.min(100, ((mins - startMins) / totalMins) * 100));
}

function durationToPercent(duration: number): number {
  const totalMins = TIMELINE_HOURS * 60;
  return (duration / totalMins) * 100;
}

function getCurrentTimePercent(): number {
  const now = new Date();
  const nowMins = now.getHours() * 60 + now.getMinutes();
  const startMins = TIMELINE_START * 60;
  const totalMins = TIMELINE_HOURS * 60;
  const pct = ((nowMins - startMins) / totalMins) * 100;
  return Math.max(0, Math.min(100, pct));
}

// Timeline block colors per status
const TIMELINE_COLORS: Record<ReservationStatus, string> = {
  confirmee: 'bg-blue-600/70 border-blue-500',
  attente: 'bg-yellow-600/70 border-yellow-500',
  annulee: 'bg-red-700/50 border-red-600',
  arrivee: 'bg-green-600/70 border-green-500',
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: ReservationStatus }) {
  const cfg = RESERVATION_STATUS_CONFIG[status];
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${cfg.bg} ${cfg.text}`}>
      {cfg.label}
    </span>
  );
}

// ─── Side panel ──────────────────────────────────────────────────────────────

interface SidePanelProps {
  table: TableData;
  reservation: Reservation | undefined;
  onClose: () => void;
}

function SidePanel({ table, reservation, onClose }: SidePanelProps) {
  const statusCfg = TABLE_STATUS_CONFIG[table.status];

  return (
    <div className="flex w-80 flex-shrink-0 flex-col rounded-2xl border border-gray-800 bg-gray-900 p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-semibold text-white">Table {table.number}</h3>
        <button onClick={onClose} className="rounded-lg p-1 text-gray-400 hover:bg-gray-800 hover:text-white">
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Table info */}
      <div className="mb-4 flex items-center gap-3 rounded-xl border border-gray-800 bg-gray-800/50 p-3">
        <span className={`h-3 w-3 rounded-full ${statusCfg.dot}`} />
        <div>
          <p className="text-sm font-medium text-white">{statusCfg.label}</p>
          <p className="text-xs text-gray-400">{table.seats} couverts max</p>
        </div>
      </div>

      {/* Reservation detail */}
      {reservation ? (
        <div className="space-y-3">
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Client</p>
            <p className="font-semibold text-white">{reservation.name}</p>
            <p className="text-sm text-gray-400">{reservation.phone}</p>
            <p className="text-sm text-gray-400">{reservation.email}</p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-lg bg-gray-800 p-2">
              <p className="text-xs text-gray-500">Heure</p>
              <p className="text-sm font-semibold text-white">{reservation.time}</p>
            </div>
            <div className="rounded-lg bg-gray-800 p-2">
              <p className="text-xs text-gray-500">Couverts</p>
              <p className="text-sm font-semibold text-white">{reservation.covers}</p>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-500">Statut</p>
            <StatusBadge status={reservation.status} />
          </div>
          {reservation.notes && (
            <div className="rounded-xl border border-gray-700 bg-gray-800/50 p-3">
              <p className="text-xs text-gray-500 mb-1">Notes</p>
              <p className="text-sm text-gray-300">{reservation.notes}</p>
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-1 items-center justify-center">
          <p className="text-sm text-gray-500">Aucune réservation active</p>
        </div>
      )}
    </div>
  );
}

// ─── Floor Plan ───────────────────────────────────────────────────────────────

interface FloorPlanProps {
  tables: TableData[];
  reservations: Reservation[];
  selectedTableId: string | null;
  onTableClick: (tableId: string) => void;
}

function FloorPlan({ tables, reservations, selectedTableId, onTableClick }: FloorPlanProps) {
  const getReservation = (table: TableData) =>
    table.reservationId ? reservations.find((r) => r.id === table.reservationId) : undefined;

  // 3-column grid layout positions
  const positions = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [9, 10, 11],
  ];

  return (
    <div className="flex-1 overflow-auto">
      <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
        {tables.map((table) => {
          const cfg = TABLE_STATUS_CONFIG[table.status];
          const res = getReservation(table);
          const isSelected = selectedTableId === table.id;

          return (
            <button
              key={table.id}
              onClick={() => onTableClick(table.id)}
              className={`flex flex-col items-center gap-2 rounded-2xl border-2 p-4 transition-all duration-200 ${cfg.color} ${
                isSelected ? `ring-2 ${cfg.ring} ring-offset-2 ring-offset-gray-950` : ''
              } hover:scale-105`}
            >
              {/* Circle */}
              <div
                className={`flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full border-2 ${cfg.color} font-bold text-white text-lg`}
              >
                {table.number}
              </div>

              {/* Status dot + label */}
              <div className="text-center">
                <p className="text-xs font-semibold text-white">T{table.number}</p>
                <p className="text-xs text-gray-400">{table.seats} pl.</p>
              </div>

              {/* Reservation info for reserved/occupied */}
              {res && (
                <div className="w-full rounded-lg bg-black/30 px-2 py-1 text-center">
                  <p className="truncate text-xs font-medium text-white leading-tight">{res.name.split(' ')[0]}</p>
                  <p className="text-xs text-gray-300">{res.time}</p>
                </div>
              )}

              {table.status === 'hors-service' && (
                <p className="text-xs text-gray-500">Indisponible</p>
              )}
            </button>
          );
        })}
      </div>
      {/* ignore unused positions variable */}
      <span className="sr-only">{positions.length}</span>
    </div>
  );
}

// ─── Timeline View ────────────────────────────────────────────────────────────

interface TimelineViewProps {
  tables: TableData[];
  reservations: Reservation[];
}

function TimelineView({ tables, reservations }: TimelineViewProps) {
  const currentPct = getCurrentTimePercent();

  const hours = Array.from({ length: TIMELINE_HOURS + 1 }, (_, i) => TIMELINE_START + i);

  const getTableReservations = (tableId: string) =>
    reservations.filter((r) => r.tableId === tableId && r.status !== 'annulee');

  return (
    <div className="overflow-auto rounded-2xl border border-gray-800 bg-gray-900">
      {/* Header hours */}
      <div className="sticky top-0 z-10 flex border-b border-gray-800 bg-gray-900">
        <div className="w-20 flex-shrink-0 border-r border-gray-800 px-2 py-2 text-xs font-medium text-gray-500">
          Table
        </div>
        <div className="relative flex-1">
          <div className="flex">
            {hours.map((h) => (
              <div
                key={h}
                className="flex-1 border-r border-gray-800 py-2 text-center text-xs text-gray-500 last:border-r-0"
              >
                {h}h
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Rows */}
      {tables.map((table) => {
        const tableRes = getTableReservations(table.id);
        return (
          <div key={table.id} className="flex border-b border-gray-800/50 last:border-b-0">
            {/* Table label */}
            <div className="flex w-20 flex-shrink-0 items-center border-r border-gray-800 px-2 py-3">
              <span className="text-xs font-semibold text-gray-300">T{table.number}</span>
            </div>

            {/* Timeline track */}
            <div className="relative flex-1" style={{ height: '52px' }}>
              {/* Grid lines */}
              <div className="absolute inset-0 flex">
                {hours.map((h) => (
                  <div key={h} className="flex-1 border-r border-gray-800/30 last:border-r-0" />
                ))}
              </div>

              {/* Current time line */}
              {currentPct > 0 && currentPct < 100 && (
                <div
                  className="absolute top-0 bottom-0 z-20 w-0.5 bg-brand-500/80"
                  style={{ left: `${currentPct}%` }}
                />
              )}

              {/* Reservation blocks */}
              {tableRes.map((res) => {
                const left = timeToPercent(res.time);
                const width = durationToPercent(res.duration);
                return (
                  <div
                    key={res.id}
                    className={`absolute top-1 bottom-1 rounded-lg border text-xs font-medium text-white overflow-hidden ${TIMELINE_COLORS[res.status]}`}
                    style={{ left: `${left}%`, width: `${Math.max(width, 2)}%` }}
                    title={`${res.name} — ${res.time} (${res.covers} pers.)`}
                  >
                    <div className="flex h-full flex-col justify-center px-1.5">
                      <span className="truncate leading-tight">{res.name.split(' ')[0]}</span>
                      <span className="truncate text-white/70 leading-tight">{res.time}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── New Reservation Modal ────────────────────────────────────────────────────

interface NewReservationModalProps {
  open: boolean;
  onClose: () => void;
  tables: TableData[];
}

function NewReservationModal({ open, onClose, tables }: NewReservationModalProps) {
  const [form, setForm] = useState<NewReservationForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const handleChange = useCallback(
    (field: keyof NewReservationForm) =>
      (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setForm((prev) => ({ ...prev, [field]: e.target.value }));
      },
    []
  );

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await new Promise<void>((resolve) => setTimeout(resolve, 600));
    setSaving(false);
    setForm(EMPTY_FORM);
    onClose();
  }, [onClose]);

  const availableTables = tables.filter((t) => t.status !== 'hors-service');

  return (
    <Modal open={open} onClose={onClose} title="Nouvelle réservation" size="xl">
      <form onSubmit={(e) => { void handleSubmit(e); }} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Nom"
            placeholder="Nom complet"
            value={form.name}
            onChange={handleChange('name')}
            required
          />
          <Input
            label="Téléphone"
            type="tel"
            placeholder="06 00 00 00 00"
            value={form.phone}
            onChange={handleChange('phone')}
          />
        </div>

        <Input
          label="Email"
          type="email"
          placeholder="client@email.com"
          value={form.email}
          onChange={handleChange('email')}
        />

        <div className="grid gap-4 sm:grid-cols-3">
          <Input
            label="Couverts"
            type="number"
            min={1}
            max={20}
            placeholder="2"
            value={form.covers}
            onChange={handleChange('covers')}
            required
          />
          <Input
            label="Date"
            type="date"
            value={form.date}
            onChange={handleChange('date')}
            required
          />
          <Input
            label="Heure"
            type="time"
            value={form.time}
            onChange={handleChange('time')}
            required
          />
        </div>

        {/* Table select */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-surface-700 dark:text-surface-300">Table</label>
          <select
            value={form.tableId}
            onChange={handleChange('tableId')}
            className="h-10 w-full rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 px-3 text-sm text-surface-900 dark:text-surface-50 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
          >
            <option value="">Sélectionner une table…</option>
            {availableTables.map((t) => (
              <option key={t.id} value={t.id}>
                Table {t.number} — {t.seats} places ({TABLE_STATUS_CONFIG[t.status].label})
              </option>
            ))}
          </select>
        </div>

        {/* Notes */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-surface-700 dark:text-surface-300">Notes</label>
          <textarea
            rows={3}
            placeholder="Allergies, préférences, occasion spéciale…"
            value={form.notes}
            onChange={handleChange('notes')}
            className="w-full rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 px-3 py-2 text-sm text-surface-900 dark:text-surface-50 placeholder:text-surface-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 resize-none"
          />
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button variant="ghost" type="button" onClick={onClose}>
            Annuler
          </Button>
          <Button variant="primary" type="submit" loading={saving}>
            Enregistrer
          </Button>
        </div>
      </form>
    </Modal>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ReservationsPage() {
  const [selectedDate, setSelectedDate] = useState(TODAY);
  const [viewMode, setViewMode] = useState<ViewMode>('floor');
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
  const [tables] = useState<TableData[]>(INITIAL_TABLES);
  const [reservations, setReservations] = useState<Reservation[]>(MOCK_RESERVATIONS);
  const [showNewModal, setShowNewModal] = useState(false);

  const selectedTable = selectedTableId ? tables.find((t) => t.id === selectedTableId) : undefined;
  const selectedReservation =
    selectedTable?.reservationId
      ? reservations.find((r) => r.id === selectedTable.reservationId)
      : undefined;

  // Day stats
  const todayRes = reservations.filter((r) => r.status !== 'annulee');
  const totalCovers = todayRes.reduce((sum, r) => sum + r.covers, 0);
  const occupiedTables = tables.filter((t) => t.status === 'occupe' || t.status === 'reserve').length;
  const activeTables = tables.filter((t) => t.status !== 'hors-service').length;
  const fillRate = Math.round((occupiedTables / activeTables) * 100);

  const handleTableClick = useCallback((tableId: string) => {
    setSelectedTableId((prev) => (prev === tableId ? null : tableId));
  }, []);

  const handleConfirm = useCallback((id: string) => {
    setReservations((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: 'confirmee' as ReservationStatus } : r))
    );
  }, []);

  const handleSeat = useCallback((id: string) => {
    setReservations((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: 'arrivee' as ReservationStatus } : r))
    );
  }, []);

  const handleCancel = useCallback((id: string) => {
    setReservations((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: 'annulee' as ReservationStatus } : r))
    );
  }, []);

  // Advance/retreat date
  const shiftDate = (days: number) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + days);
    setSelectedDate(d.toISOString().slice(0, 10));
  };

  const formattedDate = new Date(selectedDate + 'T00:00:00').toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="min-h-screen bg-gray-950 p-6 text-white">
      <div className="mx-auto max-w-screen-xl space-y-6">

        {/* ── Header ── */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Réservations</h1>
            <p className="mt-1 text-sm text-gray-400 capitalize">{formattedDate}</p>
          </div>

          <div className="flex items-center gap-3">
            {/* Date navigation */}
            <div className="flex items-center gap-1 rounded-xl border border-gray-800 bg-gray-900 p-1">
              <button
                onClick={() => shiftDate(-1)}
                className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-800 hover:text-white transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <div className="flex items-center gap-2 px-2">
                <Calendar className="h-4 w-4 text-gray-400" />
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="bg-transparent text-sm text-white focus:outline-none"
                />
              </div>
              <button
                onClick={() => shiftDate(1)}
                className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-800 hover:text-white transition-colors"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            <Button
              variant="primary"
              icon={<Plus className="h-4 w-4" />}
              onClick={() => setShowNewModal(true)}
            >
              Nouvelle réservation
            </Button>
          </div>
        </div>

        {/* ── Day stats ── */}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            {
              label: "Réservations aujourd'hui",
              value: '18',
              icon: Calendar,
              iconBg: 'bg-blue-900/40',
              iconColor: 'text-blue-400',
            },
            {
              label: 'Couverts total',
              value: String(totalCovers),
              icon: Users,
              iconBg: 'bg-green-900/40',
              iconColor: 'text-green-400',
            },
            {
              label: 'Tables occupées',
              value: `${occupiedTables}/${activeTables}`,
              icon: Table2,
              iconBg: 'bg-amber-900/40',
              iconColor: 'text-amber-400',
            },
            {
              label: 'Taux remplissage',
              value: `${fillRate}%`,
              icon: BarChart3,
              iconBg: 'bg-purple-900/40',
              iconColor: 'text-purple-400',
            },
          ].map((stat) => (
            <div key={stat.label} className="rounded-2xl border border-gray-800 bg-gray-900 p-6">
              <div className={`mb-4 flex h-10 w-10 items-center justify-center rounded-xl ${stat.iconBg}`}>
                <stat.icon className={`h-5 w-5 ${stat.iconColor}`} />
              </div>
              <p className="text-2xl font-bold text-white">{stat.value}</p>
              <p className="mt-1 text-sm text-gray-400">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* ── Floor / Timeline toggle + view ── */}
        <div className="rounded-2xl border border-gray-800 bg-gray-900 p-5">
          {/* Toggle */}
          <div className="mb-5 flex items-center justify-between">
            <h2 className="font-semibold text-white">
              {viewMode === 'floor' ? 'Plan de salle' : 'Timeline'}
            </h2>
            <div className="flex gap-1 rounded-xl border border-gray-700 bg-gray-800 p-1">
              <button
                onClick={() => setViewMode('floor')}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                  viewMode === 'floor' ? 'bg-gray-700 text-white shadow-sm' : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                <LayoutGrid className="h-4 w-4" />
                Plan de salle
              </button>
              <button
                onClick={() => setViewMode('timeline')}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                  viewMode === 'timeline' ? 'bg-gray-700 text-white shadow-sm' : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                <Clock className="h-4 w-4" />
                Timeline
              </button>
            </div>
          </div>

          {/* Legend */}
          <div className="mb-4 flex flex-wrap gap-3">
            {(Object.entries(TABLE_STATUS_CONFIG) as [TableStatus, typeof TABLE_STATUS_CONFIG[TableStatus]][]).map(
              ([key, cfg]) => (
                <div key={key} className="flex items-center gap-1.5">
                  <span className={`h-2.5 w-2.5 rounded-full ${cfg.dot}`} />
                  <span className="text-xs text-gray-400">{cfg.label}</span>
                </div>
              )
            )}
          </div>

          {viewMode === 'floor' ? (
            <div className="flex gap-5">
              <FloorPlan
                tables={tables}
                reservations={reservations}
                selectedTableId={selectedTableId}
                onTableClick={handleTableClick}
              />
              {selectedTable && (
                <SidePanel
                  table={selectedTable}
                  reservation={selectedReservation}
                  onClose={() => setSelectedTableId(null)}
                />
              )}
            </div>
          ) : (
            <TimelineView tables={tables} reservations={reservations} />
          )}
        </div>

        {/* ── Reservations list ── */}
        <div className="rounded-2xl border border-gray-800 bg-gray-900">
          <div className="border-b border-gray-800 px-6 py-5">
            <h2 className="font-semibold text-white">Liste des réservations</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800">
                  {['Heure', 'Nom', 'Couverts', 'Table', 'Statut', 'Actions'].map((col) => (
                    <th
                      key={col}
                      className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {reservations.map((res) => (
                  <tr key={res.id} className="hover:bg-gray-800/50">
                    {/* Heure */}
                    <td className="px-5 py-3 font-mono text-sm text-gray-200">{res.time}</td>

                    {/* Nom */}
                    <td className="px-5 py-3">
                      <p className="font-medium text-white">{res.name}</p>
                      <p className="text-xs text-gray-500">{res.phone}</p>
                    </td>

                    {/* Couverts */}
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-1.5 text-gray-300">
                        <Users className="h-3.5 w-3.5 text-gray-500" />
                        {res.covers}
                      </div>
                    </td>

                    {/* Table */}
                    <td className="px-5 py-3">
                      <span className="rounded-lg bg-gray-800 px-2.5 py-1 text-xs font-semibold text-white">
                        {res.tableId}
                      </span>
                    </td>

                    {/* Statut */}
                    <td className="px-5 py-3">
                      <StatusBadge status={res.status} />
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-1.5">
                        {res.status === 'attente' && (
                          <button
                            onClick={() => handleConfirm(res.id)}
                            title="Confirmer"
                            className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-900/40 text-blue-400 hover:bg-blue-800/60 transition-colors"
                          >
                            <Check className="h-3.5 w-3.5" />
                          </button>
                        )}
                        {(res.status === 'confirmee' || res.status === 'attente') && (
                          <button
                            onClick={() => handleSeat(res.id)}
                            title="Asseoir"
                            className="flex h-7 w-7 items-center justify-center rounded-lg bg-green-900/40 text-green-400 hover:bg-green-800/60 transition-colors"
                          >
                            <UserCheck className="h-3.5 w-3.5" />
                          </button>
                        )}
                        {res.status !== 'annulee' && res.status !== 'arrivee' && (
                          <button
                            onClick={() => handleCancel(res.id)}
                            title="Annuler"
                            className="flex h-7 w-7 items-center justify-center rounded-lg bg-red-900/40 text-red-400 hover:bg-red-800/60 transition-colors"
                          >
                            <XCircle className="h-3.5 w-3.5" />
                          </button>
                        )}
                        {(res.status === 'annulee' || res.status === 'arrivee') && (
                          <span className="text-xs text-gray-600">—</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ── New Reservation Modal ── */}
      <NewReservationModal
        open={showNewModal}
        onClose={() => setShowNewModal(false)}
        tables={tables}
      />
    </div>
  );
}
