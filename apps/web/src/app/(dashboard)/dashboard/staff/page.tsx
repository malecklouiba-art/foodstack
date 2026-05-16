'use client';

import { useState } from 'react';
import {
  Users, UserPlus, Search, Shield, ChefHat,
  Utensils, Bike, ToggleLeft, ToggleRight, Pencil, Trash2, Mail, X,
  Lock, KeyRound, CalendarCheck,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';

// ── Types ──────────────────────────────────────────────────────────────────────

type Role = 'Manager' | 'Cuisinier' | 'Serveur' | 'Serveuse' | 'Livreur';
type Status = 'actif' | 'inactif';

interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  role: Role;
  status: Status;
  email: string;
  joinedLabel: string;
  posPin?: string; // 4-digit string; empty/undefined = not set
}

// ── Demo data ──────────────────────────────────────────────────────────────────

const INITIAL_EMPLOYEES: Employee[] = [
  { id: 'e1', firstName: 'Marie',   lastName: 'Dupont',  role: 'Manager',   status: 'actif',   email: 'marie.dupont@foodstack.fr',   joinedLabel: 'il y a 3 mois', posPin: '1234' },
  { id: 'e2', firstName: 'Pierre',  lastName: 'Martin',  role: 'Cuisinier', status: 'actif',   email: 'pierre.martin@foodstack.fr',  joinedLabel: 'il y a 6 mois' },
  { id: 'e3', firstName: 'Sophie',  lastName: 'Bernard', role: 'Serveuse',  status: 'actif',   email: 'sophie.bernard@foodstack.fr', joinedLabel: 'il y a 1 mois', posPin: '5678' },
  { id: 'e4', firstName: 'Julien',  lastName: 'Moreau',  role: 'Livreur',   status: 'inactif', email: 'julien.moreau@foodstack.fr',  joinedLabel: 'il y a 8 mois' },
  { id: 'e5', firstName: 'Claire',  lastName: 'Lambert', role: 'Manager',   status: 'actif',   email: 'claire.lambert@foodstack.fr', joinedLabel: 'il y a 2 ans' },
  { id: 'e6', firstName: 'Thomas',  lastName: 'Petit',   role: 'Cuisinier', status: 'actif',   email: 'thomas.petit@foodstack.fr',   joinedLabel: 'il y a 1 an' },
  { id: 'e7', firstName: 'Emma',    lastName: 'Richard', role: 'Serveuse',  status: 'actif',   email: 'emma.richard@foodstack.fr',   joinedLabel: 'il y a 4 mois' },
  { id: 'e8', firstName: 'Lucas',   lastName: 'Durand',  role: 'Livreur',   status: 'inactif', email: 'lucas.durand@foodstack.fr',   joinedLabel: 'il y a 2 mois' },
];

const ROLE_FILTERS = ['Tous', 'Manager', 'Cuisinier', 'Serveur', 'Livreur'] as const;
type RoleFilter = typeof ROLE_FILTERS[number];

// ── Role configuration ─────────────────────────────────────────────────────────

const roleConfig: Record<Role, { variant: 'brand' | 'warning' | 'info' | 'default'; icon: React.ElementType }> = {
  Manager:   { variant: 'brand',   icon: Shield    },
  Cuisinier: { variant: 'warning', icon: ChefHat   },
  Serveur:   { variant: 'info',    icon: Utensils  },
  Serveuse:  { variant: 'info',    icon: Utensils  },
  Livreur:   { variant: 'default', icon: Bike      },
};

// ── Avatar ─────────────────────────────────────────────────────────────────────

function Avatar({ employee }: { employee: Employee }) {
  const initials = `${employee.firstName[0]}${employee.lastName[0]}`;
  const colors: Record<Role, string> = {
    Manager:   'bg-brand-500/20 text-brand-400',
    Cuisinier: 'bg-yellow-500/20 text-yellow-400',
    Serveur:   'bg-blue-500/20 text-blue-400',
    Serveuse:  'bg-blue-500/20 text-blue-400',
    Livreur:   'bg-surface-500/20 text-surface-400',
  };
  return (
    <div className={clsx('flex h-10 w-10 items-center justify-center rounded-xl text-sm font-bold', colors[employee.role])}>
      {initials}
    </div>
  );
}

// ── POS PIN chip ───────────────────────────────────────────────────────────────

function PosPinChip({ posPin }: { posPin?: string }) {
  const hasPin = !!posPin;
  return (
    <span className={clsx(
      'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium',
      hasPin
        ? 'bg-surface-100 text-surface-600 dark:bg-surface-700 dark:text-surface-300'
        : 'bg-orange-50 text-orange-500 dark:bg-orange-900/20',
    )}>
      {hasPin
        ? <><Lock className="h-3 w-3" />{'••••'}</>
        : 'Non défini'}
    </span>
  );
}

// ── Manage POS PIN modal ───────────────────────────────────────────────────────

interface ManagePinModalProps {
  employee: Employee;
  open: boolean;
  onClose: () => void;
  onSave: (employeeId: string, pin: string) => void;
}

function ManagePinModal({ employee, open, onClose, onSave }: ManagePinModalProps) {
  const [pin, setPin]     = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const hasPin = !!employee.posPin;

  function handleSave() {
    if (pin.length !== 4 || !/^\d{4}$/.test(pin)) {
      setError('Le code doit contenir exactement 4 chiffres.');
      return;
    }
    if (pin !== confirm) {
      setError('Les codes ne correspondent pas.');
      return;
    }
    onSave(employee.id, pin);
    setPin('');
    setConfirm('');
    setError('');
    onClose();
  }

  function handleClose() {
    setPin('');
    setConfirm('');
    setError('');
    onClose();
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Gérer le code POS"
      description={`${employee.firstName} ${employee.lastName}`}
    >
      <div className="space-y-4">
        {/* Current status */}
        <div className="flex items-center justify-between rounded-xl bg-surface-50 dark:bg-surface-800 px-4 py-3">
          <span className="text-sm text-surface-500">Statut actuel</span>
          <PosPinChip posPin={employee.posPin} />
        </div>

        {/* New PIN */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-surface-700 dark:text-surface-300">
            {hasPin ? 'Nouveau code POS (4 chiffres)' : 'Code POS (4 chiffres)'}
          </label>
          <Input
            type="password"
            placeholder="••••"
            maxLength={4}
            value={pin}
            onChange={(e) => { setPin(e.target.value.replace(/\D/g, '').slice(0, 4)); setError(''); }}
            leftIcon={<KeyRound className="h-4 w-4" />}
          />
        </div>

        {/* Confirm PIN */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-surface-700 dark:text-surface-300">
            Confirmer le code
          </label>
          <Input
            type="password"
            placeholder="••••"
            maxLength={4}
            value={confirm}
            onChange={(e) => { setConfirm(e.target.value.replace(/\D/g, '').slice(0, 4)); setError(''); }}
            leftIcon={<KeyRound className="h-4 w-4" />}
          />
        </div>

        {error && (
          <p className="text-sm text-red-500">{error}</p>
        )}

        <Button
          variant="primary"
          fullWidth
          icon={<Lock className="h-4 w-4" />}
          disabled={pin.length !== 4 || confirm.length !== 4}
          onClick={handleSave}
        >
          {hasPin ? 'Modifier le code POS' : 'Définir le code POS'}
        </Button>
      </div>
    </Modal>
  );
}

// ── Employee card ──────────────────────────────────────────────────────────────

interface EmployeeCardProps {
  employee: Employee;
  onToggleStatus: (id: string) => void;
  onRemove: (id: string) => void;
  onManagePin: (employee: Employee) => void;
  onConvoke: (employee: Employee) => void;
}

function EmployeeCard({ employee, onToggleStatus, onRemove, onManagePin, onConvoke }: EmployeeCardProps) {
  const role = roleConfig[employee.role];
  const isActive = employee.status === 'actif';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.2 }}
    >
      <Card padding="md" className="group transition-shadow hover:shadow-md">
        <div className="flex items-start gap-4">
          <Avatar employee={employee} />

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-surface-900 dark:text-surface-50">
                {employee.firstName} {employee.lastName}
              </span>
              <Badge variant={role.variant}>{employee.role}</Badge>
              <Badge variant={isActive ? 'success' : 'default'} dot>
                {employee.status}
              </Badge>
              {/* POS PIN chip */}
              <PosPinChip posPin={employee.posPin} />
            </div>
            <p className="mt-0.5 flex items-center gap-1 text-xs text-surface-400">
              <Mail className="h-3 w-3" />
              {employee.email}
            </p>
            <p className="mt-0.5 text-xs text-surface-400">Rejoint {employee.joinedLabel}</p>
          </div>

          {/* Actions */}
          <div className="flex shrink-0 items-center gap-2">
            {/* Status toggle */}
            <button
              onClick={() => onToggleStatus(employee.id)}
              title={isActive ? 'Désactiver' : 'Activer'}
              className={clsx(
                'rounded-lg p-1.5 transition-colors',
                isActive
                  ? 'text-brand-500 hover:bg-brand-500/10'
                  : 'text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-700'
              )}
            >
              {isActive
                ? <ToggleRight className="h-5 w-5" />
                : <ToggleLeft  className="h-5 w-5" />}
            </button>

            {/* Convoquer */}
            <Button
              variant="ghost"
              size="sm"
              icon={<CalendarCheck className="h-3.5 w-3.5" />}
              onClick={() => onConvoke(employee)}
            >
              Convoquer
            </Button>

            {/* Manage POS PIN */}
            <Button
              variant="ghost"
              size="sm"
              icon={<KeyRound className="h-3.5 w-3.5" />}
              onClick={() => onManagePin(employee)}
            >
              Code POS
            </Button>

            {/* Modify permissions */}
            <Button variant="ghost" size="sm" icon={<Pencil className="h-3.5 w-3.5" />}>
              Modifier permissions
            </Button>

            {/* Remove */}
            <Button
              variant="ghost"
              size="sm"
              icon={<Trash2 className="h-3.5 w-3.5" />}
              className="text-red-500 hover:border-red-200 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20"
              onClick={() => onRemove(employee.id)}
            >
              Retirer
            </Button>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

// ── Invite modal ───────────────────────────────────────────────────────────────

interface InviteModalProps {
  open: boolean;
  onClose: () => void;
}

function InviteModal({ open, onClose }: InviteModalProps) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<Role>('Serveur');
  const [posPin, setPosPin] = useState('');
  const [sent, setSent] = useState(false);

  function handleSend() {
    if (!email) return;
    setSent(true);
    setTimeout(() => {
      setSent(false);
      setEmail('');
      setRole('Serveur');
      setPosPin('');
      onClose();
    }, 1500);
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Inviter un employé"
      description="Un email d'invitation sera envoyé à l'adresse indiquée."
    >
      <div className="space-y-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-surface-700">
            Adresse email
          </label>
          <Input
            type="email"
            placeholder="prenom.nom@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            leftIcon={<Mail className="h-4 w-4" />}
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-surface-700">
            Rôle
          </label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as Role)}
            className="h-10 w-full appearance-none rounded-xl border border-surface-200 bg-white px-3 text-sm text-surface-700 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-surface-700 dark:bg-surface-800 dark:text-surface-100"
          >
            <option value="Manager">Manager</option>
            <option value="Cuisinier">Cuisinier</option>
            <option value="Serveur">Serveur / Serveuse</option>
            <option value="Livreur">Livreur</option>
          </select>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-surface-700">
            Code POS (4 chiffres) <span className="text-surface-400 font-normal">— optionnel</span>
          </label>
          <Input
            type="password"
            placeholder="••••"
            maxLength={4}
            value={posPin}
            onChange={(e) => setPosPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
            leftIcon={<KeyRound className="h-4 w-4" />}
          />
        </div>

        <Button
          variant="primary"
          fullWidth
          icon={<Mail className="h-4 w-4" />}
          disabled={!email || sent}
          onClick={handleSend}
        >
          {sent ? 'Invitation envoyée !' : 'Envoyer l\'invitation'}
        </Button>
      </div>
    </Modal>
  );
}

// ── Convocation modal ──────────────────────────────────────────────────────────

const SELECT_CLASS = 'h-10 w-full appearance-none rounded-xl border border-surface-200 bg-white px-3 text-sm text-surface-700 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-surface-700 dark:bg-surface-800 dark:text-surface-100';

interface ConvocationModalProps {
  open: boolean;
  onClose: () => void;
  preSelected?: string[];
}

function ConvocationModal({ open, onClose, preSelected = [] }: ConvocationModalProps) {
  const [subject, setSubject] = useState('');
  const [selected, setSelected] = useState<string[]>(preSelected);
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [location, setLocation] = useState('Sur place');
  const [note, setNote] = useState('');

  // Sync preSelected when modal opens with a new employee
  const [prevPre, setPrevPre] = useState(preSelected);
  if (preSelected !== prevPre) {
    setPrevPre(preSelected);
    setSelected(preSelected);
  }

  function toggleEmployee(id: string) {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  function handleSubmit() {
    if (!subject || !date || !time || selected.length === 0) return;
    toast.success(`Convocation envoyée à ${selected.length} employé(s)`);
    setSubject('');
    setSelected([]);
    setDate('');
    setTime('');
    setLocation('Sur place');
    setNote('');
    onClose();
  }

  function handleClose() {
    setSubject('');
    setSelected(preSelected);
    setDate('');
    setTime('');
    setLocation('Sur place');
    setNote('');
    onClose();
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Planifier une réunion"
      description="Sélectionnez les participants et définissez les détails."
    >
      <div className="space-y-4">
        {/* Subject */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-surface-700 dark:text-surface-300">
            Objet de la réunion
          </label>
          <Input
            placeholder="Ex : Réunion hebdomadaire"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
          />
        </div>

        {/* Employees */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-surface-700 dark:text-surface-300">
            Participants
          </label>
          <div className="max-h-40 overflow-y-auto rounded-xl border border-surface-200 dark:border-surface-700 divide-y divide-surface-100 dark:divide-surface-700">
            {INITIAL_EMPLOYEES.map((emp) => (
              <label
                key={emp.id}
                className="flex cursor-pointer items-center gap-3 px-3 py-2 hover:bg-surface-50 dark:hover:bg-surface-800"
              >
                <input
                  type="checkbox"
                  checked={selected.includes(emp.id)}
                  onChange={() => toggleEmployee(emp.id)}
                  className="h-4 w-4 rounded accent-brand-500"
                />
                <span className="text-sm text-surface-700 dark:text-surface-300">
                  {emp.firstName} {emp.lastName}
                </span>
                <span className="ml-auto text-xs text-surface-400">{emp.role}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Date + Time */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-surface-700 dark:text-surface-300">
              Date
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className={SELECT_CLASS}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-surface-700 dark:text-surface-300">
              Heure
            </label>
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className={SELECT_CLASS}
            />
          </div>
        </div>

        {/* Location */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-surface-700 dark:text-surface-300">
            Lieu
          </label>
          <select
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className={SELECT_CLASS}
          >
            <option>Sur place</option>
            <option>Visioconférence</option>
            <option>En ligne (lien)</option>
          </select>
        </div>

        {/* Note */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-surface-700 dark:text-surface-300">
            Note <span className="font-normal text-surface-400">— optionnel</span>
          </label>
          <textarea
            rows={3}
            placeholder="Informations complémentaires…"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full resize-none rounded-xl border border-surface-200 bg-white px-3 py-2 text-sm text-surface-700 placeholder:text-surface-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-surface-700 dark:bg-surface-800 dark:text-surface-100"
          />
        </div>

        <Button
          variant="primary"
          fullWidth
          icon={<CalendarCheck className="h-4 w-4" />}
          disabled={!subject || !date || !time || selected.length === 0}
          onClick={handleSubmit}
        >
          Envoyer la convocation
        </Button>
      </div>
    </Modal>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function StaffPage() {
  const [employees, setEmployees] = useState<Employee[]>(INITIAL_EMPLOYEES);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('Tous');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [pinEmployee, setPinEmployee] = useState<Employee | null>(null);
  const [showConvocationModal, setShowConvocationModal] = useState(false);
  const [convokeEmployee, setConvokeEmployee] = useState<Employee | null>(null);

  function openConvoke(employee?: Employee) {
    setConvokeEmployee(employee ?? null);
    setShowConvocationModal(true);
  }

  const totalCount  = employees.length;
  const activeCount = employees.filter((e) => e.status === 'actif').length;
  const inactiveCount = totalCount - activeCount;

  function toggleStatus(id: string) {
    setEmployees((prev) =>
      prev.map((e) =>
        e.id === id ? { ...e, status: e.status === 'actif' ? 'inactif' : 'actif' } : e
      )
    );
  }

  function removeEmployee(id: string) {
    setEmployees((prev) => prev.filter((e) => e.id !== id));
  }

  function savePin(employeeId: string, pin: string) {
    setEmployees((prev) =>
      prev.map((e) => e.id === employeeId ? { ...e, posPin: pin } : e)
    );
  }

  const filtered = employees.filter((e) => {
    const matchSearch =
      !search ||
      `${e.firstName} ${e.lastName}`.toLowerCase().includes(search.toLowerCase()) ||
      e.email.toLowerCase().includes(search.toLowerCase());

    const matchRole =
      roleFilter === 'Tous' ||
      (roleFilter === 'Serveur' && (e.role === 'Serveur' || e.role === 'Serveuse')) ||
      e.role === roleFilter;

    return matchSearch && matchRole;
  });

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-50">
            Gestion des employés
          </h1>
          <p className="mt-1 text-sm text-surface-500">
            Gérez votre équipe et leurs accès
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            icon={<CalendarCheck className="h-4 w-4" />}
            onClick={() => openConvoke()}
          >
            Planifier une réunion
          </Button>
          <Button
            variant="primary"
            icon={<UserPlus className="h-4 w-4" />}
            onClick={() => setShowInviteModal(true)}
          >
            Inviter un employé
          </Button>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total employés', value: totalCount,    icon: Users,        color: 'bg-brand-500/10 dark:bg-brand-500/20',   iconColor: 'text-brand-500' },
          { label: 'Actifs',         value: activeCount,   icon: ToggleRight,  color: 'bg-green-500/10 dark:bg-green-500/20',  iconColor: 'text-green-500' },
          { label: 'Inactifs',       value: inactiveCount, icon: ToggleLeft,   color: 'bg-surface-200 dark:bg-surface-700',     iconColor: 'text-surface-500' },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label} padding="md" className="flex items-center gap-4">
              <div className={clsx('rounded-xl p-3', stat.color)}>
                <Icon className={clsx('h-5 w-5', stat.iconColor)} />
              </div>
              <div>
                <p className="text-2xl font-bold text-surface-900 dark:text-surface-50">{stat.value}</p>
                <p className="text-sm text-surface-500">{stat.label}</p>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Search + Role filter */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Input
          placeholder="Rechercher un employé…"
          leftIcon={<Search className="h-4 w-4" />}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="sm:max-w-xs"
        />

        {/* Role filter pills */}
        <div className="flex flex-wrap gap-2">
          {ROLE_FILTERS.map((r) => (
            <button
              key={r}
              onClick={() => setRoleFilter(r)}
              className={clsx(
                'rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors',
                roleFilter === r
                  ? 'bg-brand-500 text-white'
                  : 'bg-surface-100 text-surface-600 hover:bg-surface-200 dark:bg-surface-800 dark:text-surface-300 dark:hover:bg-surface-700'
              )}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Employee list */}
      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {filtered.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center gap-3 py-20 text-center"
            >
              <Users className="h-12 w-12 text-surface-300" />
              <p className="font-medium text-surface-500">Aucun employé trouvé</p>
            </motion.div>
          ) : (
            filtered.map((employee) => (
              <EmployeeCard
                key={employee.id}
                employee={employee}
                onToggleStatus={toggleStatus}
                onRemove={removeEmployee}
                onManagePin={setPinEmployee}
                onConvoke={openConvoke}
              />
            ))
          )}
        </AnimatePresence>
      </div>

      {/* Invite modal */}
      <InviteModal open={showInviteModal} onClose={() => setShowInviteModal(false)} />

      {/* Convocation modal */}
      <ConvocationModal
        open={showConvocationModal}
        onClose={() => { setShowConvocationModal(false); setConvokeEmployee(null); }}
        preSelected={convokeEmployee ? [convokeEmployee.id] : []}
      />

      {/* Manage POS PIN modal */}
      {pinEmployee && (
        <ManagePinModal
          employee={pinEmployee}
          open={!!pinEmployee}
          onClose={() => setPinEmployee(null)}
          onSave={savePin}
        />
      )}
    </div>
  );
}
