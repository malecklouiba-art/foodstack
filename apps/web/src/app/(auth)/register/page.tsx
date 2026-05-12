'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { User, Mail, Lock, Eye, EyeOff, ArrowRight, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/Button';
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
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-surface-950 via-surface-900 to-surface-800 px-4 py-12">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-brand-500/10 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        <div className="mb-8 text-center">
          <Link href="/" className="inline-flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-brand shadow-brand-lg">
              <span className="text-xl font-bold text-white">F</span>
            </div>
            <span className="text-2xl font-bold text-white">FoodStack</span>
          </Link>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur-xl shadow-glass-lg">
          <h1 className="text-2xl font-bold text-white">Créer un compte</h1>
          <p className="mt-1 text-sm text-white/60">Commencez votre essai gratuit de 14 jours</p>

          {/* Role selector */}
          <div className="mt-5 grid grid-cols-2 gap-2">
            {[
              { value: 'customer' as const, label: 'Client', icon: '🛍️' },
              { value: 'restaurant_owner' as const, label: 'Restaurant', icon: '🍽️' },
            ].map((r) => (
              <button
                key={r.value}
                onClick={() => setRole(r.value)}
                className={`flex items-center justify-center gap-2 rounded-xl border py-2.5 text-sm font-medium transition-colors ${
                  role === r.value
                    ? 'border-brand-400 bg-brand-500/20 text-brand-300'
                    : 'border-white/20 bg-white/5 text-white/60 hover:bg-white/10'
                }`}
              >
                <span>{r.icon}</span>
                {r.label}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            {/* Name */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-white/80">Nom complet</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Jean Dupont"
                  required
                  className="h-11 w-full rounded-xl border border-white/20 bg-white/10 pl-10 pr-4 text-sm text-white placeholder:text-white/30 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-400/30"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-white/80">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="vous@exemple.fr"
                  required
                  className="h-11 w-full rounded-xl border border-white/20 bg-white/10 pl-10 pr-4 text-sm text-white placeholder:text-white/30 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-400/30"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-white/80">Mot de passe</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="••••••••"
                  required
                  className="h-11 w-full rounded-xl border border-white/20 bg-white/10 pl-10 pr-10 text-sm text-white placeholder:text-white/30 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-400/30"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>

              {form.password && (
                <div className="mt-2 space-y-1">
                  <div className="flex gap-1">
                    {[...Array(3)].map((_, i) => (
                      <div
                        key={i}
                        className={`h-1 flex-1 rounded-full transition-colors ${
                          i < passwordStrength
                            ? passwordStrength === 1 ? 'bg-red-500' : passwordStrength === 2 ? 'bg-yellow-500' : 'bg-green-500'
                            : 'bg-white/20'
                        }`}
                      />
                    ))}
                  </div>
                  <div className="space-y-0.5">
                    {passwordRules.map((rule) => (
                      <div key={rule.label} className="flex items-center gap-1.5">
                        <CheckCircle2
                          className={`h-3 w-3 ${rule.test(form.password) ? 'text-green-400' : 'text-white/20'}`}
                        />
                        <span className={`text-xs ${rule.test(form.password) ? 'text-green-400' : 'text-white/40'}`}>
                          {rule.label}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <Button
              type="submit"
              fullWidth
              size="lg"
              loading={loading}
              icon={<ArrowRight className="h-5 w-5" />}
              iconPosition="right"
              className="mt-2"
            >
              Créer mon compte
            </Button>
          </form>

          <p className="mt-4 text-center text-xs text-white/40">
            En vous inscrivant, vous acceptez nos{' '}
            <a href="#" className="text-brand-400 hover:underline">CGU</a> et{' '}
            <a href="#" className="text-brand-400 hover:underline">Politique de confidentialité</a>
          </p>

          <p className="mt-4 text-center text-sm text-white/50">
            Déjà un compte ?{' '}
            <Link href="/auth/login" className="font-medium text-brand-400 hover:text-brand-300">
              Se connecter
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
