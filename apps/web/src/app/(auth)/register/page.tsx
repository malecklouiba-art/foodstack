'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { User, Mail, Lock, Eye, EyeOff, ArrowRight, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { createClient } from '@/lib/supabase';

const passwordRules = [
  { label: 'Au moins 8 caractères', test: (p: string) => p.length >= 8 },
  { label: 'Une majuscule', test: (p: string) => /[A-Z]/.test(p) },
  { label: 'Un chiffre', test: (p: string) => /\d/.test(p) },
];

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState<'customer' | 'restaurant_owner'>('customer');

  const passwordStrength = passwordRules.filter((r) => r.test(form.password)).length;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordStrength < 3) {
      toast.error('Votre mot de passe est trop faible');
      return;
    }
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: { name: form.name, role },
        emailRedirectTo: `${location.origin}/auth/callback`,
      },
    });
    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }
    toast.success('Compte créé ! Vérifiez votre email pour confirmer.');
    router.push('/dashboard');
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-500">
            <span className="text-base font-bold text-white">F</span>
          </div>
          <span className="text-lg font-bold text-gray-900">FoodStack</span>
        </Link>
        <Link href="/login" className="text-sm font-medium text-brand-500">
          Se connecter
        </Link>
      </div>

      <div className="flex flex-1 items-center justify-center px-4 py-8">
        <div className="w-full max-w-sm">
          {/* Emoji banner */}
          <div className="mb-6 flex justify-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-brand-100 text-4xl">
              🎉
            </div>
          </div>

          <h1 className="text-center text-2xl font-bold text-gray-900">Créer un compte</h1>
          <p className="mt-1 text-center text-sm text-gray-500">Commandez en quelques secondes</p>

          {/* Role selector */}
          <div className="mt-6 grid grid-cols-2 gap-2">
            {[
              { value: 'customer' as const, label: 'Client', icon: '🛍️' },
              { value: 'restaurant_owner' as const, label: 'Restaurant', icon: '🍽️' },
            ].map((r) => (
              <button
                key={r.value}
                onClick={() => setRole(r.value)}
                className={`flex items-center justify-center gap-2 rounded-2xl border py-3 text-sm font-semibold transition-colors ${
                  role === r.value
                    ? 'border-brand-400 bg-brand-50 text-brand-600'
                    : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                <span>{r.icon}</span>
                {r.label}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-gray-700">Nom complet</label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Jean Dupont"
                  required
                  className="h-12 w-full rounded-2xl border border-gray-200 bg-white pl-10 pr-4 text-sm text-gray-900 placeholder:text-gray-400 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-200"
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-semibold text-gray-700">Email</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="vous@exemple.fr"
                  required
                  className="h-12 w-full rounded-2xl border border-gray-200 bg-white pl-10 pr-4 text-sm text-gray-900 placeholder:text-gray-400 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-200"
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-semibold text-gray-700">Mot de passe</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="••••••••"
                  required
                  className="h-12 w-full rounded-2xl border border-gray-200 bg-white pl-10 pr-11 text-sm text-gray-900 placeholder:text-gray-400 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-200"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>

              {form.password && (
                <div className="mt-3 space-y-2">
                  <div className="flex gap-1.5">
                    {[...Array(3)].map((_, i) => (
                      <div
                        key={i}
                        className={`h-1.5 flex-1 rounded-full transition-colors ${
                          i < passwordStrength
                            ? passwordStrength === 1 ? 'bg-red-400' : passwordStrength === 2 ? 'bg-yellow-400' : 'bg-green-500'
                            : 'bg-gray-200'
                        }`}
                      />
                    ))}
                  </div>
                  <div className="space-y-1">
                    {passwordRules.map((rule) => (
                      <div key={rule.label} className="flex items-center gap-1.5">
                        <CheckCircle2
                          className={`h-3.5 w-3.5 ${rule.test(form.password) ? 'text-green-500' : 'text-gray-300'}`}
                        />
                        <span className={`text-xs ${rule.test(form.password) ? 'text-green-600' : 'text-gray-400'}`}>
                          {rule.label}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-brand-500 text-sm font-bold text-white shadow-md shadow-brand transition-opacity active:opacity-80 disabled:opacity-60"
            >
              {loading ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <>Créer mon compte <ArrowRight className="h-4 w-4" /></>
              )}
            </button>
          </form>

          <p className="mt-4 text-center text-xs text-gray-400">
            En vous inscrivant, vous acceptez nos{' '}
            <a href="#" className="text-brand-500 hover:underline">CGU</a> et{' '}
            <a href="#" className="text-brand-500 hover:underline">Politique de confidentialité</a>
          </p>

          <p className="mt-4 text-center text-sm text-gray-500">
            Déjà un compte ?{' '}
            <Link href="/login" className="font-semibold text-brand-500">
              Se connecter
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
