'use client';

import { useState } from 'react';
import {
  ChevronLeft, ChevronRight, Plus, Clock, Users,
  CalendarDays, Sun, Sunset, Moon, Copy, Trash2,
  Check, ImagePlus, Trash,
} from 'lucide-react';
import { clsx } from 'clsx';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';

// ── Types ─────────────────────────────────────────────────────────────────────

type ShiftType = 'morning' | 'afternoon' | 'evening' | 'full';
type Role = 'Manager' | 'Cuisinier' | 'Serveur' | 'Serveuse' | 'Livreur';

interface Shift {
  id: string;
  employeeId: string;
  day: number; // 0=Mon … 6=Sun
  type: ShiftType;
  startTime: string;
  endTime: string;
  note?: string;
}

interface Employee {
  id: string;
  name: string;
  role: Role;
  color: string;
}

// ── Config ────────────────────────────────────────────────────────────────────

const DAYS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
const DAYS_FULL = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];

const SHIFT_CFG: Record<ShiftType, { label: string; icon: React.ElementType; start: string; end: string; bg: string; text: string; border: string }> = {
  morning:   { label: 'Matin',    icon: Sun,     start: '07:00', end: '14:00', bg: 'bg-amber-50',   text: 'text-amber-800',  border: 'border-amber-200' },
  afternoon: { label: 'Après-midi',icon: Sunset,  start: '12:00', end: '19:00', bg: 'bg-blue-50',    text: 'text-blue-800',   border: 'border-blue-200'  },
  evening:   { label: 'Soir',     icon: Moon,    start: '18:00', end: '23:00', bg: 'bg-purple-50',  text: 'text-purple-800', border: 'border-purple-200'},
  full:      { label: 'Journée',  icon: Clock,   start: '09:00', end: '18:00', bg: 'bg-green-50',   text: 'text-green-800',  border: 'border-green-200' },
};

const ROLE_COLOR: Record<Role, string> = {
  Manager:   'bg-brand-100 text-brand-800',
  Cuisinier: 'bg-yellow-100 text-yellow-800',
  Serveur:   'bg-blue-100 text-blue-800',
  Serveuse:  'bg-blue-100 text-blue-800',
  Livreur:   'bg-gray-100 text-gray-700',
};

const EMPLOYEES: Employee[] = [
  { id: 'e1', name: 'Marie Dupont',    role: 'Manager',   color: 'bg-brand-500' },
  { id: 'e2', name: 'Pierre Martin',   role: 'Cuisinier', color: 'bg-yellow-500' },
  { id: 'e3', name: 'Sophie Bernard',  role: 'Serveuse',  color: 'bg-blue-500' },
  { id: 'e4', name: 'Thomas Petit',    role: 'Cuisinier', color: 'bg-orange-500' },
  { id: 'e5', name: 'Emma Richard',    role: 'Serveuse',  color: 'bg-pink-500' },
  { id: 'e6', name: 'Claire Lambert',  role: 'Manager',   color: 'bg-indigo-500' },
  { id: 'e7', name: 'Julien Moreau',   role: 'Livreur',   color: 'bg-gray-500' },
];

const INIT_SHIFTS: Shift[] = [
  { id: 's1',  employeeId: 'e1', day: 0, type: 'full',      startTime: '09:00', endTime: '18:00' },
  { id: 's2',  employeeId: 'e1', day: 1, type: 'morning',   startTime: '07:00', endTime: '14:00' },
  { id: 's3',  employeeId: 'e1', day: 3, type: 'full',      startTime: '09:00', endTime: '18:00' },
  { id: 's4',  employeeId: 'e2', day: 0, type: 'morning',   startTime: '07:00', endTime: '14:00' },
  { id: 's5',  employeeId: 'e2', day: 1, type: 'morning',   startTime: '07:00', endTime: '14:00' },
  { id: 's6',  employeeId: 'e2', day: 2, type: 'full',      startTime: '09:00', endTime: '18:00' },
  { id: 's7',  employeeId: 'e2', day: 4, type: 'morning',   startTime: '07:00', endTime: '14:00' },
  { id: 's8',  employeeId: 'e3', day: 1, type: 'afternoon', startTime: '12:00', endTime: '19:00' },
  { id: 's9',  employeeId: 'e3', day: 2, type: 'evening',   startTime: '18:00', endTime: '23:00' },
  { id: 's10', employeeId: 'e3', day: 4, type: 'full',      startTime: '10:00', endTime: '18:00' },
  { id: 's11', employeeId: 'e3', day: 5, type: 'afternoon', startTime: '12:00', endTime: '19:00' },
  { id: 's12', employeeId: 'e4', day: 0, type: 'evening',   startTime: '17:00', endTime: '23:00' },
  { id: 's13', employeeId: 'e4', day: 2, type: 'evening',   startTime: '17:00', endTime: '23:00' },
  { id: 's14', employeeId: 'e4', day: 5, type: 'full',      startTime: '09:00', endTime: '18:00' },
  { id: 's15', employeeId: 'e4', day: 6, type: 'full',      startTime: '09:00', endTime: '18:00' },
  { id: 's16', employeeId: 'e5', day: 3, type: 'afternoon', startTime: '12:00', endTime: '19:00' },
  { id: 's17', employeeId: 'e5', day: 4, type: 'evening',   startTime: '18:00', endTime: '23:00' },
  { id: 's18', employeeId: 'e5', day: 6, type: 'full',      startTime: '10:00', endTime: '19:00' },
  { id: 's19', employeeId: 'e6', day: 0, type: 'full',      startTime: '09:00', endTime: '18:00' },
  { id: 's20', employeeId: 'e6', day: 2, type: 'morning',   startTime: '07:00', endTime: '13:00' },
  { id: 's21', employeeId: 'e6', day: 4, type: 'full',      startTime: '09:00', endTime: '18:00' },
  { id: 's22', employeeId: 'e7', day: 1, type: 'afternoon', startTime: '11:00', endTime: '20:00' },
  { id: 's23', employeeId: 'e7', day: 3, type: 'afternoon', startTime: '11:00', endTime: '20:00' },
  { id: 's24', employeeId: 'e7', day: 5, type: 'evening',   startTime: '17:00', endTime: '23:00' },
  { id: 's25', employeeId: 'e7', day: 6, type: 'full',      startTime: '09:00', endTime: '17:00' },
];

// ── Shift form ─────────────────────────────────────────────────────────────────

interface ShiftFormState {
  employeeId: string;
  day: string;
  type: ShiftType;
  startTime: string;
  endTime: string;
  note: string;
}

function emptyForm(day?: number, employeeId?: string): ShiftFormState {
  return {
    employeeId: employeeId ?? EMPLOYEES[0].id,
    day: String(day ?? 0),
    type: 'morning',
    startTime: '07:00',
    endTime: '14:00',
    note: '',
  };
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function totalHours(shifts: Shift[]): number {
  return shifts.reduce((acc, s) => {
    const [sh, sm] = s.startTime.split(':').map(Number);
    const [eh, em] = s.endTime.split(':').map(Number);
    return acc + (eh * 60 + em - sh * 60 - sm) / 60;
  }, 0);
}

function getWeekDates(weekOffset: number): Date[] {
  const today = new Date();
  const day = today.getDay();
  const monday = new Date(today);
  monday.setDate(today.getDate() - (day === 0 ? 6 : day - 1) + weekOffset * 7);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

function getDayDate(dayOffset: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + dayOffset);
  return d;
}

// 0=Mon … 6=Sun (matches DAYS index)
function dowIndex(d: Date): number {
  return (d.getDay() + 6) % 7;
}

function getMonthGrid(monthOffset: number): { date: Date; inMonth: boolean }[] {
  const today = new Date();
  const first = new Date(today.getFullYear(), today.getMonth() + monthOffset, 1);
  const start = new Date(first);
  start.setDate(first.getDate() - dowIndex(first));
  return Array.from({ length: 42 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return { date: d, inMonth: d.getMonth() === first.getMonth() };
  });
}

const MONTHS_FR = ['janvier','février','mars','avril','mai','juin','juillet','août','septembre','octobre','novembre','décembre'];

// ── Main component ─────────────────────────────────────────────────────────────

export default function PlanningPage() {
  const [shifts, setShifts] = useState<Shift[]>(INIT_SHIFTS);
  const [scope, setScope] = useState<'day' | 'week' | 'month'>('week');
  const [weekOffset, setWeekOffset] = useState(0);
  const [dayOffset, setDayOffset] = useState(0);
  const [monthOffset, setMonthOffset] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<ShiftFormState>(emptyForm());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [bgImage, setBgImage] = useState<string | null>(null);

  const weekDates = getWeekDates(weekOffset);
  const totalStaff = EMPLOYEES.length;
  const totalShifts = shifts.length;
  const weekHours = totalHours(shifts);
  const staffToday = new Set(
    shifts.filter((s) => s.day === (new Date().getDay() + 6) % 7).map((s) => s.employeeId)
  ).size;

  function openAdd(day?: number, empId?: string) {
    setForm(emptyForm(day, empId));
    setEditingId(null);
    setShowModal(true);
  }

  function openEdit(shift: Shift) {
    setForm({
      employeeId: shift.employeeId,
      day: String(shift.day),
      type: shift.type,
      startTime: shift.startTime,
      endTime: shift.endTime,
      note: shift.note ?? '',
    });
    setEditingId(shift.id);
    setShowModal(true);
  }

  function handleSave() {
    if (!form.employeeId || form.startTime >= form.endTime) return;
    if (editingId) {
      setShifts((prev) => prev.map((s) =>
        s.id === editingId
          ? { ...s, employeeId: form.employeeId, day: Number(form.day), type: form.type, startTime: form.startTime, endTime: form.endTime, note: form.note || undefined }
          : s
      ));
    } else {
      setShifts((prev) => [...prev, {
        id: `s${Date.now()}`,
        employeeId: form.employeeId,
        day: Number(form.day),
        type: form.type,
        startTime: form.startTime,
        endTime: form.endTime,
        note: form.note || undefined,
      }]);
    }
    setShowModal(false);
  }

  function deleteShift(id: string) {
    setShifts((prev) => prev.filter((s) => s.id !== id));
    setShowModal(false);
  }

  function copyWeek() {
    const newShifts = shifts.map((s) => ({ ...s, id: `s${Date.now()}-${Math.random()}` }));
    setShifts((prev) => [...prev, ...newShifts]);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function onTypeChange(t: ShiftType) {
    const cfg = SHIFT_CFG[t];
    setForm((f) => ({ ...f, type: t, startTime: cfg.start, endTime: cfg.end }));
  }

  return (
    <div
      className="space-y-6 p-6 min-h-screen transition-all duration-500"
      style={bgImage ? {
        backgroundImage: `linear-gradient(rgba(255,255,255,0.78), rgba(255,255,255,0.78)), url(${bgImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      } : undefined}
    >
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-surface-900 dark:text-white">Planning équipe</h1>
          <p className="mt-1 text-sm text-surface-500">Gestion des emplois du temps</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={copyWeek}
            className="flex items-center gap-2 rounded-xl border border-surface-200 bg-white px-3 py-2 text-sm font-medium text-surface-700 hover:bg-surface-50 transition-colors dark:border-surface-700 dark:bg-surface-800 dark:text-surface-200"
          >
            {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
            {copied ? 'Copié !' : 'Copier semaine'}
          </button>
          <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-surface-200 bg-white px-3 py-2 text-sm font-medium text-surface-700 hover:bg-surface-50 transition-colors dark:border-surface-700 dark:bg-surface-800 dark:text-surface-200">
            <input
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                if (bgImage) URL.revokeObjectURL(bgImage);
                setBgImage(URL.createObjectURL(file));
                e.target.value = '';
              }}
            />
            <ImagePlus className="h-4 w-4" />
            Image de fond
          </label>
          {bgImage && (
            <button
              onClick={() => { URL.revokeObjectURL(bgImage); setBgImage(null); }}
              className="flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-100 transition-colors"
              title="Supprimer l'image de fond"
            >
              <Trash className="h-4 w-4" />
              Retirer
            </button>
          )}
          <Button onClick={() => openAdd()} size="sm">
            <Plus className="h-4 w-4" />
            Ajouter shift
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-4">
        {[
          { label: 'Employés',       value: totalStaff,             icon: Users,       bg: 'bg-brand-50',  color: 'text-brand-600'  },
          { label: 'Shifts semaine', value: totalShifts,            icon: CalendarDays, bg: 'bg-blue-50',   color: 'text-blue-600'   },
          { label: 'Heures planif.', value: `${weekHours.toFixed(0)} h`, icon: Clock, bg: 'bg-purple-50', color: 'text-purple-600' },
          { label: "Aujourd'hui",    value: `${staffToday} / ${totalStaff}`, icon: Sun, bg: 'bg-amber-50', color: 'text-amber-600' },
        ].map((kpi) => {
          const Icon = kpi.icon;
          return (
            <Card key={kpi.label} padding="lg" className="flex items-center gap-4">
              <div className={`rounded-xl p-2.5 ${kpi.bg}`}>
                <Icon className={`h-5 w-5 ${kpi.color}`} />
              </div>
              <div>
                <p className="text-xs text-surface-500">{kpi.label}</p>
                <p className="text-xl font-bold text-surface-900 dark:text-white">{kpi.value}</p>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Scope tabs + navigator */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {/* Scope switcher */}
          <div className="flex rounded-xl border border-surface-200 bg-white p-0.5 dark:border-surface-700 dark:bg-surface-800">
            {(['day', 'week', 'month'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setScope(s)}
                className={clsx(
                  'rounded-lg px-3 py-1.5 text-xs font-medium transition-colors',
                  scope === s
                    ? 'bg-brand-500 text-black'
                    : 'text-surface-600 hover:bg-surface-50 dark:text-surface-300 dark:hover:bg-surface-700',
                )}
              >
                {s === 'day' ? 'Jour' : s === 'week' ? 'Semaine' : 'Mois'}
              </button>
            ))}
          </div>

          {/* Navigator */}
          <button
            onClick={() => {
              if (scope === 'day') setDayOffset((d) => d - 1);
              else if (scope === 'week') setWeekOffset((w) => w - 1);
              else setMonthOffset((m) => m - 1);
            }}
            className="rounded-xl border border-surface-200 p-2 hover:bg-surface-50 transition-colors dark:border-surface-700 dark:hover:bg-surface-700"
          >
            <ChevronLeft className="h-4 w-4 text-surface-600 dark:text-surface-300" />
          </button>
          <span className="text-sm font-semibold text-surface-700 dark:text-surface-200">
            {scope === 'day' && (
              <>
                {dayOffset === 0 ? "Aujourd'hui" : dayOffset === 1 ? 'Demain' : dayOffset === -1 ? 'Hier' : ''}
                {dayOffset === 0 || dayOffset === 1 || dayOffset === -1 ? ' · ' : ''}
                {getDayDate(dayOffset).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
              </>
            )}
            {scope === 'week' && (
              <>
                {weekOffset === 0 ? 'Cette semaine' : weekOffset === 1 ? 'Semaine prochaine' : weekOffset === -1 ? 'Semaine dernière' : `Semaine ${weekOffset > 0 ? '+' : ''}${weekOffset}`}
                {' · '}
                {weekDates[0].toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} — {weekDates[6].toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
              </>
            )}
            {scope === 'month' && (() => {
              const first = new Date(new Date().getFullYear(), new Date().getMonth() + monthOffset, 1);
              return `${MONTHS_FR[first.getMonth()]} ${first.getFullYear()}`;
            })()}
          </span>
          <button
            onClick={() => {
              if (scope === 'day') setDayOffset((d) => d + 1);
              else if (scope === 'week') setWeekOffset((w) => w + 1);
              else setMonthOffset((m) => m + 1);
            }}
            className="rounded-xl border border-surface-200 p-2 hover:bg-surface-50 transition-colors dark:border-surface-700 dark:hover:bg-surface-700"
          >
            <ChevronRight className="h-4 w-4 text-surface-600 dark:text-surface-300" />
          </button>
          {((scope === 'day' && dayOffset !== 0) || (scope === 'week' && weekOffset !== 0) || (scope === 'month' && monthOffset !== 0)) && (
            <button
              onClick={() => { setDayOffset(0); setWeekOffset(0); setMonthOffset(0); }}
              className="rounded-xl border border-surface-200 px-3 py-1.5 text-xs font-medium text-surface-600 hover:bg-surface-50 transition-colors dark:border-surface-700 dark:text-surface-300 dark:hover:bg-surface-700"
            >
              Aujourd&apos;hui
            </button>
          )}
        </div>

        {/* Legend */}
        <div className="hidden items-center gap-3 sm:flex">
          {Object.entries(SHIFT_CFG).map(([type, cfg]) => {
            const Icon = cfg.icon;
            return (
              <span key={type} className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${cfg.bg} ${cfg.text}`}>
                <Icon className="h-3 w-3" />{cfg.label}
              </span>
            );
          })}
        </div>
      </div>

      {/* Grid — week */}
      {scope === 'week' && (
        <Card padding="none" className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px]">
              <thead>
                <tr className="border-b border-surface-100 dark:border-surface-700">
                  <th className="w-40 py-3 pl-4 text-left text-xs font-semibold uppercase tracking-wider text-surface-500">
                    Employé
                  </th>
                  {DAYS.map((day, i) => {
                    const date = weekDates[i];
                    const isToday = date.toDateString() === new Date().toDateString();
                    return (
                      <th key={day} className={clsx('py-3 px-2 text-center text-xs font-semibold uppercase tracking-wider', isToday ? 'text-brand-600' : 'text-surface-500')}>
                        <div>{day}</div>
                        <div className={clsx('mt-0.5 text-sm font-bold', isToday ? 'text-brand-600' : 'text-surface-700 dark:text-surface-200')}>
                          {date.getDate()}
                        </div>
                      </th>
                    );
                  })}
                  <th className="w-16 py-3 pr-4 text-right text-xs font-semibold uppercase tracking-wider text-surface-500">Hrs</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-50 dark:divide-surface-800">
                {EMPLOYEES.map((emp) => {
                  const empShifts = shifts.filter((s) => s.employeeId === emp.id);
                  const hrs = totalHours(empShifts);
                  return (
                    <tr key={emp.id} className="group hover:bg-surface-50 dark:hover:bg-surface-800/50 transition-colors">
                      <td className="py-3 pl-4">
                        <div className="flex items-center gap-2">
                          <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${emp.color} text-xs font-bold text-white`}>
                            {emp.name.split(' ').map((n) => n[0]).join('')}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-surface-900 dark:text-surface-100">{emp.name}</p>
                            <span className={`text-[10px] font-medium rounded-full px-1.5 py-0.5 ${ROLE_COLOR[emp.role]}`}>{emp.role}</span>
                          </div>
                        </div>
                      </td>
                      {DAYS.map((_, dayIdx) => {
                        const dayShifts = empShifts.filter((s) => s.day === dayIdx);
                        const date = weekDates[dayIdx];
                        const isToday = date.toDateString() === new Date().toDateString();
                        return (
                          <td
                            key={dayIdx}
                            className={clsx('px-1.5 py-2 text-center align-top', isToday && 'bg-brand-50/30 dark:bg-brand-500/5')}
                          >
                            <div className="space-y-1 min-h-[40px]">
                              {dayShifts.map((shift) => {
                                const cfg = SHIFT_CFG[shift.type];
                                const Icon = cfg.icon;
                                return (
                                  <button
                                    key={shift.id}
                                    onClick={() => openEdit(shift)}
                                    className={clsx(
                                      'w-full rounded-lg border px-1.5 py-1 text-left transition-all hover:opacity-80',
                                      cfg.bg, cfg.border
                                    )}
                                  >
                                    <div className={`flex items-center gap-1 text-[10px] font-semibold ${cfg.text}`}>
                                      <Icon className="h-2.5 w-2.5 shrink-0" />
                                      {shift.startTime}–{shift.endTime}
                                    </div>
                                  </button>
                                );
                              })}
                              <button
                                onClick={() => openAdd(dayIdx, emp.id)}
                                className="w-full rounded-lg border border-dashed border-surface-200 py-1 text-[10px] text-surface-300 opacity-0 transition-opacity group-hover:opacity-100 hover:border-brand-300 hover:text-brand-400 dark:border-surface-700"
                              >
                                +
                              </button>
                            </div>
                          </td>
                        );
                      })}
                      <td className="py-3 pr-4 text-right">
                        <span className={clsx('text-sm font-bold', hrs >= 35 ? 'text-green-600' : hrs >= 20 ? 'text-surface-700 dark:text-surface-200' : 'text-amber-600')}>
                          {hrs.toFixed(0)}h
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Grid — day */}
      {scope === 'day' && (() => {
        const date = getDayDate(dayOffset);
        const dIdx = dowIndex(date);
        return (
          <Card padding="none" className="overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-surface-100 dark:border-surface-700">
                  <th className="w-56 py-3 pl-4 text-left text-xs font-semibold uppercase tracking-wider text-surface-500">Employé</th>
                  <th className="py-3 px-2 text-left text-xs font-semibold uppercase tracking-wider text-surface-500">Shifts du jour</th>
                  <th className="w-24 py-3 pr-4 text-right text-xs font-semibold uppercase tracking-wider text-surface-500">Hrs</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-50 dark:divide-surface-800">
                {EMPLOYEES.map((emp) => {
                  const dayShifts = shifts.filter((s) => s.employeeId === emp.id && s.day === dIdx);
                  const hrs = totalHours(dayShifts);
                  return (
                    <tr key={emp.id} className="group hover:bg-surface-50 dark:hover:bg-surface-800/50">
                      <td className="py-3 pl-4">
                        <div className="flex items-center gap-2">
                          <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${emp.color} text-xs font-bold text-white`}>
                            {emp.name.split(' ').map((n) => n[0]).join('')}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-surface-900 dark:text-surface-100">{emp.name}</p>
                            <span className={`text-[10px] font-medium rounded-full px-1.5 py-0.5 ${ROLE_COLOR[emp.role]}`}>{emp.role}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-2 py-2">
                        <div className="flex flex-wrap items-center gap-2">
                          {dayShifts.length === 0 && (
                            <span className="text-xs text-surface-400">Repos</span>
                          )}
                          {dayShifts.map((shift) => {
                            const cfg = SHIFT_CFG[shift.type];
                            const Icon = cfg.icon;
                            return (
                              <button
                                key={shift.id}
                                onClick={() => openEdit(shift)}
                                className={clsx('flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition-all hover:opacity-80', cfg.bg, cfg.border, cfg.text)}
                              >
                                <Icon className="h-3 w-3" />
                                {shift.startTime}–{shift.endTime}
                                <span className="ml-1 opacity-60">· {cfg.label}</span>
                              </button>
                            );
                          })}
                          <button
                            onClick={() => openAdd(dIdx, emp.id)}
                            className="rounded-lg border border-dashed border-surface-200 px-2 py-1 text-[11px] text-surface-400 opacity-0 transition-opacity group-hover:opacity-100 hover:border-brand-300 hover:text-brand-500 dark:border-surface-700"
                          >
                            + Shift
                          </button>
                        </div>
                      </td>
                      <td className="py-3 pr-4 text-right">
                        <span className={clsx('text-sm font-bold', hrs >= 8 ? 'text-green-600' : hrs > 0 ? 'text-surface-700 dark:text-surface-200' : 'text-surface-300')}>
                          {hrs.toFixed(0)}h
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Card>
        );
      })()}

      {/* Grid — month */}
      {scope === 'month' && (() => {
        const grid = getMonthGrid(monthOffset);
        return (
          <Card padding="none" className="overflow-hidden">
            <div className="grid grid-cols-7 border-b border-surface-100 dark:border-surface-700">
              {DAYS.map((d) => (
                <div key={d} className="py-2 text-center text-[11px] font-semibold uppercase tracking-wider text-surface-500">{d}</div>
              ))}
            </div>
            <div className="grid grid-cols-7">
              {grid.map((cell, i) => {
                const dIdx = dowIndex(cell.date);
                const isToday = cell.date.toDateString() === new Date().toDateString();
                // Note: shifts.day represents recurring DOW so each month-day reuses same set.
                const dayShifts = shifts.filter((s) => s.day === dIdx);
                const hrs = totalHours(dayShifts);
                return (
                  <button
                    key={i}
                    onClick={() => {
                      // Switch to day view at this date
                      const todayMid = new Date(); todayMid.setHours(0,0,0,0);
                      const sel = new Date(cell.date); sel.setHours(0,0,0,0);
                      const diff = Math.round((sel.getTime() - todayMid.getTime()) / 86400000);
                      setDayOffset(diff);
                      setScope('day');
                    }}
                    className={clsx(
                      'group min-h-[88px] border-r border-b border-surface-100 p-2 text-left transition-colors dark:border-surface-700',
                      cell.inMonth ? 'bg-white dark:bg-surface-800' : 'bg-surface-50/50 dark:bg-surface-900/40',
                      isToday && 'ring-2 ring-inset ring-brand-500',
                      'hover:bg-brand-50/40 dark:hover:bg-brand-500/5',
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className={clsx('text-xs font-bold', isToday ? 'text-brand-600' : cell.inMonth ? 'text-surface-700 dark:text-surface-200' : 'text-surface-300')}>
                        {cell.date.getDate()}
                      </span>
                      {dayShifts.length > 0 && cell.inMonth && (
                        <span className="rounded-full bg-brand-100 px-1.5 py-0.5 text-[9px] font-semibold text-brand-700">
                          {dayShifts.length}
                        </span>
                      )}
                    </div>
                    {cell.inMonth && dayShifts.length > 0 && (
                      <div className="mt-1 space-y-0.5">
                        <div className="flex gap-0.5">
                          {Array.from(new Set(dayShifts.map((s) => s.type))).slice(0, 4).map((t) => (
                            <span key={t} className={clsx('h-1 flex-1 rounded-full', SHIFT_CFG[t].bg.replace('bg-', 'bg-').replace('-50', '-400'))} />
                          ))}
                        </div>
                        <p className="text-[10px] text-surface-500">{hrs.toFixed(0)}h · {new Set(dayShifts.map((s) => s.employeeId)).size} pers.</p>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </Card>
        );
      })()}

      {/* Add/Edit Modal */}
      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title={editingId ? 'Modifier le shift' : 'Ajouter un shift'}
        size="md"
        footer={
          <div className="flex items-center justify-between">
            {editingId ? (
              <button onClick={() => deleteShift(editingId!)} className="flex items-center gap-1.5 text-sm font-medium text-red-500 hover:text-red-600">
                <Trash2 className="h-4 w-4" />Supprimer
              </button>
            ) : <div />}
            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => setShowModal(false)}>Annuler</Button>
              <Button onClick={handleSave} disabled={!form.employeeId || form.startTime >= form.endTime}>
                {editingId ? 'Enregistrer' : 'Ajouter'}
              </Button>
            </div>
          </div>
        }
      >
        <div className="space-y-4">
          {/* Employee */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-surface-700 dark:text-surface-300">Employé</label>
            <select
              value={form.employeeId}
              onChange={(e) => setForm((f) => ({ ...f, employeeId: e.target.value }))}
              className="w-full rounded-xl border border-surface-200 bg-white px-3 py-2 text-sm text-surface-900 focus:border-brand-400 focus:outline-none dark:border-surface-600 dark:bg-surface-700 dark:text-surface-100"
            >
              {EMPLOYEES.map((e) => (
                <option key={e.id} value={e.id}>{e.name} — {e.role}</option>
              ))}
            </select>
          </div>

          {/* Day */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-surface-700 dark:text-surface-300">Jour</label>
            <div className="flex gap-1.5 flex-wrap">
              {DAYS_FULL.map((d, i) => (
                <button
                  key={d}
                  onClick={() => setForm((f) => ({ ...f, day: String(i) }))}
                  className={clsx(
                    'rounded-lg px-3 py-1.5 text-xs font-medium transition-colors',
                    String(i) === form.day
                      ? 'bg-brand-500 text-black'
                      : 'border border-surface-200 text-surface-600 hover:bg-surface-50 dark:border-surface-600 dark:text-surface-300'
                  )}
                >
                  {DAYS[i]}
                </button>
              ))}
            </div>
          </div>

          {/* Shift type */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-surface-700 dark:text-surface-300">Type de shift</label>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(SHIFT_CFG).map(([type, cfg]) => {
                const Icon = cfg.icon;
                const selected = form.type === type;
                return (
                  <button
                    key={type}
                    onClick={() => onTypeChange(type as ShiftType)}
                    className={clsx(
                      'flex items-center gap-2 rounded-xl border px-3 py-2.5 text-left transition-all',
                      selected ? `${cfg.bg} ${cfg.border} ${cfg.text} font-semibold` : 'border-surface-200 hover:border-surface-300 dark:border-surface-600'
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <div>
                      <p className="text-sm">{cfg.label}</p>
                      <p className="text-[10px] text-surface-400">{cfg.start}–{cfg.end}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom times */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-surface-700 dark:text-surface-300">Début</label>
              <input
                type="time"
                value={form.startTime}
                onChange={(e) => setForm((f) => ({ ...f, startTime: e.target.value }))}
                className="w-full rounded-xl border border-surface-200 bg-white px-3 py-2 text-sm text-surface-900 focus:border-brand-400 focus:outline-none dark:border-surface-600 dark:bg-surface-700 dark:text-surface-100"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-surface-700 dark:text-surface-300">Fin</label>
              <input
                type="time"
                value={form.endTime}
                onChange={(e) => setForm((f) => ({ ...f, endTime: e.target.value }))}
                className="w-full rounded-xl border border-surface-200 bg-white px-3 py-2 text-sm text-surface-900 focus:border-brand-400 focus:outline-none dark:border-surface-600 dark:bg-surface-700 dark:text-surface-100"
              />
            </div>
          </div>
          {form.startTime >= form.endTime && (
            <p className="text-xs text-red-500">L&apos;heure de fin doit être après le début</p>
          )}

          {/* Note */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-surface-700 dark:text-surface-300">Note (optionnel)</label>
            <input
              type="text"
              value={form.note}
              onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
              placeholder="Ex: remplaçant, formation…"
              className="w-full rounded-xl border border-surface-200 bg-white px-3 py-2 text-sm text-surface-900 placeholder:text-surface-400 focus:border-brand-400 focus:outline-none dark:border-surface-600 dark:bg-surface-700 dark:text-surface-100"
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
