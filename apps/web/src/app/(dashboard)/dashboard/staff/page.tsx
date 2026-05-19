'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import {
  Users, UserPlus, Search, Shield, ChefHat,
  Bike, ToggleLeft, ToggleRight, Pencil, Trash2, Mail, X,
  Lock, KeyRound, CalendarCheck, Info, GraduationCap, Crown,
  CheckCircle2, MinusCircle, XCircle, MessageSquare,
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

type Role = 'Patron' | 'Manager' | 'Commis' | 'Stagiaire' | 'Livreur';
type Status = 'actif' | 'inactif';

interface ManagerPermissions {
  canEditMenu: boolean;
  canManageStaff: boolean;
  canViewAnalytics: boolean;
  canAccessPOS: boolean;
}

interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  role: Role;
  status: Status;
  email: string;
  joinedLabel: string;
  posPin?: string;
  managerPermissions?: ManagerPermissions;
}

// ── Permission Matrix ──────────────────────────────────────────────────────────

type PermissionLevel = 'full' | 'partial' | 'none';

type FeatureKey = 'Commandes' | 'Menu' | 'Employés' | 'Analytiques' | 'Paiements' | 'Paramètres' | 'Livraisons';

const FEATURES: FeatureKey[] = ['Commandes', 'Menu', 'Employés', 'Analytiques', 'Paiements', 'Paramètres', 'Livraisons'];

const PERMISSION_MATRIX: Record<Role, Record<FeatureKey, PermissionLevel>> = {
  Patron:    { Commandes: 'full',    Menu: 'full',    Employés: 'full',    Analytiques: 'full',    Paiements: 'full',    Paramètres: 'full',    Livraisons: 'full'    },
  Manager:   { Commandes: 'full',    Menu: 'full',    Employés: 'partial', Analytiques: 'full',    Paiements: 'none',    Paramètres: 'partial', Livraisons: 'full'    },
  Commis:    { Commandes: 'full',    Menu: 'none',    Employés: 'none',    Analytiques: 'none',    Paiements: 'none',    Paramètres: 'none',    Livraisons: 'full'    },
  Stagiaire: { Commandes: 'partial', Menu: 'none',    Employés: 'none',    Analytiques: 'none',    Paiements: 'none',    Paramètres: 'none',    Livraisons: 'none'    },
  Livreur:   { Commandes: 'partial', Menu: 'none',    Employés: 'none',    Analytiques: 'none',    Paiements: 'none',    Paramètres: 'none',    Livraisons: 'full'    },
};

// ── Role configuration ─────────────────────────────────────────────────────────

const DEFAULT_MANAGER_PERMISSIONS: ManagerPermissions = {
  canEditMenu: true,
  canManageStaff: true,
  canViewAnalytics: true,
  canAccessPOS: false,
};

type RoleBadgeVariant = 'brand' | 'warning' | 'info' | 'default' | 'success' | 'danger';

interface RoleConfig {
  variant: RoleBadgeVariant;
  icon: React.ElementType;
  label: string;
  color: string;      // Tailwind bg+text for avatar / icon chip
  badgeClass: string; // Exact badge colors per spec
  description: string;
  keyPerms: string[];  // 3 key permissions for mini summary
}

const ROLE_CONFIG: Record<Role, RoleConfig> = {
  Patron:    {
    variant: 'brand',
    icon: Crown,
    label: 'Patron / CEO',
    color: 'bg-purple-500/20 text-purple-400',
    badgeClass: 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300',
    description: 'Accès complet à toutes les fonctionnalités sans restriction.',
    keyPerms: ['Toutes les commandes', 'Paramètres & abonnement', 'Facturation'],
  },
  Manager:   {
    variant: 'info',
    icon: Shield,
    label: 'Manager',
    color: 'bg-blue-500/20 text-blue-400',
    badgeClass: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
    description: 'Gestion du personnel, menu et commandes. Sans accès facturation.',
    keyPerms: ['Commandes (complet)', 'Menu & Analytiques', 'Livraisons'],
  },
  Commis:    {
    variant: 'success',
    icon: ChefHat,
    label: 'Commis',
    color: 'bg-green-500/20 text-green-400',
    badgeClass: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',
    description: 'Consultation et mise à jour des commandes et livraisons cuisine.',
    keyPerms: ['Commandes (complet)', 'Livraisons (complet)', 'Lecture menu'],
  },
  Stagiaire: {
    variant: 'warning',
    icon: GraduationCap,
    label: 'Stagiaire',
    color: 'bg-yellow-500/20 text-yellow-400',
    badgeClass: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
    description: 'Accès partiel en lecture seule aux commandes uniquement.',
    keyPerms: ['Commandes (partiel)', 'Pas de menu', 'Pas de livraisons'],
  },
  Livreur:   {
    variant: 'warning',
    icon: Bike,
    label: 'Livreur',
    color: 'bg-orange-500/20 text-orange-400',
    badgeClass: 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300',
    description: 'Vue livraisons complète et suivi des commandes en transit.',
    keyPerms: ['Livraisons (complet)', 'Commandes (partiel)', 'Pas d\'analytiques'],
  },
};

// ── Demo data ──────────────────────────────────────────────────────────────────

const INITIAL_EMPLOYEES: Employee[] = [
  { id: 'e1', firstName: 'Marie',   lastName: 'Dupont',  role: 'Patron',    status: 'actif',   email: 'marie.dupont@foodstack.fr',   joinedLabel: 'il y a 3 mois',  posPin: '1234' },
  { id: 'e2', firstName: 'Pierre',  lastName: 'Martin',  role: 'Manager',   status: 'actif',   email: 'pierre.martin@foodstack.fr',  joinedLabel: 'il y a 6 mois',  managerPermissions: { ...DEFAULT_MANAGER_PERMISSIONS } },
  { id: 'e3', firstName: 'Sophie',  lastName: 'Bernard', role: 'Commis',    status: 'actif',   email: 'sophie.bernard@foodstack.fr', joinedLabel: 'il y a 1 mois',  posPin: '5678' },
  { id: 'e4', firstName: 'Julien',  lastName: 'Moreau',  role: 'Livreur',   status: 'inactif', email: 'julien.moreau@foodstack.fr',  joinedLabel: 'il y a 8 mois' },
  { id: 'e5', firstName: 'Claire',  lastName: 'Lambert', role: 'Manager',   status: 'actif',   email: 'claire.lambert@foodstack.fr', joinedLabel: 'il y a 2 ans',   managerPermissions: { canEditMenu: true, canManageStaff: false, canViewAnalytics: true, canAccessPOS: true } },
  { id: 'e6', firstName: 'Thomas',  lastName: 'Petit',   role: 'Commis',    status: 'actif',   email: 'thomas.petit@foodstack.fr',   joinedLabel: 'il y a 1 an' },
  { id: 'e7', firstName: 'Emma',    lastName: 'Richard', role: 'Stagiaire', status: 'actif',   email: 'emma.richard@foodstack.fr',   joinedLabel: 'il y a 4 mois' },
  { id: 'e8', firstName: 'Lucas',   lastName: 'Durand',  role: 'Livreur',   status: 'inactif', email: 'lucas.durand@foodstack.fr',   joinedLabel: 'il y a 2 mois' },
];

const ALL_ROLES: Role[] = ['Patron', 'Manager', 'Commis', 'Stagiaire', 'Livreur'];
const ROLE_FILTERS = ['Tous', ...ALL_ROLES] as const;
type RoleFilter = typeof ROLE_FILTERS[number];

// ── Permission cell ────────────────────────────────────────────────────────────

function PermCell({ level }: { level: PermissionLevel }) {
  if (level === 'full')    return <CheckCircle2 className="mx-auto h-4 w-4 text-green-500" />;
  if (level === 'partial') return <MinusCircle  className="mx-auto h-4 w-4 text-orange-500" />;
  return <XCircle className="mx-auto h-4 w-4 text-red-400 dark:text-red-600" />;
}

// ── Permission Matrix Table ────────────────────────────────────────────────────

function PermissionMatrixTable() {
  return (
    <Card padding="none" className="overflow-hidden">
      <CardHeader className="px-6 pt-5 pb-4">
        <CardTitle>Matrice des permissions</CardTitle>
        <div className="flex items-center gap-4 text-xs text-surface-500">
          <span className="flex items-center gap-1"><CheckCircle2 className="h-3.5 w-3.5 text-green-500" /> Complet</span>
          <span className="flex items-center gap-1"><MinusCircle  className="h-3.5 w-3.5 text-orange-500" /> Partiel</span>
          <span className="flex items-center gap-1"><XCircle      className="h-3.5 w-3.5 text-red-400" /> Aucun</span>
        </div>
      </CardHeader>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-t border-surface-100 dark:border-surface-700">
              <th className="px-4 py-2.5 text-left font-semibold text-surface-600 dark:text-surface-400 w-32">Rôle</th>
              {FEATURES.map((f) => (
                <th key={f} className="px-2 py-2.5 text-center font-semibold text-surface-600 dark:text-surface-400 min-w-[80px]">{f}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ALL_ROLES.map((role, i) => {
              const cfg = ROLE_CONFIG[role];
              const Icon = cfg.icon;
              return (
                <tr
                  key={role}
                  className={clsx(
                    'border-t border-surface-100 dark:border-surface-700',
                    i % 2 === 0 ? 'bg-surface-50/50 dark:bg-surface-900/30' : ''
                  )}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className={clsx('flex h-6 w-6 items-center justify-center rounded-lg', cfg.color)}>
                        <Icon className="h-3.5 w-3.5" />
                      </div>
                      <span className="font-medium text-surface-700 dark:text-surface-300">{cfg.label}</span>
                    </div>
                  </td>
                  {FEATURES.map((f) => (
                    <td key={f} className="px-2 py-3 text-center">
                      <PermCell level={PERMISSION_MATRIX[role][f]} />
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

// ── Manager bridged-view callout ───────────────────────────────────────────────

function ManagerBridgedCallout() {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3.5 dark:border-blue-800/50 dark:bg-blue-900/20">
      <Info className="mt-0.5 h-4 w-4 shrink-0 text-blue-500" />
      <p className="text-sm text-blue-700 dark:text-blue-300">
        <span className="font-semibold">Les Managers bénéficient d'une vue bridgée</span>{' '}
        — accès complet aux données du restaurant mais sans accès aux fonctions super-admin ou facturation.
      </p>
    </div>
  );
}

// ── Avatar ─────────────────────────────────────────────────────────────────────

function EmployeeAvatar({ employee }: { employee: Employee }) {
  const initials = `${employee.firstName[0]}${employee.lastName[0]}`;
  const cfg = ROLE_CONFIG[employee.role];
  return (
    <div className={clsx('flex h-10 w-10 items-center justify-center rounded-xl text-sm font-bold', cfg.color)}>
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
  const [pin, setPin]         = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError]     = useState('');
  const hasPin = !!employee.posPin;

  function handleSave() {
    if (pin.length !== 4 || !/^\d{4}$/.test(pin)) { setError('Le code doit contenir exactement 4 chiffres.'); return; }
    if (pin !== confirm) { setError('Les codes ne correspondent pas.'); return; }
    onSave(employee.id, pin);
    setPin(''); setConfirm(''); setError('');
    onClose();
  }

  function handleClose() {
    setPin(''); setConfirm(''); setError('');
    onClose();
  }

  return (
    <Modal open={open} onClose={handleClose} title="Gérer le code POS" description={`${employee.firstName} ${employee.lastName}`}>
      <div className="space-y-4">
        <div className="flex items-center justify-between rounded-xl bg-surface-50 dark:bg-surface-800 px-4 py-3">
          <span className="text-sm text-surface-500">Statut actuel</span>
          <PosPinChip posPin={employee.posPin} />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-surface-700 dark:text-surface-300">
            {hasPin ? 'Nouveau code POS (4 chiffres)' : 'Code POS (4 chiffres)'}
          </label>
          <Input type="password" placeholder="••••" maxLength={4} value={pin}
            onChange={(e) => { setPin(e.target.value.replace(/\D/g, '').slice(0, 4)); setError(''); }}
            leftIcon={<KeyRound className="h-4 w-4" />}
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-surface-700 dark:text-surface-300">Confirmer le code</label>
          <Input type="password" placeholder="••••" maxLength={4} value={confirm}
            onChange={(e) => { setConfirm(e.target.value.replace(/\D/g, '').slice(0, 4)); setError(''); }}
            leftIcon={<KeyRound className="h-4 w-4" />}
          />
        </div>
        {error && <p className="text-sm text-red-500">{error}</p>}
        <Button variant="primary" fullWidth icon={<Lock className="h-4 w-4" />}
          disabled={pin.length !== 4 || confirm.length !== 4} onClick={handleSave}>
          {hasPin ? 'Modifier le code POS' : 'Définir le code POS'}
        </Button>
      </div>
    </Modal>
  );
}

// ── Advanced permissions toggle section ───────────────────────────────────────

interface PermToggleRowProps {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}

function PermToggleRow({ label, checked, onChange }: PermToggleRowProps) {
  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-sm text-surface-700 dark:text-surface-300">{label}</span>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={clsx(
          'relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none',
          checked ? 'bg-brand-500' : 'bg-surface-300 dark:bg-surface-600'
        )}
        aria-checked={checked}
        role="switch"
      >
        <span
          className={clsx(
            'pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200',
            checked ? 'translate-x-4' : 'translate-x-0'
          )}
        />
      </button>
    </div>
  );
}

interface AdvancedPermissionsSectionProps {
  permissions: ManagerPermissions;
  onChange: (p: ManagerPermissions) => void;
}

function AdvancedPermissionsSection({ permissions, onChange }: AdvancedPermissionsSectionProps) {
  function set<K extends keyof ManagerPermissions>(key: K, value: boolean) {
    onChange({ ...permissions, [key]: value });
  }
  return (
    <div className="rounded-xl border border-blue-200 bg-blue-50/60 px-4 py-3 dark:border-blue-800/40 dark:bg-blue-900/10">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-blue-700 dark:text-blue-400">Permissions avancées (Manager)</p>
      <div className="divide-y divide-blue-100 dark:divide-blue-800/30">
        <PermToggleRow label="Peut modifier le menu"        checked={permissions.canEditMenu}       onChange={(v) => set('canEditMenu', v)} />
        <PermToggleRow label="Peut gérer les employés"      checked={permissions.canManageStaff}    onChange={(v) => set('canManageStaff', v)} />
        <PermToggleRow label="Peut voir les analytiques"    checked={permissions.canViewAnalytics}  onChange={(v) => set('canViewAnalytics', v)} />
        <PermToggleRow label="Peut accéder au POS"          checked={permissions.canAccessPOS}      onChange={(v) => set('canAccessPOS', v)} />
      </div>
    </div>
  );
}

// ── Edit permissions modal ─────────────────────────────────────────────────────

interface EditPermissionsModalProps {
  employee: Employee;
  open: boolean;
  onClose: () => void;
  onSave: (id: string, permissions: ManagerPermissions) => void;
}

function EditPermissionsModal({ employee, open, onClose, onSave }: EditPermissionsModalProps) {
  const [perms, setPerms] = useState<ManagerPermissions>(
    employee.managerPermissions ?? { ...DEFAULT_MANAGER_PERMISSIONS }
  );

  function handleSave() {
    onSave(employee.id, perms);
    toast.success('Permissions mises à jour');
    onClose();
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Modifier les permissions"
      description={`${employee.firstName} ${employee.lastName} — ${ROLE_CONFIG[employee.role].label}`}
    >
      <div className="space-y-4">
        {employee.role === 'Manager' ? (
          <AdvancedPermissionsSection permissions={perms} onChange={setPerms} />
        ) : (
          <div className="rounded-xl bg-surface-50 dark:bg-surface-800 px-4 py-6 text-center text-sm text-surface-500">
            Les permissions avancées sont disponibles pour le rôle <strong>Manager</strong> uniquement.
          </div>
        )}
        <Button variant="primary" fullWidth onClick={handleSave}>
          Enregistrer
        </Button>
      </div>
    </Modal>
  );
}

// ── Permission preview for role ────────────────────────────────────────────────

function RolePermissionPreview({ role }: { role: Role }) {
  const cfg = ROLE_CONFIG[role];
  return (
    <div className="rounded-xl border border-surface-200 bg-surface-50 dark:border-surface-700 dark:bg-surface-800/60 px-4 py-3">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-surface-500">Permissions clés</p>
      <ul className="space-y-1">
        {cfg.keyPerms.map((perm) => (
          <li key={perm} className="flex items-center gap-2 text-xs">
            <CheckCircle2 className="h-3.5 w-3.5 text-green-500 shrink-0" />
            <span className="text-surface-700 dark:text-surface-300">{perm}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ── Invite modal ───────────────────────────────────────────────────────────────

interface InviteModalProps {
  open: boolean;
  onClose: () => void;
}

const SELECT_CLASS = 'h-10 w-full appearance-none rounded-xl border border-surface-200 bg-white px-3 text-sm text-surface-700 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-surface-700 dark:bg-surface-800 dark:text-surface-100';

function InviteModal({ open, onClose }: InviteModalProps) {
  const [email, setEmail]   = useState('');
  const [role, setRole]     = useState<Role>('Commis');
  const [note, setNote]     = useState('');
  const [sent, setSent]     = useState(false);

  function handleSend() {
    if (!email) return;
    setSent(true);
    toast.success(`Invitation envoyée à ${email}`);
    setTimeout(() => {
      setSent(false);
      setEmail('');
      setRole('Commis');
      setNote('');
      onClose();
    }, 1500);
  }

  const cfg = ROLE_CONFIG[role];
  const Icon = cfg.icon;

  return (
    <Modal open={open} onClose={onClose} title="Inviter un employé" description="Un email d'invitation sera envoyé à l'adresse indiquée.">
      <div className="space-y-4">
        {/* Email */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-surface-700 dark:text-surface-300">Adresse email</label>
          <Input type="email" placeholder="prenom.nom@example.com" value={email}
            onChange={(e) => setEmail(e.target.value)}
            leftIcon={<Mail className="h-4 w-4" />}
          />
        </div>

        {/* Role selector */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-surface-700 dark:text-surface-300">Rôle</label>
          <div className="flex flex-wrap gap-2">
            {ALL_ROLES.map((r) => {
              const rcfg = ROLE_CONFIG[r];
              const RIcon = rcfg.icon;
              const isSelected = role === r;
              return (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRole(r)}
                  className={clsx(
                    'flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-medium transition-all',
                    isSelected
                      ? clsx('border-transparent', rcfg.badgeClass)
                      : 'border-surface-200 bg-white text-surface-600 hover:border-surface-300 dark:border-surface-700 dark:bg-surface-800 dark:text-surface-300'
                  )}
                >
                  <span className={clsx('h-2 w-2 rounded-full shrink-0', rcfg.color.split(' ')[0].replace('/20', '').replace('bg-', 'bg-'))} />
                  <RIcon className="h-3 w-3" />
                  {rcfg.label}
                </button>
              );
            })}
          </div>
          {/* Role description */}
          <div className="mt-2 flex items-center gap-2">
            <div className={clsx('flex h-6 w-6 items-center justify-center rounded-lg shrink-0', cfg.color)}>
              <Icon className="h-3.5 w-3.5" />
            </div>
            <p className="text-xs text-surface-500">{cfg.description}</p>
          </div>
        </div>

        {/* Mini permission summary (3 key permissions) */}
        <RolePermissionPreview role={role} />

        {/* Note */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-surface-700 dark:text-surface-300">
            Message <span className="font-normal text-surface-400">— optionnel</span>
          </label>
          <textarea
            rows={2}
            placeholder="Ajouter une note personnalisée à l'invitation…"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full resize-none rounded-xl border border-surface-200 bg-white px-3 py-2 text-sm text-surface-700 placeholder:text-surface-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-surface-700 dark:bg-surface-800 dark:text-surface-100"
          />
        </div>

        <Button variant="primary" fullWidth icon={<Mail className="h-4 w-4" />}
          disabled={!email || sent} onClick={handleSend}>
          {sent ? 'Invitation envoyée !' : "Envoyer l'invitation"}
        </Button>
      </div>
    </Modal>
  );
}

// ── Convocation modal ──────────────────────────────────────────────────────────

interface ConvocationModalProps {
  open: boolean;
  onClose: () => void;
  preSelected?: string[];
}

function ConvocationModal({ open, onClose, preSelected = [] }: ConvocationModalProps) {
  const [subject,  setSubject]  = useState('');
  const [selected, setSelected] = useState<string[]>(preSelected);
  const [date,     setDate]     = useState('');
  const [time,     setTime]     = useState('');
  const [location, setLocation] = useState('Sur place');
  const [note,     setNote]     = useState('');

  const [prevPre, setPrevPre] = useState(preSelected);
  if (preSelected !== prevPre) {
    setPrevPre(preSelected);
    setSelected(preSelected);
  }

  function toggleEmployee(id: string) {
    setSelected((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  }

  function handleSubmit() {
    if (!subject || !date || !time || selected.length === 0) return;
    toast.success(`Convocation envoyée à ${selected.length} employé(s)`);
    setSubject(''); setSelected([]); setDate(''); setTime(''); setLocation('Sur place'); setNote('');
    onClose();
  }

  function handleClose() {
    setSubject(''); setSelected(preSelected); setDate(''); setTime(''); setLocation('Sur place'); setNote('');
    onClose();
  }

  return (
    <Modal open={open} onClose={handleClose} title="Planifier une réunion" description="Sélectionnez les participants et définissez les détails.">
      <div className="space-y-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-surface-700 dark:text-surface-300">Objet de la réunion</label>
          <Input placeholder="Ex : Réunion hebdomadaire" value={subject} onChange={(e) => setSubject(e.target.value)} />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-surface-700 dark:text-surface-300">Participants</label>
          <div className="max-h-40 overflow-y-auto rounded-xl border border-surface-200 dark:border-surface-700 divide-y divide-surface-100 dark:divide-surface-700">
            {INITIAL_EMPLOYEES.map((emp) => (
              <label key={emp.id} className="flex cursor-pointer items-center gap-3 px-3 py-2 hover:bg-surface-50 dark:hover:bg-surface-800">
                <input type="checkbox" checked={selected.includes(emp.id)} onChange={() => toggleEmployee(emp.id)}
                  className="h-4 w-4 rounded accent-brand-500" />
                <span className="text-sm text-surface-700 dark:text-surface-300">{emp.firstName} {emp.lastName}</span>
                <span className="ml-auto text-xs text-surface-400">{ROLE_CONFIG[emp.role].label}</span>
              </label>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-surface-700 dark:text-surface-300">Date</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={SELECT_CLASS} />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-surface-700 dark:text-surface-300">Heure</label>
            <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className={SELECT_CLASS} />
          </div>
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-surface-700 dark:text-surface-300">Lieu</label>
          <select value={location} onChange={(e) => setLocation(e.target.value)} className={SELECT_CLASS}>
            <option>Sur place</option>
            <option>Visioconférence</option>
            <option>En ligne (lien)</option>
          </select>
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-surface-700 dark:text-surface-300">
            Note <span className="font-normal text-surface-400">— optionnel</span>
          </label>
          <textarea rows={3} placeholder="Informations complémentaires…" value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full resize-none rounded-xl border border-surface-200 bg-white px-3 py-2 text-sm text-surface-700 placeholder:text-surface-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-surface-700 dark:bg-surface-800 dark:text-surface-100"
          />
        </div>
        <Button variant="primary" fullWidth icon={<CalendarCheck className="h-4 w-4" />}
          disabled={!subject || !date || !time || selected.length === 0} onClick={handleSubmit}>
          Envoyer la convocation
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
  onEditPermissions: (employee: Employee) => void;
}

function EmployeeCard({ employee, onToggleStatus, onRemove, onManagePin, onConvoke, onEditPermissions }: EmployeeCardProps) {
  const cfg     = ROLE_CONFIG[employee.role];
  const isActive = employee.status === 'actif';

  return (
    <motion.div layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96 }} transition={{ duration: 0.2 }}>
      <Card padding="md" className="group transition-shadow hover:shadow-md">
        <div className="flex items-start gap-4">
          <EmployeeAvatar employee={employee} />

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-surface-900 dark:text-surface-50">
                {employee.firstName} {employee.lastName}
              </span>
              <span className={clsx('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium', cfg.badgeClass)}>{cfg.label}</span>
              <Badge variant={isActive ? 'success' : 'default'} dot>{employee.status}</Badge>
              <PosPinChip posPin={employee.posPin} />
            </div>
            <p className="mt-0.5 flex items-center gap-1 text-xs text-surface-400">
              <Mail className="h-3 w-3" />{employee.email}
            </p>
            <p className="mt-0.5 text-xs text-surface-400">Rejoint {employee.joinedLabel}</p>
            {/* Manager advanced perms summary */}
            {employee.role === 'Manager' && employee.managerPermissions && (
              <div className="mt-1.5 flex flex-wrap gap-1">
                {employee.managerPermissions.canEditMenu       && <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">Menu</span>}
                {employee.managerPermissions.canManageStaff    && <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">Staff</span>}
                {employee.managerPermissions.canViewAnalytics  && <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">Analytiques</span>}
                {employee.managerPermissions.canAccessPOS      && <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">POS</span>}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex shrink-0 items-center gap-2 flex-wrap justify-end">
            <button
              onClick={() => onToggleStatus(employee.id)}
              title={isActive ? 'Désactiver' : 'Activer'}
              className={clsx(
                'rounded-lg p-1.5 transition-colors',
                isActive ? 'text-brand-500 hover:bg-brand-500/10' : 'text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-700'
              )}
            >
              {isActive ? <ToggleRight className="h-5 w-5" /> : <ToggleLeft className="h-5 w-5" />}
            </button>

            <Button variant="ghost" size="sm" icon={<CalendarCheck className="h-3.5 w-3.5" />} onClick={() => onConvoke(employee)}>
              Convoquer
            </Button>

            <Button variant="ghost" size="sm" icon={<KeyRound className="h-3.5 w-3.5" />} onClick={() => onManagePin(employee)}>
              Code POS
            </Button>

            <Button variant="ghost" size="sm" icon={<Pencil className="h-3.5 w-3.5" />} onClick={() => onEditPermissions(employee)}>
              Permissions
            </Button>

            <Button variant="ghost" size="sm" icon={<Trash2 className="h-3.5 w-3.5" />}
              className="text-red-500 hover:border-red-200 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20"
              onClick={() => onRemove(employee.id)}>
              Retirer
            </Button>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

interface ApiStaff {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  isActive: boolean;
  joinedAt: string;
}

const ROLE_MAP: Record<string, Role> = {
  restaurant_owner: 'Patron',
  staff: 'Commis',
  driver: 'Livreur',
};

function apiToEmployee(s: ApiStaff, i: number): Employee {
  const parts = s.name.split(' ');
  const role: Role = ROLE_MAP[s.role] ?? 'Commis';
  const joinedLabel = new Intl.RelativeTimeFormat('fr', { numeric: 'auto' }).format(
    -Math.round((Date.now() - new Date(s.joinedAt).getTime()) / (1000 * 60 * 60 * 24 * 30)),
    'month'
  );
  return {
    id: s.id,
    firstName: parts[0] ?? '',
    lastName: parts.slice(1).join(' ') || `#${i + 1}`,
    role,
    status: s.isActive ? 'actif' : 'inactif',
    email: s.email,
    joinedLabel,
  };
}

export default function StaffPage() {
  const [employees,           setEmployees]           = useState<Employee[]>([]);
  const [search,              setSearch]              = useState('');
  const [roleFilter,          setRoleFilter]          = useState<RoleFilter>('Tous');

  useEffect(() => {
    (api.get('/users/staff') as Promise<ApiStaff[]>)
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setEmployees(data.map(apiToEmployee));
        }
      })
      .catch(() => {});
  }, []);
  const [showInviteModal,     setShowInviteModal]     = useState(false);
  const [showMatrixPanel,     setShowMatrixPanel]     = useState(false);
  const [pinEmployee,         setPinEmployee]         = useState<Employee | null>(null);
  const [editPermEmployee,    setEditPermEmployee]    = useState<Employee | null>(null);
  const [showConvocationModal,setShowConvocationModal]= useState(false);
  const [convokeEmployee,     setConvokeEmployee]     = useState<Employee | null>(null);

  function openConvoke(employee?: Employee) {
    setConvokeEmployee(employee ?? null);
    setShowConvocationModal(true);
  }

  const totalCount    = employees.length;
  const activeCount   = employees.filter((e) => e.status === 'actif').length;
  const inactiveCount = totalCount - activeCount;

  function toggleStatus(id: string) {
    setEmployees((prev) => prev.map((e) => {
      if (e.id !== id) return e;
      const newActive = e.status !== 'actif';
      (api.patch(`/users/${id}`, { isActive: newActive }) as Promise<any>).catch(() => {});
      return { ...e, status: newActive ? 'actif' : 'inactif' };
    }));
  }

  function removeEmployee(id: string) {
    setEmployees((prev) => prev.filter((e) => e.id !== id));
    (api.delete(`/users/${id}`) as Promise<any>).catch(() => {});
  }

  function savePin(employeeId: string, pin: string) {
    setEmployees((prev) => prev.map((e) => e.id === employeeId ? { ...e, posPin: pin } : e));
    toast.success('Code POS mis à jour');
  }

  function saveManagerPermissions(id: string, permissions: ManagerPermissions) {
    setEmployees((prev) => prev.map((e) => e.id === id ? { ...e, managerPermissions: permissions } : e));
  }

  const filtered = employees.filter((e) => {
    const matchSearch =
      !search ||
      `${e.firstName} ${e.lastName}`.toLowerCase().includes(search.toLowerCase()) ||
      e.email.toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === 'Tous' || e.role === roleFilter;
    return matchSearch && matchRole;
  });

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-50">Gestion des employés</h1>
          <p className="mt-1 text-sm text-surface-500">Gérez votre équipe et leurs accès</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="ghost" icon={<Shield className="h-4 w-4" />} onClick={() => setShowMatrixPanel((v) => !v)}>
            {showMatrixPanel ? 'Masquer les permissions' : 'Afficher les permissions'}
          </Button>
          <Button variant="ghost" icon={<CalendarCheck className="h-4 w-4" />} onClick={() => openConvoke()}>
            Planifier une réunion
          </Button>
          <Button variant="primary" icon={<UserPlus className="h-4 w-4" />} onClick={() => setShowInviteModal(true)}>
            Inviter un employé
          </Button>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total employés', value: totalCount,    icon: Users,       color: 'bg-brand-500/10 dark:bg-brand-500/20',  iconColor: 'text-brand-500'  },
          { label: 'Actifs',         value: activeCount,   icon: ToggleRight, color: 'bg-green-500/10 dark:bg-green-500/20',  iconColor: 'text-green-500'  },
          { label: 'Inactifs',       value: inactiveCount, icon: ToggleLeft,  color: 'bg-surface-200 dark:bg-surface-700',    iconColor: 'text-surface-500'},
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

      {/* Permission matrix panel (collapsible) */}
      <AnimatePresence>
        {showMatrixPanel && (
          <motion.div
            key="matrix"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="space-y-3">
              <ManagerBridgedCallout />
              <PermissionMatrixTable />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search + Role filter */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Input
          placeholder="Rechercher un employé…"
          leftIcon={<Search className="h-4 w-4" />}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="sm:max-w-xs"
        />
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
              {r === 'Tous' ? 'Tous' : ROLE_CONFIG[r as Role].label}
            </button>
          ))}
        </div>
      </div>

      {/* Employee list */}
      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {filtered.length === 0 ? (
            <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center gap-3 py-20 text-center">
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
                onEditPermissions={setEditPermEmployee}
              />
            ))
          )}
        </AnimatePresence>
      </div>

      {/* Modals */}
      <InviteModal open={showInviteModal} onClose={() => setShowInviteModal(false)} />

      <ConvocationModal
        open={showConvocationModal}
        onClose={() => { setShowConvocationModal(false); setConvokeEmployee(null); }}
        preSelected={convokeEmployee ? [convokeEmployee.id] : []}
      />

      {pinEmployee && (
        <ManagePinModal
          employee={pinEmployee}
          open={!!pinEmployee}
          onClose={() => setPinEmployee(null)}
          onSave={savePin}
        />
      )}

      {editPermEmployee && (
        <EditPermissionsModal
          employee={editPermEmployee}
          open={!!editPermEmployee}
          onClose={() => setEditPermEmployee(null)}
          onSave={saveManagerPermissions}
        />
      )}
    </div>
  );
}
