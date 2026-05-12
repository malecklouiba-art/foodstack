'use client';

import { useState, useCallback } from 'react';
import {
  Users,
  Clock,
  CalendarDays,
  Plus,
  Pencil,
  ChevronUp,
  ChevronDown,
  UserMinus,
  Check,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type StaffRole = 'gérant' | 'cuisinier' | 'serveur' | 'livreur' | 'caissier';
type SortDir = 'asc' | 'desc';

interface StaffMember {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: StaffRole;
  active: boolean;
  lastLogin: string;
}

type DayKey = 'Lun' | 'Mar' | 'Mer' | 'Jeu' | 'Ven' | 'Sam' | 'Dim';

type Schedule = Record<DayKey, Record<string, string>>;

// ---------------------------------------------------------------------------
// Constants & mock data
// ---------------------------------------------------------------------------

const DAYS: DayKey[] = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

const ROLE_COLORS: Record<StaffRole, string> = {
  gérant:    'bg-purple-900/60 text-purple-300 border border-purple-700',
  cuisinier: 'bg-orange-900/60 text-orange-300 border border-orange-700',
  serveur:   'bg-blue-900/60   text-blue-300   border border-blue-700',
  livreur:   'bg-green-900/60  text-green-300  border border-green-700',
  caissier:  'bg-gray-800      text-gray-300   border border-gray-600',
};

const ROLE_OPTIONS: { value: string; label: string }[] = [
  { value: 'gérant',    label: 'Gérant' },
  { value: 'cuisinier', label: 'Cuisinier' },
  { value: 'serveur',   label: 'Serveur' },
  { value: 'livreur',   label: 'Livreur' },
  { value: 'caissier',  label: 'Caissier' },
];

const INITIAL_STAFF: StaffMember[] = [
  { id: 's1', firstName: 'Jean',    lastName: 'Dupont',   email: 'jean.dupont@foodstack.fr',   phone: '06 11 22 33 44', role: 'gérant',    active: true,  lastLogin: 'Aujourd\'hui 09:12' },
  { id: 's2', firstName: 'Sophie',  lastName: 'Martin',   email: 'sophie.martin@foodstack.fr', phone: '06 22 33 44 55', role: 'cuisinier', active: true,  lastLogin: 'Aujourd\'hui 08:45' },
  { id: 's3', firstName: 'Karim',   lastName: 'Amara',    email: 'karim.amara@foodstack.fr',   phone: '06 33 44 55 66', role: 'serveur',   active: true,  lastLogin: 'Hier 19:30' },
  { id: 's4', firstName: 'Alice',   lastName: 'Bonnet',   email: 'alice.bonnet@foodstack.fr',  phone: '06 44 55 66 77', role: 'livreur',   active: true,  lastLogin: 'Aujourd\'hui 11:00' },
  { id: 's5', firstName: 'Tom',     lastName: 'Bernard',  email: 'tom.bernard@foodstack.fr',   phone: '06 55 66 77 88', role: 'cuisinier', active: true,  lastLogin: 'Hier 14:20' },
  { id: 's6', firstName: 'Lucie',   lastName: 'Petit',    email: 'lucie.petit@foodstack.fr',   phone: '06 66 77 88 99', role: 'caissier',  active: false, lastLogin: 'Il y a 3 sem.' },
  { id: 's7', firstName: 'Marc',    lastName: 'Leblanc',  email: 'marc.leblanc@foodstack.fr',  phone: '06 77 88 99 00', role: 'livreur',   active: true,  lastLogin: 'Aujourd\'hui 10:15' },
  { id: 's8', firstName: 'Inès',    lastName: 'Rousseau', email: 'ines.rousseau@foodstack.fr', phone: '06 88 99 00 11', role: 'serveur',   active: false, lastLogin: 'Il y a 1 sem.' },
];

// Mock weekly schedule — staffId -> { day -> shift or '' }
const buildInitialSchedule = (): Schedule => {
  const shifts: Record<string, Partial<Record<DayKey, string>>> = {
    s1: { Lun: '09h-17h', Mar: '09h-17h', Mer: '09h-17h', Jeu: '09h-17h', Ven: '09h-17h' },
    s2: { Lun: '10h-18h', Mar: '10h-18h', Mer: '-',       Jeu: '10h-18h', Ven: '10h-18h', Sam: '11h-19h' },
    s3: { Mar: '12h-20h', Mer: '12h-20h', Jeu: '12h-20h', Ven: '12h-20h', Sam: '12h-22h', Dim: '12h-20h' },
    s4: { Lun: '08h-16h', Mer: '08h-16h', Ven: '08h-16h', Sam: '09h-17h' },
    s5: { Lun: '07h-15h', Mar: '07h-15h', Jeu: '07h-15h', Ven: '07h-15h', Sam: '07h-15h' },
    s6: {},
    s7: { Lun: '14h-22h', Mar: '14h-22h', Mer: '14h-22h', Jeu: '14h-22h', Sam: '10h-18h', Dim: '10h-18h' },
    s8: {},
  };

  const schedule: Schedule = {} as Schedule;
  for (const day of DAYS) {
    schedule[day] = {};
    for (const m of INITIAL_STAFF) {
      schedule[day][m.id] = shifts[m.id]?.[day] ?? '-';
    }
  }
  return schedule;
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function fullName(m: StaffMember): string {
  return `${m.firstName} ${m.lastName}`;
}

// ---------------------------------------------------------------------------
// Form state types
// ---------------------------------------------------------------------------

interface StaffForm {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: StaffRole;
  password: string;
  active: boolean;
}

const BLANK_FORM: StaffForm = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  role: 'serveur',
  password: '',
  active: true,
};

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------

export default function StaffPage() {
  const [staff, setStaff] = useState<StaffMember[]>(INITIAL_STAFF);
  const [schedule, setSchedule] = useState<Schedule>(buildInitialSchedule);
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<StaffMember | null>(null);
  const [form, setForm] = useState<StaffForm>(BLANK_FORM);
  const [saving, setSaving] = useState(false);

  // Disable confirm state — stores the id of the member pending confirmation
  const [disableConfirmId, setDisableConfirmId] = useState<string | null>(null);

  // Schedule cell inline edit — { day, staffId, value }
  const [cellEdit, setCellEdit] = useState<{ day: DayKey; staffId: string; value: string } | null>(null);

  // ---------------------------------------------------------------------------
  // Derived stats
  // ---------------------------------------------------------------------------

  const totalEmployes = staff.length;
  const enServiceAujourdhui = staff.filter((m) => m.active).length;
  const heuresCetteSemaine = 187;

  // ---------------------------------------------------------------------------
  // Sort
  // ---------------------------------------------------------------------------

  const sorted = [...staff].sort((a, b) => {
    const cmp = fullName(a).localeCompare(fullName(b), 'fr');
    return sortDir === 'asc' ? cmp : -cmp;
  });

  const toggleSort = useCallback(() => {
    setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
  }, []);

  // ---------------------------------------------------------------------------
  // Modal helpers
  // ---------------------------------------------------------------------------

  const openAdd = () => {
    setEditTarget(null);
    setForm(BLANK_FORM);
    setModalOpen(true);
  };

  const openEdit = (member: StaffMember) => {
    setEditTarget(member);
    setForm({
      firstName: member.firstName,
      lastName: member.lastName,
      email: member.email,
      phone: member.phone,
      role: member.role,
      password: '',
      active: member.active,
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditTarget(null);
    setForm(BLANK_FORM);
  };

  const handleSave = async () => {
    setSaving(true);
    await new Promise<void>((res) => setTimeout(res, 600));

    if (editTarget) {
      // Update existing member
      setStaff((prev) =>
        prev.map((m) =>
          m.id === editTarget.id
            ? {
                ...m,
                firstName: form.firstName,
                lastName: form.lastName,
                email: form.email,
                phone: form.phone,
                role: form.role,
                active: form.active,
              }
            : m
        )
      );
    } else {
      // Add new member
      const newMember: StaffMember = {
        id: `s-${Date.now()}`,
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        phone: form.phone,
        role: form.role,
        active: form.active,
        lastLogin: 'Jamais',
      };
      setStaff((prev) => [...prev, newMember]);
      // Init schedule row for new member
      setSchedule((prev) => {
        const next = { ...prev } as Schedule;
        for (const day of DAYS) {
          next[day] = { ...next[day], [newMember.id]: '-' };
        }
        return next;
      });
    }

    setSaving(false);
    closeModal();
  };

  // ---------------------------------------------------------------------------
  // Disable / re-enable
  // ---------------------------------------------------------------------------

  const handleDisable = (memberId: string) => {
    setDisableConfirmId(memberId);
  };

  const confirmDisable = (memberId: string) => {
    setStaff((prev) =>
      prev.map((m) => (m.id === memberId ? { ...m, active: false } : m))
    );
    setDisableConfirmId(null);
  };

  const cancelDisable = () => {
    setDisableConfirmId(null);
  };

  // ---------------------------------------------------------------------------
  // Schedule cell edit
  // ---------------------------------------------------------------------------

  const startCellEdit = (day: DayKey, staffId: string) => {
    setCellEdit({ day, staffId, value: schedule[day][staffId] ?? '-' });
  };

  const commitCellEdit = () => {
    if (!cellEdit) return;
    setSchedule((prev) => ({
      ...prev,
      [cellEdit.day]: {
        ...prev[cellEdit.day],
        [cellEdit.staffId]: cellEdit.value.trim() || '-',
      },
    }));
    setCellEdit(null);
  };

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="min-h-screen bg-gray-950 p-6 text-white">
      {/* ------------------------------------------------------------------ */}
      {/* Header                                                              */}
      {/* ------------------------------------------------------------------ */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Équipe</h1>
          <p className="mt-1 text-sm text-gray-400">
            Gérez vos employés et leurs accès
          </p>
        </div>
        <Button
          icon={<Plus className="h-4 w-4" />}
          onClick={openAdd}
        >
          Ajouter un employé
        </Button>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Stats row                                                           */}
      {/* ------------------------------------------------------------------ */}
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        {/* Total employés */}
        <div className="rounded-2xl border border-gray-800 bg-gray-900 p-5">
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-blue-900/40">
            <Users className="h-5 w-5 text-blue-400" />
          </div>
          <p className="text-2xl font-bold text-white">{totalEmployes}</p>
          <p className="mt-0.5 text-sm text-gray-400">Total employés</p>
        </div>

        {/* En service aujourd'hui */}
        <div className="rounded-2xl border border-gray-800 bg-gray-900 p-5">
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-green-900/40">
            <Clock className="h-5 w-5 text-green-400" />
          </div>
          <p className="text-2xl font-bold text-white">{enServiceAujourdhui}</p>
          <p className="mt-0.5 text-sm text-gray-400">En service aujourd&#39;hui</p>
        </div>

        {/* Heures cette semaine */}
        <div className="rounded-2xl border border-gray-800 bg-gray-900 p-5">
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-purple-900/40">
            <CalendarDays className="h-5 w-5 text-purple-400" />
          </div>
          <p className="text-2xl font-bold text-white">{heuresCetteSemaine}h</p>
          <p className="mt-0.5 text-sm text-gray-400">Heures cette semaine</p>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Staff table                                                         */}
      {/* ------------------------------------------------------------------ */}
      <div className="mb-8 overflow-hidden rounded-2xl border border-gray-800 bg-gray-900">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-800 bg-gray-800/60">
                {/* Sortable name header */}
                <th className="px-4 py-3 text-left">
                  <button
                    onClick={toggleSort}
                    className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-gray-400 hover:text-white"
                  >
                    Nom
                    {sortDir === 'asc' ? (
                      <ChevronUp className="h-3.5 w-3.5" />
                    ) : (
                      <ChevronDown className="h-3.5 w-3.5" />
                    )}
                  </button>
                </th>
                {['Rôle', 'Téléphone', 'Email', 'Statut', 'Dernière connexion', 'Actions'].map(
                  (col) => (
                    <th
                      key={col}
                      className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400"
                    >
                      {col}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {sorted.map((member) => {
                const isConfirming = disableConfirmId === member.id;

                if (isConfirming) {
                  return (
                    <tr key={member.id} className="bg-red-950/40">
                      <td colSpan={7} className="px-4 py-3">
                        <div className="flex flex-wrap items-center gap-3">
                          <span className="text-sm text-red-300">
                            Confirmer la désactivation de{' '}
                            <span className="font-semibold text-white">
                              {fullName(member)}
                            </span>{' '}
                            ?
                          </span>
                          <div className="flex gap-2">
                            <Button
                              variant="danger"
                              size="sm"
                              icon={<Check className="h-3.5 w-3.5" />}
                              onClick={() => confirmDisable(member.id)}
                            >
                              Oui
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              icon={<X className="h-3.5 w-3.5" />}
                              onClick={cancelDisable}
                            >
                              Non
                            </Button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                }

                return (
                  <tr
                    key={member.id}
                    className="transition-colors hover:bg-gray-800/40"
                  >
                    {/* Avatar + Nom */}
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <Avatar name={fullName(member)} size="sm" />
                        <span className="text-sm font-semibold text-white">
                          {fullName(member)}
                        </span>
                      </div>
                    </td>

                    {/* Rôle badge */}
                    <td className="px-4 py-3.5">
                      <span
                        className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${ROLE_COLORS[member.role]}`}
                      >
                        {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                      </span>
                    </td>

                    {/* Téléphone */}
                    <td className="px-4 py-3.5 text-sm text-gray-300">
                      {member.phone}
                    </td>

                    {/* Email */}
                    <td className="px-4 py-3.5 text-sm text-gray-300">
                      {member.email}
                    </td>

                    {/* Statut */}
                    <td className="px-4 py-3.5">
                      {member.active ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-green-900/40 px-2.5 py-0.5 text-xs font-semibold text-green-400">
                          <span className="h-1.5 w-1.5 rounded-full bg-green-400" />
                          Actif
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-800 px-2.5 py-0.5 text-xs font-semibold text-gray-400">
                          <span className="h-1.5 w-1.5 rounded-full bg-gray-500" />
                          Inactif
                        </span>
                      )}
                    </td>

                    {/* Dernière connexion */}
                    <td className="px-4 py-3.5 text-sm text-gray-400">
                      {member.lastLogin}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openEdit(member)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-700 hover:text-white"
                          title="Modifier"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        {member.active && (
                          <button
                            onClick={() => handleDisable(member.id)}
                            className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-red-900/40 hover:text-red-400"
                            title="Désactiver"
                          >
                            <UserMinus className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Weekly schedule grid                                                */}
      {/* ------------------------------------------------------------------ */}
      <div className="rounded-2xl border border-gray-800 bg-gray-900">
        <div className="border-b border-gray-800 px-6 py-4">
          <h2 className="text-lg font-semibold text-white">Planning hebdomadaire</h2>
          <p className="mt-0.5 text-sm text-gray-400">
            Cliquez sur une case pour modifier le créneau horaire
          </p>
        </div>

        <div className="overflow-x-auto p-4">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="w-16 pb-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">
                  Jour
                </th>
                {staff.map((m) => (
                  <th
                    key={m.id}
                    className="pb-3 text-center text-xs font-semibold uppercase tracking-wider text-gray-400"
                  >
                    {m.firstName}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {DAYS.map((day) => (
                <tr key={day} className="hover:bg-gray-800/30">
                  <td className="py-2.5 pr-4 font-semibold text-gray-300">{day}</td>
                  {staff.map((m) => {
                    const isEditing =
                      cellEdit?.day === day && cellEdit.staffId === m.id;
                    const value = schedule[day]?.[m.id] ?? '-';

                    return (
                      <td key={m.id} className="px-1 py-2 text-center">
                        {isEditing ? (
                          <input
                            autoFocus
                            value={cellEdit.value}
                            onChange={(e) =>
                              setCellEdit((prev) =>
                                prev ? { ...prev, value: e.target.value } : prev
                              )
                            }
                            onBlur={commitCellEdit}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') commitCellEdit();
                              if (e.key === 'Escape') setCellEdit(null);
                            }}
                            className="w-24 rounded-lg border border-blue-600 bg-gray-800 px-2 py-1 text-center text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="10h-18h"
                          />
                        ) : (
                          <button
                            onClick={() => startCellEdit(day, m.id)}
                            className={`w-20 rounded-lg px-2 py-1 text-xs transition-colors ${
                              value === '-'
                                ? 'text-gray-600 hover:bg-gray-700 hover:text-gray-400'
                                : 'bg-blue-900/30 text-blue-300 hover:bg-blue-800/50'
                            }`}
                          >
                            {value}
                          </button>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Add / Edit modal                                                    */}
      {/* ------------------------------------------------------------------ */}
      <Modal
        open={modalOpen}
        onClose={closeModal}
        title={editTarget ? 'Modifier un employé' : 'Ajouter un employé'}
        description={
          editTarget
            ? `Modifier les informations de ${fullName(editTarget)}`
            : 'Remplissez les informations du nouvel employé'
        }
        size="lg"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={closeModal} disabled={saving}>
              Annuler
            </Button>
            <Button onClick={handleSave} loading={saving}>
              {editTarget ? 'Enregistrer' : 'Ajouter'}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          {/* First + Last name */}
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Prénom"
              value={form.firstName}
              onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
              placeholder="Jean"
              required
            />
            <Input
              label="Nom"
              value={form.lastName}
              onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
              placeholder="Dupont"
              required
            />
          </div>

          {/* Email */}
          <Input
            label="Email"
            type="email"
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            placeholder="jean@restaurant.fr"
            required
          />

          {/* Téléphone */}
          <Input
            label="Téléphone"
            type="tel"
            value={form.phone}
            onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
            placeholder="06 00 00 00 00"
          />

          {/* Rôle */}
          <Select
            label="Rôle"
            options={ROLE_OPTIONS}
            value={form.role}
            onChange={(e) => setForm((f) => ({ ...f, role: e.target.value as StaffRole }))}
          />

          {/* Password — only for add mode */}
          {!editTarget && (
            <Input
              label="Mot de passe"
              type="password"
              value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              placeholder="••••••••"
              required
            />
          )}

          {/* Actif toggle */}
          <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 dark:border-gray-700 dark:bg-gray-800">
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Compte actif</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                L&#39;employé peut se connecter au système
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={form.active}
              onClick={() => setForm((f) => ({ ...f, active: !f.active }))}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                form.active ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-600'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  form.active ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
