'use client';

import { useState } from 'react';
import {
  Users,
  Plus,
  Search,
  Pencil,
  Trash2,
  Mail,
  Shield,
  ChevronDown,
  Check,
  Clock,
  MoreVertical,
  UserPlus,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Avatar } from '@/components/ui/Avatar';
import toast from 'react-hot-toast';

type StaffRole = 'owner' | 'manager' | 'cashier' | 'kitchen' | 'delivery';

interface StaffMember {
  id: string;
  name: string;
  email: string;
  role: StaffRole;
  status: 'active' | 'invited' | 'inactive';
  joinedAt: string;
  lastSeen?: string;
}

const ROLE_CONFIG: Record<StaffRole, { label: string; color: string; bg: string; permissions: string[] }> = {
  owner:    { label: 'Propriétaire', color: 'text-purple-700', bg: 'bg-purple-100', permissions: ['Accès complet', 'Gestion équipe', 'Paramètres', 'Finances'] },
  manager:  { label: 'Manager',      color: 'text-blue-700',   bg: 'bg-blue-100',   permissions: ['Commandes', 'Menu', 'Inventaire', 'Rapports'] },
  cashier:  { label: 'Caissier',     color: 'text-brand-700',  bg: 'bg-brand-100',  permissions: ['Caisse POS', 'Commandes sur place', 'Remboursements'] },
  kitchen:  { label: 'Cuisine',      color: 'text-green-700',  bg: 'bg-green-100',  permissions: ['Suivi commandes cuisine', 'Mise à jour statuts'] },
  delivery: { label: 'Livreur',      color: 'text-amber-700',  bg: 'bg-amber-100',  permissions: ['Commandes à livrer', 'GPS', 'Confirmation livraison'] },
};

const INITIAL_STAFF: StaffMember[] = [
  { id: 's1', name: 'Jean Dupont',    email: 'jean@foodstack.fr',    role: 'owner',    status: 'active',  joinedAt: '1 jan. 2025',  lastSeen: 'Maintenant' },
  { id: 's2', name: 'Sophie Martin',  email: 'sophie@foodstack.fr',  role: 'manager',  status: 'active',  joinedAt: '15 mars 2025', lastSeen: 'Il y a 2h' },
  { id: 's3', name: 'Karim Amara',    email: 'karim@foodstack.fr',   role: 'delivery', status: 'active',  joinedAt: '2 avril 2025', lastSeen: 'Il y a 30 min' },
  { id: 's4', name: 'Alice Bonnet',   email: 'alice@foodstack.fr',   role: 'cashier',  status: 'active',  joinedAt: '10 avril 2025', lastSeen: 'Hier' },
  { id: 's5', name: 'Tom Bernard',    email: 'tom@foodstack.fr',     role: 'kitchen',  status: 'invited', joinedAt: '12 mai 2025' },
  { id: 's6', name: 'Lucie Petit',    email: 'lucie@foodstack.fr',   role: 'cashier',  status: 'inactive', joinedAt: '5 fév. 2025', lastSeen: 'Il y a 3 sem.' },
];

const STATUS_BADGE: Record<StaffMember['status'], { label: string; variant: 'success' | 'warning' | 'default' }> = {
  active:   { label: 'Actif',    variant: 'success' },
  invited:  { label: 'Invité',   variant: 'warning' },
  inactive: { label: 'Inactif',  variant: 'default' },
};

export default function StaffPage() {
  const [staff, setStaff] = useState<StaffMember[]>(INITIAL_STAFF);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<StaffRole | 'all'>('all');
  const [inviteModal, setInviteModal] = useState(false);
  const [editModal, setEditModal] = useState<{ open: boolean; member?: StaffMember }>({ open: false });
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; member?: StaffMember }>({ open: false });
  const [menuOpen, setMenuOpen] = useState<string | null>(null);

  const [inviteForm, setInviteForm] = useState({ email: '', role: 'cashier' as StaffRole });
  const [editForm, setEditForm] = useState<{ role: StaffRole }>({ role: 'cashier' });

  const filtered = staff.filter((m) => {
    const matchSearch = !search || m.name.toLowerCase().includes(search.toLowerCase()) || m.email.toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === 'all' || m.role === roleFilter;
    return matchSearch && matchRole;
  });

  const sendInvite = () => {
    if (!inviteForm.email.trim()) return;
    const name = inviteForm.email.split('@')[0];
    setStaff((s) => [...s, {
      id: `s-${Date.now()}`,
      name: name.charAt(0).toUpperCase() + name.slice(1),
      email: inviteForm.email,
      role: inviteForm.role,
      status: 'invited',
      joinedAt: new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }),
    }]);
    toast.success(`Invitation envoyée à ${inviteForm.email}`);
    setInviteModal(false);
    setInviteForm({ email: '', role: 'cashier' });
  };

  const saveEdit = () => {
    if (!editModal.member) return;
    setStaff((s) => s.map((m) => m.id === editModal.member!.id ? { ...m, role: editForm.role } : m));
    toast.success('Rôle mis à jour');
    setEditModal({ open: false });
  };

  const confirmDelete = () => {
    if (!deleteModal.member) return;
    setStaff((s) => s.filter((m) => m.id !== deleteModal.member!.id));
    toast.success('Membre retiré');
    setDeleteModal({ open: false });
  };

  const resendInvite = (member: StaffMember) => {
    toast.success(`Invitation renvoyée à ${member.email}`);
    setMenuOpen(null);
  };

  const toggleActive = (member: StaffMember) => {
    setStaff((s) => s.map((m) => m.id === member.id
      ? { ...m, status: m.status === 'active' ? 'inactive' : 'active' }
      : m));
    setMenuOpen(null);
  };

  const activeCount = staff.filter((m) => m.status === 'active').length;
  const invitedCount = staff.filter((m) => m.status === 'invited').length;

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-900">Équipe</h1>
          <p className="mt-1 text-sm text-surface-500">
            {activeCount} actifs · {invitedCount} invitation{invitedCount !== 1 ? 's' : ''} en attente
          </p>
        </div>
        <Button icon={<UserPlus className="h-4 w-4" />} onClick={() => setInviteModal(true)}>
          Inviter
        </Button>
      </div>

      {/* Stats */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-5">
        {(['all', ...Object.keys(ROLE_CONFIG)] as Array<'all' | StaffRole>).map((role) => {
          const count = role === 'all' ? staff.length : staff.filter((m) => m.role === role).length;
          const cfg = role !== 'all' ? ROLE_CONFIG[role] : null;
          return (
            <button
              key={role}
              onClick={() => setRoleFilter(role)}
              className={`rounded-xl border p-3 text-left transition-colors ${
                roleFilter === role
                  ? 'border-brand-300 bg-brand-50'
                  : 'border-surface-200 bg-white hover:border-surface-300'
              }`}
            >
              <p className="text-lg font-bold text-surface-900">{count}</p>
              <p className="text-xs text-surface-500">{role === 'all' ? 'Tous' : cfg!.label}</p>
            </button>
          );
        })}
      </div>

      {/* Search */}
      <div className="mb-4 max-w-sm">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-surface-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher un membre..."
            className="h-10 w-full rounded-xl border border-surface-200 bg-white pl-9 pr-4 text-sm focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-surface-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-surface-100 bg-surface-50">
                {['Membre', 'Rôle', 'Statut', 'Rejoint le', 'Dernière activité', ''].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-surface-400">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-50">
              {filtered.map((member, i) => {
                const roleCfg = ROLE_CONFIG[member.role];
                const statusCfg = STATUS_BADGE[member.status];
                return (
                  <motion.tr
                    key={member.id}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="hover:bg-surface-50"
                  >
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <Avatar name={member.name} size="sm" />
                        <div>
                          <p className="text-sm font-semibold text-surface-900">{member.name}</p>
                          <p className="text-xs text-surface-400">{member.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`rounded-lg px-2.5 py-1 text-xs font-semibold ${roleCfg.bg} ${roleCfg.color}`}>
                        {roleCfg.label}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <Badge variant={statusCfg.variant} dot size="sm">{statusCfg.label}</Badge>
                    </td>
                    <td className="px-4 py-3.5 text-sm text-surface-500">{member.joinedAt}</td>
                    <td className="px-4 py-3.5">
                      {member.lastSeen ? (
                        <span className="flex items-center gap-1.5 text-sm text-surface-500">
                          <Clock className="h-3.5 w-3.5" />
                          {member.lastSeen}
                        </span>
                      ) : (
                        <span className="text-sm text-surface-300">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="relative flex items-center gap-1">
                        {member.role !== 'owner' && (
                          <>
                            <button
                              onClick={() => { setEditForm({ role: member.role }); setEditModal({ open: true, member }); }}
                              className="flex h-8 w-8 items-center justify-center rounded-lg text-surface-400 hover:bg-surface-100 hover:text-surface-700"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => setMenuOpen(menuOpen === member.id ? null : member.id)}
                              className="flex h-8 w-8 items-center justify-center rounded-lg text-surface-400 hover:bg-surface-100 hover:text-surface-700"
                            >
                              <MoreVertical className="h-4 w-4" />
                            </button>

                            <AnimatePresence>
                              {menuOpen === member.id && (
                                <motion.div
                                  initial={{ opacity: 0, scale: 0.95, y: 4 }}
                                  animate={{ opacity: 1, scale: 1, y: 0 }}
                                  exit={{ opacity: 0, scale: 0.95 }}
                                  className="absolute right-0 top-9 z-10 w-48 overflow-hidden rounded-xl border border-surface-200 bg-white shadow-glass-lg"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  {member.status === 'invited' && (
                                    <button onClick={() => resendInvite(member)}
                                      className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-surface-700 hover:bg-surface-50">
                                      <Mail className="h-4 w-4" /> Renvoyer l&apos;invitation
                                    </button>
                                  )}
                                  <button onClick={() => toggleActive(member)}
                                    className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-surface-700 hover:bg-surface-50">
                                    <Shield className="h-4 w-4" />
                                    {member.status === 'active' ? 'Désactiver' : 'Réactiver'}
                                  </button>
                                  <button onClick={() => { setMenuOpen(null); setDeleteModal({ open: true, member }); }}
                                    className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50">
                                    <Trash2 className="h-4 w-4" /> Retirer de l&apos;équipe
                                  </button>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invite modal */}
      <Modal
        open={inviteModal}
        onClose={() => setInviteModal(false)}
        title="Inviter un membre"
        description="Un email d'invitation sera envoyé à l'adresse indiquée"
        size="sm"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setInviteModal(false)}>Annuler</Button>
            <Button onClick={sendInvite} disabled={!inviteForm.email.trim()} icon={<Mail className="h-4 w-4" />}>
              Envoyer l&apos;invitation
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-surface-700">Adresse email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-surface-400" />
              <input
                type="email"
                value={inviteForm.email}
                onChange={(e) => setInviteForm((p) => ({ ...p, email: e.target.value }))}
                placeholder="nom@exemple.fr"
                className="h-11 w-full rounded-xl border border-surface-200 pl-10 pr-4 text-sm focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
              />
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-surface-700">Rôle</label>
            <div className="relative">
              <select
                value={inviteForm.role}
                onChange={(e) => setInviteForm((p) => ({ ...p, role: e.target.value as StaffRole }))}
                className="h-11 w-full appearance-none rounded-xl border border-surface-200 bg-white px-4 pr-9 text-sm focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
              >
                {(Object.keys(ROLE_CONFIG) as StaffRole[]).filter((r) => r !== 'owner').map((r) => (
                  <option key={r} value={r}>{ROLE_CONFIG[r].label}</option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-surface-400" />
            </div>
            {inviteForm.role && (
              <div className="mt-2 space-y-1">
                {ROLE_CONFIG[inviteForm.role].permissions.map((p) => (
                  <div key={p} className="flex items-center gap-1.5 text-xs text-surface-500">
                    <Check className="h-3 w-3 text-green-500" /> {p}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </Modal>

      {/* Edit role modal */}
      <Modal
        open={editModal.open}
        onClose={() => setEditModal({ open: false })}
        title="Modifier le rôle"
        size="sm"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setEditModal({ open: false })}>Annuler</Button>
            <Button onClick={saveEdit}>Enregistrer</Button>
          </div>
        }
      >
        {editModal.member && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 rounded-xl bg-surface-50 p-3">
              <Avatar name={editModal.member.name} size="sm" />
              <div>
                <p className="text-sm font-semibold text-surface-900">{editModal.member.name}</p>
                <p className="text-xs text-surface-400">{editModal.member.email}</p>
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-surface-700">Nouveau rôle</label>
              <div className="relative">
                <select
                  value={editForm.role}
                  onChange={(e) => setEditForm({ role: e.target.value as StaffRole })}
                  className="h-11 w-full appearance-none rounded-xl border border-surface-200 bg-white px-4 pr-9 text-sm focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
                >
                  {(Object.keys(ROLE_CONFIG) as StaffRole[]).filter((r) => r !== 'owner').map((r) => (
                    <option key={r} value={r}>{ROLE_CONFIG[r].label}</option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-surface-400" />
              </div>
              <div className="mt-2 space-y-1">
                {ROLE_CONFIG[editForm.role].permissions.map((p) => (
                  <div key={p} className="flex items-center gap-1.5 text-xs text-surface-500">
                    <Check className="h-3 w-3 text-green-500" /> {p}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete confirmation */}
      <Modal
        open={deleteModal.open}
        onClose={() => setDeleteModal({ open: false })}
        title="Retirer de l&apos;équipe"
        size="sm"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setDeleteModal({ open: false })}>Annuler</Button>
            <Button variant="danger" onClick={confirmDelete}>Retirer</Button>
          </div>
        }
      >
        {deleteModal.member && (
          <p className="text-sm text-surface-600">
            Voulez-vous retirer{' '}
            <span className="font-semibold text-surface-900">{deleteModal.member.name}</span>{' '}
            de votre équipe ? Il n&apos;aura plus accès au dashboard.
          </p>
        )}
      </Modal>

      {/* Click outside to close menu */}
      {menuOpen && (
        <div className="fixed inset-0 z-0" onClick={() => setMenuOpen(null)} />
      )}
    </div>
  );
}
