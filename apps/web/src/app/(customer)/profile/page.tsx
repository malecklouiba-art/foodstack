'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  User,
  Mail,
  Phone,
  MapPin,
  CreditCard,
  Bell,
  Shield,
  LogOut,
  Pencil,
  Plus,
  Trash2,
  ChevronRight,
  Star,
  Trophy,
  Check,
} from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import toast from 'react-hot-toast';

interface Address {
  id: string;
  label: string;
  address: string;
  isDefault: boolean;
}

const INITIAL_ADDRESSES: Address[] = [
  { id: 'addr-1', label: 'Domicile', address: '12 rue de la Paix, 75001 Paris', isDefault: true },
  { id: 'addr-2', label: 'Bureau', address: '45 avenue Montaigne, 75008 Paris', isDefault: false },
];

const LOYALTY_TIERS = [
  { name: 'Bronze', min: 0, max: 499, color: 'text-amber-700', bg: 'bg-amber-100' },
  { name: 'Silver', min: 500, max: 999, color: 'text-slate-600', bg: 'bg-slate-100' },
  { name: 'Gold', min: 1000, max: 2499, color: 'text-yellow-600', bg: 'bg-yellow-100' },
  { name: 'Platinum', min: 2500, max: Infinity, color: 'text-purple-700', bg: 'bg-purple-100' },
];

const USER_POINTS = 760;
const currentTier = LOYALTY_TIERS.find((t) => USER_POINTS >= t.min && USER_POINTS <= t.max)!;
const nextTier = LOYALTY_TIERS[LOYALTY_TIERS.indexOf(currentTier) + 1];
const progressPct = nextTier
  ? Math.round(((USER_POINTS - currentTier.min) / (nextTier.min - currentTier.min)) * 100)
  : 100;

export default function ProfilePage() {
  const [addresses, setAddresses] = useState<Address[]>(INITIAL_ADDRESSES);
  const [addrModal, setAddrModal] = useState(false);
  const [addrForm, setAddrForm] = useState({ label: '', address: '' });
  const [editProfile, setEditProfile] = useState(false);
  const [profile, setProfile] = useState({ firstName: 'Marie', lastName: 'Laurent', email: 'marie@email.fr', phone: '06 12 34 56 78' });
  const [profileForm, setProfileForm] = useState(profile);
  const [notifs, setNotifs] = useState({ orders: true, promos: false, news: true });

  const saveAddress = () => {
    if (!addrForm.label.trim() || !addrForm.address.trim()) return;
    setAddresses((prev) => [...prev, { id: `addr-${Date.now()}`, ...addrForm, isDefault: false }]);
    setAddrModal(false);
    setAddrForm({ label: '', address: '' });
    toast.success('Adresse ajoutée');
  };

  const deleteAddress = (id: string) => {
    setAddresses((prev) => prev.filter((a) => a.id !== id));
    toast.success('Adresse supprimée');
  };

  const setDefaultAddress = (id: string) => {
    setAddresses((prev) => prev.map((a) => ({ ...a, isDefault: a.id === id })));
  };

  const saveProfile = () => {
    setProfile(profileForm);
    setEditProfile(false);
    toast.success('Profil mis à jour');
  };

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-surface-50 py-8">
        <div className="mx-auto max-w-2xl px-4 sm:px-6 space-y-5">

          {/* Profile card */}
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-surface-200 bg-white p-6 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-2xl bg-brand-100 text-2xl font-bold text-brand-700">
                {profile.firstName[0]}{profile.lastName[0]}
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-surface-900">{profile.firstName} {profile.lastName}</h2>
                <p className="text-sm text-surface-500">{profile.email}</p>
                <p className="text-sm text-surface-500">{profile.phone}</p>
              </div>
              <button
                onClick={() => { setProfileForm(profile); setEditProfile(true); }}
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-surface-200 text-surface-400 hover:bg-surface-100 hover:text-surface-700"
              >
                <Pencil className="h-4 w-4" />
              </button>
            </div>
          </motion.div>

          {/* Loyalty card */}
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="rounded-2xl border border-surface-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <Trophy className="h-5 w-5 text-brand-500" />
              <h3 className="font-semibold text-surface-900">Programme fidélité</h3>
            </div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <span className={`rounded-xl px-3 py-1 text-sm font-bold ${currentTier.bg} ${currentTier.color}`}>
                  {currentTier.name}
                </span>
                <p className="mt-2 text-2xl font-bold text-surface-900">{USER_POINTS} <span className="text-sm font-normal text-surface-500">points</span></p>
              </div>
              {nextTier && (
                <div className="text-right">
                  <p className="text-xs text-surface-400">Prochain palier</p>
                  <span className={`rounded-xl px-3 py-1 text-sm font-bold ${LOYALTY_TIERS[LOYALTY_TIERS.indexOf(currentTier) + 1].bg} ${LOYALTY_TIERS[LOYALTY_TIERS.indexOf(currentTier) + 1].color}`}>
                    {nextTier.name}
                  </span>
                  <p className="mt-1 text-xs text-surface-500">{nextTier.min - USER_POINTS} pts manquants</p>
                </div>
              )}
            </div>
            {nextTier && (
              <div>
                <div className="h-2 overflow-hidden rounded-full bg-surface-100">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPct}%` }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                    className="h-full rounded-full bg-brand-500"
                  />
                </div>
                <div className="mt-1 flex justify-between text-xs text-surface-400">
                  <span>{currentTier.name} ({currentTier.min} pts)</span>
                  <span>{nextTier.name} ({nextTier.min} pts)</span>
                </div>
              </div>
            )}
            <div className="mt-4 grid grid-cols-3 gap-3">
              {[
                { label: 'Commandes', value: '24' },
                { label: 'Économisé', value: '18.50 €' },
                { label: 'Note moy.', value: '4.8 ★' },
              ].map((stat) => (
                <div key={stat.label} className="rounded-xl bg-surface-50 px-3 py-3 text-center">
                  <p className="text-lg font-bold text-surface-900">{stat.value}</p>
                  <p className="text-xs text-surface-400">{stat.label}</p>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Addresses */}
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="rounded-2xl border border-surface-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-brand-500" />
                <h3 className="font-semibold text-surface-900">Mes adresses</h3>
              </div>
              <button
                onClick={() => setAddrModal(true)}
                className="flex items-center gap-1.5 rounded-xl border border-surface-200 px-3 py-1.5 text-sm font-medium text-surface-600 hover:bg-surface-50"
              >
                <Plus className="h-3.5 w-3.5" />
                Ajouter
              </button>
            </div>
            <div className="space-y-3">
              {addresses.map((addr) => (
                <div key={addr.id} className={`flex items-start gap-3 rounded-xl border p-3 transition-colors ${addr.isDefault ? 'border-brand-200 bg-brand-50' : 'border-surface-100 bg-surface-50 hover:border-surface-200'}`}>
                  <div className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg ${addr.isDefault ? 'bg-brand-100 text-brand-600' : 'bg-surface-200 text-surface-500'}`}>
                    <MapPin className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-surface-900">{addr.label}</p>
                      {addr.isDefault && (
                        <span className="rounded-full bg-brand-100 px-2 py-0.5 text-xs font-medium text-brand-600">Par défaut</span>
                      )}
                    </div>
                    <p className="mt-0.5 text-xs text-surface-500">{addr.address}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    {!addr.isDefault && (
                      <button
                        onClick={() => setDefaultAddress(addr.id)}
                        className="flex h-7 w-7 items-center justify-center rounded-lg text-surface-400 hover:bg-surface-200 hover:text-surface-700"
                        title="Définir par défaut"
                      >
                        <Check className="h-3.5 w-3.5" />
                      </button>
                    )}
                    <button
                      onClick={() => deleteAddress(addr.id)}
                      className="flex h-7 w-7 items-center justify-center rounded-lg text-surface-400 hover:bg-red-50 hover:text-red-500"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Notifications */}
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="rounded-2xl border border-surface-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <Bell className="h-5 w-5 text-brand-500" />
              <h3 className="font-semibold text-surface-900">Notifications</h3>
            </div>
            <div className="space-y-4">
              {([
                { key: 'orders', label: 'Suivi de commandes', desc: 'Mises à jour sur l\'état de vos commandes' },
                { key: 'promos', label: 'Promotions', desc: 'Offres spéciales et réductions' },
                { key: 'news', label: 'Nouveautés', desc: 'Nouveaux restaurants et menus' },
              ] as { key: keyof typeof notifs; label: string; desc: string }[]).map(({ key, label, desc }) => (
                <div key={key} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-surface-900">{label}</p>
                    <p className="text-xs text-surface-400">{desc}</p>
                  </div>
                  <button
                    onClick={() => setNotifs((p) => ({ ...p, [key]: !p[key] }))}
                    className={`relative h-6 w-11 rounded-full transition-colors ${notifs[key] ? 'bg-brand-500' : 'bg-surface-200'}`}
                  >
                    <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${notifs[key] ? 'translate-x-5' : 'translate-x-0.5'}`} />
                  </button>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Settings links */}
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="rounded-2xl border border-surface-200 bg-white shadow-sm overflow-hidden">
            {[
              { icon: CreditCard, label: 'Mes moyens de paiement', href: '#' },
              { icon: Shield, label: 'Sécurité et confidentialité', href: '#' },
              { icon: Star, label: 'Mes avis', href: '#' },
            ].map(({ icon: Icon, label, href }) => (
              <a
                key={label}
                href={href}
                className="flex items-center gap-4 px-5 py-4 transition-colors hover:bg-surface-50 border-b border-surface-100 last:border-0"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-surface-100">
                  <Icon className="h-4 w-4 text-surface-600" />
                </div>
                <span className="flex-1 text-sm font-medium text-surface-900">{label}</span>
                <ChevronRight className="h-4 w-4 text-surface-300" />
              </a>
            ))}
          </motion.div>

          {/* Logout */}
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
            <button className="flex w-full items-center gap-3 rounded-2xl border border-red-100 bg-white px-5 py-4 text-red-500 transition-colors hover:bg-red-50">
              <LogOut className="h-4 w-4" />
              <span className="text-sm font-medium">Se déconnecter</span>
            </button>
          </motion.div>

          <div className="pb-8 text-center text-xs text-surface-400">FoodStack v1.0 · CGU · Confidentialité</div>
        </div>
      </div>

      {/* Edit profile modal */}
      <Modal
        open={editProfile}
        onClose={() => setEditProfile(false)}
        title="Modifier le profil"
        size="sm"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setEditProfile(false)}>Annuler</Button>
            <Button onClick={saveProfile}>Enregistrer</Button>
          </div>
        }
      >
        <div className="space-y-4">
          {([
            { key: 'firstName', label: 'Prénom', icon: User },
            { key: 'lastName', label: 'Nom', icon: User },
            { key: 'email', label: 'Email', icon: Mail, type: 'email' },
            { key: 'phone', label: 'Téléphone', icon: Phone, type: 'tel' },
          ] as { key: keyof typeof profileForm; label: string; icon: React.ElementType; type?: string }[]).map(({ key, label, icon: Icon, type = 'text' }) => (
            <div key={key}>
              <label className="mb-1.5 block text-sm font-semibold text-surface-700">{label}</label>
              <div className="relative">
                <Icon className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-surface-400" />
                <input
                  type={type}
                  value={profileForm[key]}
                  onChange={(e) => setProfileForm((p) => ({ ...p, [key]: e.target.value }))}
                  className="h-11 w-full rounded-xl border border-surface-200 pl-10 pr-4 text-sm text-surface-900 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
                />
              </div>
            </div>
          ))}
        </div>
      </Modal>

      {/* Add address modal */}
      <Modal
        open={addrModal}
        onClose={() => setAddrModal(false)}
        title="Ajouter une adresse"
        size="sm"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setAddrModal(false)}>Annuler</Button>
            <Button onClick={saveAddress} disabled={!addrForm.label.trim() || !addrForm.address.trim()}>Ajouter</Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-surface-700">Libellé</label>
            <input
              type="text"
              value={addrForm.label}
              onChange={(e) => setAddrForm((p) => ({ ...p, label: e.target.value }))}
              placeholder="Domicile, Bureau, Chez maman..."
              className="h-11 w-full rounded-xl border border-surface-200 px-4 text-sm text-surface-900 placeholder:text-surface-400 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-surface-700">Adresse complète</label>
            <input
              type="text"
              value={addrForm.address}
              onChange={(e) => setAddrForm((p) => ({ ...p, address: e.target.value }))}
              placeholder="12 rue de la Paix, 75001 Paris"
              className="h-11 w-full rounded-xl border border-surface-200 px-4 text-sm text-surface-900 placeholder:text-surface-400 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
            />
          </div>
        </div>
      </Modal>
    </>
  );
}
