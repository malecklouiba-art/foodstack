'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Mail, ArrowRight, ArrowLeft, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { createClient } from '@/lib/supabase';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error('Veuillez saisir votre adresse email');
      return;
    }
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${location.origin}/auth/reset-password`,
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setSent(true);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-500">
            <span className="text-base font-bold text-white">F</span>
          </div>
          <span className="text-lg font-bold text-gray-900">FoodStack</span>
        </Link>
        <Link href="/login" className="flex items-center gap-1 text-sm font-medium text-orange-500">
          <ArrowLeft className="h-4 w-4" />
          Connexion
        </Link>
      </div>

      <div className="flex flex-1 items-center justify-center px-4 py-8">
        <div className="w-full max-w-sm">
          {sent ? (
            <div className="text-center">
              <div className="mb-4 flex justify-center">
                <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-green-100">
                  <CheckCircle2 className="h-10 w-10 text-green-500" />
                </div>
              </div>
              <h1 className="text-2xl font-bold text-gray-900">Email envoyé !</h1>
              <p className="mt-2 text-sm text-gray-500">
                Un lien de réinitialisation a été envoyé à{' '}
                <span className="font-semibold text-gray-700">{email}</span>.
                Vérifiez aussi vos spams.
              </p>
              <Link
                href="/login"
                className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-orange-500 text-sm font-bold text-white shadow-md shadow-orange-200 transition-opacity active:opacity-80"
              >
                Retour à la connexion
              </Link>
            </div>
          ) : (
            <>
              <div className="mb-6 flex justify-center">
                <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-orange-100 text-4xl">
                  🔑
                </div>
              </div>

              <h1 className="text-center text-2xl font-bold text-gray-900">Mot de passe oublié ?</h1>
              <p className="mt-1 text-center text-sm text-gray-500">
                Saisissez votre email pour recevoir un lien de réinitialisation
              </p>

              <form onSubmit={handleSubmit} className="mt-8 space-y-4">
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-gray-700">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="vous@exemple.fr"
                      className="h-12 w-full rounded-2xl border border-gray-200 bg-white pl-10 pr-4 text-sm text-gray-900 placeholder:text-gray-400 focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-200"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-orange-500 text-sm font-bold text-white shadow-md shadow-orange-200 transition-opacity active:opacity-80 disabled:opacity-60"
                >
                  {loading ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  ) : (
                    <>Envoyer le lien <ArrowRight className="h-4 w-4" /></>
                  )}
                </button>
              </form>

              <p className="mt-6 text-center text-sm text-gray-500">
                Vous souvenez-vous ?{' '}
                <Link href="/login" className="font-semibold text-orange-500">
                  Se connecter
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
