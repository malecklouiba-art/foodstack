'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Mail, ArrowLeft, Send, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { createClient } from '@/lib/supabase';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${location.origin}/auth/reset-password`,
    });
    setLoading(false);
    if (error) {
      toast.error('Une erreur est survenue. Vérifiez votre email.');
      return;
    }
    setSent(true);
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
        <Link href="/login" className="flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors">
          <ArrowLeft className="h-4 w-4" />
          Connexion
        </Link>
      </div>

      <div className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <AnimatePresence mode="wait">
            {!sent ? (
              <motion.div
                key="form"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                className="rounded-3xl bg-white p-8 shadow-sm border border-gray-100"
              >
                {/* Icon */}
                <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50">
                  <Mail className="h-7 w-7 text-brand-500" />
                </div>

                <h1 className="text-2xl font-bold text-gray-900">Mot de passe oublié</h1>
                <p className="mt-2 text-sm text-gray-500">
                  Entrez votre email et nous vous enverrons un lien pour réinitialiser votre mot de passe.
                </p>

                <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-gray-700">
                      Adresse email
                    </label>
                    <div className="relative">
                      <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                      <input
                        type="email"
                        required
                        placeholder="vous@exemple.fr"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="h-11 w-full rounded-xl border border-gray-200 bg-white pl-10 pr-4 text-sm text-gray-900 placeholder:text-gray-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-all"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading || !email}
                    className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-brand-500 text-sm font-semibold text-white shadow-sm transition-all hover:bg-brand-600 active:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    ) : (
                      <>
                        <Send className="h-4 w-4" />
                        Envoyer le lien
                      </>
                    )}
                  </button>
                </form>

                <p className="mt-5 text-center text-sm text-gray-500">
                  Vous vous souvenez ?{' '}
                  <Link href="/login" className="font-medium text-brand-500 hover:text-brand-600">
                    Se connecter
                  </Link>
                </p>
              </motion.div>
            ) : (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="rounded-3xl bg-white p-8 shadow-sm border border-gray-100 text-center"
              >
                <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                  <CheckCircle2 className="h-8 w-8 text-green-500" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">Email envoyé !</h2>
                <p className="mt-2 text-sm text-gray-500">
                  Nous avons envoyé un lien de réinitialisation à{' '}
                  <span className="font-medium text-gray-700">{email}</span>.
                  Vérifiez votre boîte mail (et vos spams).
                </p>
                <div className="mt-6 space-y-3">
                  <button
                    onClick={() => { setSent(false); setEmail(''); }}
                    className="w-full rounded-xl border border-gray-200 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Utiliser un autre email
                  </button>
                  <Link href="/login"
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-500 py-2.5 text-sm font-semibold text-white hover:bg-brand-600 transition-colors"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Retour à la connexion
                  </Link>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
