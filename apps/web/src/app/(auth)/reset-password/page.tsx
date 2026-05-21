'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Lock, Eye, EyeOff, CheckCircle2, ArrowLeft, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { createClient } from '@/lib/supabase';

const RULES = [
  { label: 'Au moins 8 caractères', test: (p: string) => p.length >= 8 },
  { label: 'Une majuscule', test: (p: string) => /[A-Z]/.test(p) },
  { label: 'Un chiffre', test: (p: string) => /\d/.test(p) },
];

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const passed = RULES.filter((r) => r.test(password)).length;
  const strength = passed === 0 ? 0 : passed === 1 ? 33 : passed === 2 ? 66 : 100;
  const strengthColor = strength < 40 ? 'bg-red-400' : strength < 80 ? 'bg-yellow-400' : 'bg-green-500';
  const strengthLabel = strength < 40 ? 'Faible' : strength < 80 ? 'Moyen' : 'Fort';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passed < 3) { toast.error('Le mot de passe ne respecte pas les critères.'); return; }
    if (password !== confirm) { toast.error('Les mots de passe ne correspondent pas.'); return; }
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) { toast.error('Lien expiré ou invalide. Refaites la demande.'); return; }
    setDone(true);
    setTimeout(() => router.push('/login'), 3000);
  };

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-500">
            <span className="text-base font-bold text-white">F</span>
          </div>
          <span className="text-lg font-bold text-gray-900">FoodStack</span>
        </Link>
      </div>

      <div className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <AnimatePresence mode="wait">
            {!done ? (
              <motion.div
                key="form"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                className="rounded-3xl bg-white p-8 shadow-sm border border-gray-100"
              >
                <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50">
                  <ShieldCheck className="h-7 w-7 text-brand-500" />
                </div>

                <h1 className="text-2xl font-bold text-gray-900">Nouveau mot de passe</h1>
                <p className="mt-2 text-sm text-gray-500">
                  Choisissez un mot de passe sécurisé pour votre compte.
                </p>

                <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                  {/* Password */}
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-gray-700">
                      Nouveau mot de passe
                    </label>
                    <div className="relative">
                      <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                      <input
                        type={showPwd ? 'text' : 'password'}
                        required
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="h-11 w-full rounded-xl border border-gray-200 bg-white pl-10 pr-10 text-sm text-gray-900 placeholder:text-gray-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-all"
                      />
                      <button type="button" onClick={() => setShowPwd(!showPwd)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                        {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>

                    {/* Strength bar */}
                    {password && (
                      <div className="mt-2">
                        <div className="flex items-center justify-between mb-1">
                          <div className="h-1.5 flex-1 rounded-full bg-gray-100 mr-3 overflow-hidden">
                            <motion.div
                              className={`h-full rounded-full transition-colors ${strengthColor}`}
                              animate={{ width: `${strength}%` }}
                            />
                          </div>
                          <span className={`text-xs font-medium ${strength < 40 ? 'text-red-500' : strength < 80 ? 'text-yellow-500' : 'text-green-600'}`}>
                            {strengthLabel}
                          </span>
                        </div>
                        <div className="space-y-1">
                          {RULES.map((rule) => (
                            <div key={rule.label} className={`flex items-center gap-1.5 text-xs ${rule.test(password) ? 'text-green-600' : 'text-gray-400'}`}>
                              <CheckCircle2 className="h-3.5 w-3.5 flex-shrink-0" />
                              {rule.label}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Confirm */}
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-gray-700">
                      Confirmer le mot de passe
                    </label>
                    <div className="relative">
                      <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                      <input
                        type={showConfirm ? 'text' : 'password'}
                        required
                        placeholder="••••••••"
                        value={confirm}
                        onChange={(e) => setConfirm(e.target.value)}
                        className={`h-11 w-full rounded-xl border bg-white pl-10 pr-10 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 transition-all ${
                          confirm && confirm !== password
                            ? 'border-red-300 focus:border-red-400 focus:ring-red-400/20'
                            : 'border-gray-200 focus:border-brand-500 focus:ring-brand-500/20'
                        }`}
                      />
                      <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                        {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {confirm && confirm !== password && (
                      <p className="mt-1 text-xs text-red-500">Les mots de passe ne correspondent pas</p>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={loading || passed < 3 || password !== confirm}
                    className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-brand-500 text-sm font-semibold text-white shadow-sm transition-all hover:bg-brand-600 active:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading
                      ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      : <><ShieldCheck className="h-4 w-4" />Réinitialiser le mot de passe</>
                    }
                  </button>
                </form>
              </motion.div>
            ) : (
              <motion.div
                key="done"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="rounded-3xl bg-white p-8 shadow-sm border border-gray-100 text-center"
              >
                <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                  <CheckCircle2 className="h-8 w-8 text-green-500" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">Mot de passe mis à jour !</h2>
                <p className="mt-2 text-sm text-gray-500">
                  Votre mot de passe a été réinitialisé avec succès. Vous allez être redirigé vers la connexion…
                </p>
                <Link href="/login"
                  className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-brand-500 py-2.5 text-sm font-semibold text-white hover:bg-brand-600 transition-colors"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Aller à la connexion
                </Link>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
