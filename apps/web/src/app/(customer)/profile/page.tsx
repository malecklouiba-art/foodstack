'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  User, Mail, Phone, MapPin, Camera, ChevronRight,
  Plus, Pencil, Trash2, ShieldCheck, Bell,
  Star, LogOut, Check, Lock, Gift, Award,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import type { LoyaltyTier } from '@foodstack/shared';

// ── types ──
interface Address {
  id: string;
  label: string;
  street: string;
  city: string;
  postalCode: string;
  isDefault: boolean;
}

type DietPref = 'gluten' | 'vegetarien' | 'vegan' | 'lactose' | 'halal' | 'epice';

const DIET_LABELS: Record<DietPref, string> = {
  gluten:     'Sans gluten',
  vegetarien: 'Végétarien',
  vegan:      'Vegan',
  lactose:    'Sans lactose',
  halal:      'Halal',
  epice:      'Épicé',
};

// Next reward config
const NEXT_REWARD = { points: 1000, label: 'Burger offert' } as const;

// ── mock data ──
const MOCK_USER = {
  name: 'Marie Laurent',
  email: 'marie.laurent@email.fr',
  phone: '06 12 34 56 78',
  avatar: '',
  loyaltyPoints: 840,
  loyaltyTier: 'silver' as LoyaltyTier,
  orderCount: 23,
  memberSince: 'Janvier 2025',
};

const INIT_ADDRESSES: Address[] = [
  { id: 'a1', label: 'Maison', street: '12 rue de la Paix', city: 'Paris', postalCode: '75001', isDefault: true },
  { id: 'a2', label: 'Bureau', street: '45 avenue des Champs-Élysées', city: 'Paris', postalCode: '75008', isDefault: false },
];

const TIER_CONFIG: Record<LoyaltyTier, { label: string; color: string; bg: string; next?: string; nextPoints?: number }> = {
  bronze:   { label: 'Bronze',   color: 'text-amber-700',  bg: 'bg-amber-50',   next: 'Silver',   nextPoints: 500 },
  silver:   { label: 'Silver',   color: 'text-slate-600',  bg: 'bg-slate-50',   next: 'Gold',     nextPoints: 1000 },
  gold:     { label: 'Gold',     color: 'text-yellow-600', bg: 'bg-yellow-50',  next: 'Platinum', nextPoints: 2500 },
  platinum: { label: 'Platinum', color: 'text-purple-600', bg: 'bg-purple-50' },
};

const EMPTY_ADDR: Omit<Address, 'id'> = { label: '', street: '', city: '', postalCode: '', isDefault: false };

export default function ProfilePage() {
  const [user, setUser] = useState(MOCK_USER);
  const [addresses, setAddresses] = useState<Address[]>(INIT_ADDRESSES);
  const [saving, setSaving] = useState(false);
  const [editingInfo, setEditingInfo] = useState(false);
  const [infoForm, setInfoForm] = useState({ name: user.name, phone: user.phone });
  const [addrModal, setAddrModal] = useState(false);
  const [editingAddr, setEditingAddr] = useState<Address | null>(null);
  const [addrForm, setAddrForm] = useState<Omit<Address, 'id'>>(EMPTY_ADDR);
  const [notifs, setNotifs] = useState({ orders: true, promotions: true, news: false });

  const tier = TIER_CONFIG[user.loyaltyTier];
  const nextPoints = tier.nextPoints ?? 0;
  const progress = tier.nextPoints
    ? Math.min(100, Math.round((user.loyaltyPoints / nextPoints) * 100))
    : 100;

  async function saveInfo() {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 600));
    setUser((u) => ({ ...u, ...infoForm }));
    setEditingInfo(false);
    setSaving(false);
    toast.success('Profil mis à jour');
  }

  function openAddrModal(addr?: Address) {
    setEditingAddr(addr ?? null);
    setAddrForm(addr ? { label: addr.label, street: addr.street, city: addr.city, postalCode: addr.postalCode, isDefault: addr.isDefault } : EMPTY_ADDR);
    setAddrModal(true);
  }

  function saveAddr() {
    if (!addrForm.label || !addrForm.street || !addrForm.city) return;
    if (editingAddr) {
      setAddresses((as) => as.map((a) => a.id === editingAddr.id ? { ...a, ...addrForm } : a));
    } else {
      const id = `a-${Date.now()}`;
      const newAddr = { id, ...addrForm };
      setAddresses((as) => addrForm.isDefault ? [...as.map((a) => ({ ...a, isDefault: false })), newAddr] : [...as, newAddr]);
    }
    setAddrModal(false);
    toast.success(editingAddr ? 'Adresse mise à jour' : 'Adresse ajoutée');
  }

  function deleteAddr(id: string) {
    setAddresses((as) => as.filter((a) => a.id !== id));
    toast.success('Adresse supprimée');
  }

  function setDefault(id: string) {
    setAddresses((as) => as.map((a) => ({ ...a, isDefault: a.id === id })));
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 py-5 sm:px-6">
        <div className="mx-auto max-w-2xl flex items-center gap-3">
          <Link href="/" className="text-gray-400 hover:text-gray-600 transition-colors">
            <User className="h-5 w-5" />
          </Link>
          <ChevronRight className="h-4 w-4 text-gray-300" />
          <h1 className="text-lg font-bold text-gray-900">Mon profil</h1>
        </div>
      </div>

      <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6 space-y-5">

        {/* ── Avatar + name card ────────────────────────────────────────── */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <div className="relative rounded-3xl bg-gradient-to-br from-brand-400 to-brand-600 p-6 text-white overflow-hidden">
            <div className="absolute -right-6 -top-6 h-32 w-32 rounded-full bg-white/10" />
            <div className="absolute -right-2 bottom-0 h-20 w-20 rounded-full bg-white/5" />
            <div className="relative flex items-center gap-4">
              <div className="relative">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20 text-2xl font-bold backdrop-blur-sm">
                  {user.name.charAt(0)}
                </div>
                <button className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-white shadow-lg">
                  <Camera className="h-3.5 w-3.5 text-brand-500" />
                </button>
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-xl font-bold">{user.name}</h2>
                <p className="text-sm text-brand-100">{user.email}</p>
                <p className="mt-1 text-xs text-brand-200">Membre depuis {user.memberSince}</p>
              </div>
              <div className={`rounded-xl px-3 py-1.5 text-center ${tier.bg}`}>
                <p className={`text-sm font-bold ${tier.color}`}>{tier.label}</p>
                <p className={`text-xs ${tier.color} opacity-75`}>{user.loyaltyPoints} pts</p>
              </div>
            </div>

            {/* Loyalty progress */}
            {tier.next && (
              <div className="relative mt-4">
                <div className="flex justify-between text-xs text-brand-100 mb-1">
                  <span>{user.loyaltyPoints} pts</span>
                  <span>{nextPoints} pts pour {tier.next}</span>
                </div>
                <div className="h-2 rounded-full bg-white/20">
                  <div
                    className="h-2 rounded-full bg-white transition-all duration-1000"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </motion.div>

        {/* ── Quick stats ───────────────────────────────────────────────── */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="grid grid-cols-3 gap-3">
          {[
            { icon: Star, label: 'Commandes', value: user.orderCount.toString(), color: 'text-brand-500' },
            { icon: ShieldCheck, label: 'Points fidélité', value: `${user.loyaltyPoints}`, color: 'text-yellow-500' },
            { icon: Bell, label: 'Notifications', value: Object.values(notifs).filter(Boolean).length.toString(), color: 'text-blue-500' },
          ].map((s) => (
            <div key={s.label} className="rounded-2xl bg-white border border-gray-100 px-4 py-3 text-center shadow-sm">
              <s.icon className={`h-5 w-5 mx-auto mb-1 ${s.color}`} />
              <p className="text-base font-bold text-gray-900">{s.value}</p>
              <p className="text-xs text-gray-400">{s.label}</p>
            </div>
          ))}
        </motion.div>

        {/* ── Personal info ─────────────────────────────────────────────── */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="rounded-2xl bg-white border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h3 className="font-semibold text-gray-900">Informations personnelles</h3>
            <Button size="sm" variant="ghost" icon={editingInfo ? undefined : <Pencil className="h-3.5 w-3.5" />}
              onClick={() => { setEditingInfo(!editingInfo); setInfoForm({ name: user.name, phone: user.phone }); }}>
              {editingInfo ? 'Annuler' : 'Modifier'}
            </Button>
          </div>
          <div className="divide-y divide-gray-100">
            {editingInfo ? (
              <div className="p-5 space-y-3">
                <Input label="Nom complet" value={infoForm.name}
                  onChange={(e) => setInfoForm((f) => ({ ...f, name: e.target.value }))}
                  leftIcon={<User className="h-4 w-4" />} />
                <Input label="Téléphone" value={infoForm.phone ?? ''}
                  onChange={(e) => setInfoForm((f) => ({ ...f, phone: e.target.value }))}
                  leftIcon={<Phone className="h-4 w-4" />} />
                <Input label="Email" value={user.email} disabled
                  leftIcon={<Mail className="h-4 w-4" />}
                  hint="L'email ne peut pas être modifié ici." />
                <Button variant="primary" loading={saving} onClick={saveInfo} icon={<Check className="h-4 w-4" />}>
                  Enregistrer
                </Button>
              </div>
            ) : (
              <>
                {[
                  { icon: User, label: 'Nom', value: user.name },
                  { icon: Mail, label: 'Email', value: user.email },
                  { icon: Phone, label: 'Téléphone', value: user.phone || '—' },
                ].map((row) => (
                  <div key={row.label} className="flex items-center gap-3 px-5 py-3.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gray-100 flex-shrink-0">
                      <row.icon className="h-4 w-4 text-gray-500" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">{row.label}</p>
                      <p className="text-sm font-medium text-gray-900">{row.value}</p>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        </motion.div>

        {/* ── Addresses ─────────────────────────────────────────────────── */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="rounded-2xl bg-white border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h3 className="font-semibold text-gray-900">Adresses enregistrées</h3>
            <Button size="sm" variant="ghost" icon={<Plus className="h-3.5 w-3.5" />} onClick={() => openAddrModal()}>
              Ajouter
            </Button>
          </div>
          <div className="divide-y divide-gray-100">
            {addresses.map((addr) => (
              <div key={addr.id} className="flex items-center gap-3 px-5 py-3.5">
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl bg-brand-50">
                  <MapPin className="h-4 w-4 text-brand-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-gray-900">{addr.label}</p>
                    {addr.isDefault && <Badge variant="brand" size="sm">Par défaut</Badge>}
                  </div>
                  <p className="text-xs text-gray-500 truncate">{addr.street}, {addr.postalCode} {addr.city}</p>
                </div>
                <div className="flex gap-1">
                  {!addr.isDefault && (
                    <button onClick={() => setDefault(addr.id)}
                      className="rounded-lg p-1.5 text-gray-400 hover:bg-brand-50 hover:text-brand-500 transition-colors text-xs">
                      <Check className="h-3.5 w-3.5" />
                    </button>
                  )}
                  <button onClick={() => openAddrModal(addr)}
                    className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors">
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={() => deleteAddr(addr.id)}
                    className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* ── Notifications ─────────────────────────────────────────────── */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
          className="rounded-2xl bg-white border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h3 className="font-semibold text-gray-900">Notifications</h3>
          </div>
          <div className="divide-y divide-gray-100">
            {([ ['orders', 'Suivi de commandes', 'Statut et mises à jour de vos commandes'],
                ['promotions', 'Promotions', 'Offres spéciales et réductions'],
                ['news', 'Nouveautés', 'Nouveaux articles et menus saisonniers'],
            ] as const).map(([key, label, desc]) => (
              <div key={key} className="flex items-center justify-between px-5 py-3.5">
                <div>
                  <p className="text-sm font-medium text-gray-900">{label}</p>
                  <p className="text-xs text-gray-400">{desc}</p>
                </div>
                <button
                  onClick={() => setNotifs((n) => ({ ...n, [key]: !n[key] }))}
                  className={`relative h-6 w-11 rounded-full transition-colors duration-200 ${notifs[key] ? 'bg-brand-500' : 'bg-gray-200'}`}
                >
                  <span className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow transition-transform duration-200 ${notifs[key] ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>
            ))}
          </div>
        </motion.div>

        {/* ── Security & Logout ─────────────────────────────────────────── */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="rounded-2xl bg-white border border-gray-100 shadow-sm overflow-hidden">
          <div className="divide-y divide-gray-100">
            <Link href="/auth/forgot-password" className="flex items-center gap-3 px-5 py-4 hover:bg-gray-50 transition-colors">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gray-100">
                <Lock className="h-4 w-4 text-gray-500" />
              </div>
              <span className="flex-1 text-sm font-medium text-gray-900">Changer le mot de passe</span>
              <ChevronRight className="h-4 w-4 text-gray-300" />
            </Link>
            <Link href="/orders" className="flex items-center gap-3 px-5 py-4 hover:bg-gray-50 transition-colors">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gray-100">
                <Star className="h-4 w-4 text-gray-500" />
              </div>
              <span className="flex-1 text-sm font-medium text-gray-900">Mes commandes</span>
              <ChevronRight className="h-4 w-4 text-gray-300" />
            </Link>
            <button
              onClick={() => toast('Déconnexion…')}
              className="flex w-full items-center gap-3 px-5 py-4 hover:bg-red-50 transition-colors group"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-red-50 group-hover:bg-red-100">
                <LogOut className="h-4 w-4 text-red-500" />
              </div>
              <span className="text-sm font-medium text-red-500">Se déconnecter</span>
            </button>
          </div>
        </motion.div>

      </div>

      {/* Address modal */}
      <Modal
        open={addrModal}
        onClose={() => setAddrModal(false)}
        title={editingAddr ? 'Modifier l\'adresse' : 'Nouvelle adresse'}
        size="md"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setAddrModal(false)}>Annuler</Button>
            <Button variant="primary" onClick={saveAddr}>{editingAddr ? 'Enregistrer' : 'Ajouter'}</Button>
          </div>
        }
      >
        <div className="space-y-3">
          <Input label="Libellé" required placeholder="Maison, Bureau…" value={addrForm.label}
            onChange={(e) => setAddrForm((f) => ({ ...f, label: e.target.value }))} />
          <Input label="Rue" required placeholder="12 rue de la Paix" value={addrForm.street}
            onChange={(e) => setAddrForm((f) => ({ ...f, street: e.target.value }))}
            leftIcon={<MapPin className="h-4 w-4" />} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Code postal" required placeholder="75001" value={addrForm.postalCode}
              onChange={(e) => setAddrForm((f) => ({ ...f, postalCode: e.target.value }))} />
            <Input label="Ville" required placeholder="Paris" value={addrForm.city}
              onChange={(e) => setAddrForm((f) => ({ ...f, city: e.target.value }))} />
          </div>
          <label className="flex cursor-pointer items-center gap-3 pt-1">
            <div
              onClick={() => setAddrForm((f) => ({ ...f, isDefault: !f.isDefault }))}
              className={`relative h-6 w-11 rounded-full transition-colors duration-200 ${addrForm.isDefault ? 'bg-brand-500' : 'bg-gray-200'}`}
            >
              <span className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow transition-transform duration-200 ${addrForm.isDefault ? 'translate-x-6' : 'translate-x-1'}`} />
            </div>
            <span className="text-sm font-medium text-gray-700">Définir comme adresse par défaut</span>
          </label>
        </div>
      </Modal>
    </div>
  );
}
