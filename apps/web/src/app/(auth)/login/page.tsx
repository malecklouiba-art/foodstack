'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Mail, Lock, Eye, EyeOff, ArrowRight, ChevronDown, ChevronUp } from 'lucide-react';
import toast from 'react-hot-toast';
import { createClient } from '@/lib/supabase';
import api from '@/lib/api';
import { useAuthStore } from '@/store/auth';

// Demo accounts — bypass Supabase when these credentials are used
const DEMO_ACCOUNTS = [
  { email: 'admin@foodstack.app',  password: 'Admin1234!',    role: 'admin',    label: '👑 Super Admin',       redirect: '/dashboard' },
  { email: 'owner@lecomptoir.fr',  password: 'Owner1234!',    role: 'owner',    label: '🍽️ Restaurateur',     redirect: '/dashboard' },
  { email: 'staff@lecomptoir.fr',  password: 'Staff1234!',    role: 'staff',    label: '👷 Staff',             redirect: '/dashboard' },
  { email: 'driver@foodstack.app', password: 'Driver1234!',   role: 'driver',   label: '🛵 Livreur',           redirect: '/dashboard' },
  { email: 'client@exemple.fr',    password: 'Customer1234!', role: 'customer', label: '🛒 Client',            redirect: '/menu' },
] as const;

const DEMO_QUICK = [
  { role: 'admin',    label: '👑 Super Admin',   redirect: '/dashboard', color: 'bg-purple-100 text-purple-800 border-purple-200 hover:bg-purple-200' },
  { role: 'owner',    label: '🍽️ Restaurateur',  redirect: '/dashboard', color: 'bg-orange-100 text-orange-800 border-orange-200 hover:bg-orange-200' },
  { role: 'staff',    label: '👷 Staff',          redirect: '/dashboard', color: 'bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-200' },
  { role: 'driver',   label: '🛵 Livreur',        redirect: '/dashboard', color: 'bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-200' },
  { role: 'customer', label: '🛒 Client',         redirect: '/menu',      color: 'bg-green-100 text-green-800 border-green-200 hover:bg-green-200' },
] as const;

function setDemoCookie(role: string) {
  const expires = new Date(Date.now() + 86400 * 1000).toUTCString();
  document.cookie = `fs_demo=${role}; path=/; expires=${expires}; SameSite=Lax`;
}

function roleToCookie(role: string): string {
  const map: Record<string, string> = {
    super_admin: 'admin',
    restaurant_owner: 'owner',
    staff: 'staff',
    driver: 'driver',
    customer: 'customer',
  };
  return map[role] ?? role;
}

function mapApiUser(u: any) {
  return {
    id: u.id as string,
    email: u.email as string,
    name: ([u.firstName, u.lastName].filter(Boolean).join(' ') || u.email) as string,
    role: u.role as any,
    avatar: u.avatar ?? undefined,
    loyaltyPoints: u.loyaltyPoints,
    restaurantIds: (u.restaurantIds ?? []) as string[],
  };
}

export default function LoginPage() {
  const router = useRouter();
  const { setUser } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showDemo, setShowDemo] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Veuillez remplir tous les champs');
      return;
    }
    setLoading(true);

    const demoMatch = DEMO_ACCOUNTS.find(
      (a) => a.email === email.trim().toLowerCase() && a.password === password
    );

    try {
      const data = await (api.post('/auth/login', {
        email: email.trim().toLowerCase(),
        password,
      }) as Promise<any>);
      setUser(mapApiUser(data.user), data.accessToken);
      setDemoCookie(roleToCookie(data.user.role));
      toast.success(demoMatch ? `Connecté en tant que ${demoMatch.label}` : 'Connexion réussie !');
      router.push(demoMatch?.redirect ?? '/dashboard');
      router.refresh();
    } catch (err: any) {
      if (demoMatch) {
        // API unavailable — fall back to cookie-only demo mode
        setDemoCookie(demoMatch.role);
        toast.success(`Connecté en tant que ${demoMatch.label}`);
        router.push(demoMatch.redirect);
        router.refresh();
      } else {
        // Try Supabase as fallback for non-demo accounts
        try {
          const supabase = createClient();
          const { error } = await supabase.auth.signInWithPassword({ email, password });
          if (error) {
            toast.error(
              error.message === 'Invalid login credentials'
                ? 'Email ou mot de passe incorrect'
                : error.message
            );
            setLoading(false);
            return;
          }
          toast.success('Connexion réussie !');
          router.push('/dashboard');
          router.refresh();
        } catch {
          toast.error(err?.message ?? 'Erreur de connexion. Réessayez.');
          setLoading(false);
        }
      }
    }
  };

  const loginAs = async (account: typeof DEMO_ACCOUNTS[number]) => {
    try {
      const data = await (api.post('/auth/login', {
        email: account.email,
        password: account.password,
      }) as Promise<any>);
      setUser(mapApiUser(data.user), data.accessToken);
      setDemoCookie(roleToCookie(data.user.role));
    } catch {
      // API unavailable — cookie-only fallback
      setDemoCookie(account.role);
    }
    toast.success(`Connecté en tant que ${account.label}`);
    router.push(account.redirect);
    router.refresh();
  };

  const handleOAuth = async (provider: 'google' | 'apple') => {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${location.origin}/auth/callback` },
    });
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
        <Link href="/register" className="text-sm font-medium text-brand-500">
          S&apos;inscrire
        </Link>
      </div>

      <div className="flex flex-1 items-center justify-center px-4 py-8">
        <div className="w-full max-w-sm">
          <div className="mb-6 flex justify-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-brand-100 text-4xl">
              👋
            </div>
          </div>

          <h1 className="text-center text-2xl font-bold text-gray-900">Bon retour !</h1>
          <p className="mt-1 text-center text-sm text-gray-500">Connectez-vous à votre compte</p>

          {/* Demo accounts accordion */}
          <div className="mt-6 rounded-2xl border border-brand-200 bg-brand-50">
            <button
              onClick={() => setShowDemo(!showDemo)}
              className="flex w-full items-center justify-between px-4 py-3 text-sm font-semibold text-brand-700"
            >
              <span>🎭 Comptes de démonstration</span>
              {showDemo ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
            {showDemo && (
              <div className="border-t border-brand-200 px-4 pb-4 pt-3 space-y-2">
                {DEMO_ACCOUNTS.map((account) => (
                  <button
                    key={account.email}
                    onClick={() => loginAs(account)}
                    className="w-full rounded-xl bg-white px-3 py-2.5 text-left transition-colors hover:bg-brand-50 border border-brand-100"
                  >
                    <p className="text-sm font-semibold text-gray-900">{account.label}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{account.email}</p>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="relative my-6 flex items-center">
            <div className="flex-1 border-t border-gray-200" />
            <span className="mx-4 text-xs text-gray-400">ou avec vos identifiants</span>
            <div className="flex-1 border-t border-gray-200" />
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-gray-700">Email</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="vous@exemple.fr"
                  className="h-12 w-full rounded-2xl border border-gray-200 bg-white pl-10 pr-4 text-sm text-gray-900 placeholder:text-gray-400 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-200"
                />
              </div>
            </div>

            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label className="text-sm font-semibold text-gray-700">Mot de passe</label>
                <Link href="/forgot-password" className="text-xs font-medium text-brand-500">
                  Oublié ?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
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
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-brand-500 text-sm font-bold text-white shadow-md shadow-brand transition-opacity active:opacity-80 disabled:opacity-60"
            >
              {loading ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <>Se connecter <ArrowRight className="h-4 w-4" /></>
              )}
            </button>
          </form>

          <div className="mt-6">
            <div className="relative flex items-center">
              <div className="flex-1 border-t border-gray-200" />
              <span className="mx-4 text-xs text-gray-400">ou continuer avec</span>
              <div className="flex-1 border-t border-gray-200" />
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <button
                onClick={() => handleOAuth('google')}
                className="flex h-12 items-center justify-center gap-2 rounded-2xl border border-gray-200 bg-white text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
              >
                <span className="text-base">🇬</span> Google
              </button>
              <button
                onClick={() => handleOAuth('apple')}
                className="flex h-12 items-center justify-center gap-2 rounded-2xl border border-gray-200 bg-white text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
              >
                <span className="text-base"></span> Apple
              </button>
            </div>
          </div>

          <p className="mt-6 text-center text-sm text-gray-500">
            Pas encore de compte ?{' '}
            <Link href="/register" className="font-semibold text-brand-500">
              S&apos;inscrire gratuitement
            </Link>
          </p>

          {/* Quick demo section */}
          <div className="mt-8 rounded-2xl border border-gray-200 bg-white p-4">
            <p className="mb-3 text-center text-xs font-semibold uppercase tracking-wide text-gray-400">
              Se connecter en démo
            </p>
            <div className="flex flex-col gap-2">
              {DEMO_QUICK.map((d) => (
                <button
                  key={d.role}
                  onClick={() => {
                    setDemoCookie(d.role);
                    toast.success(`Connecté en tant que ${d.label}`);
                    router.push(d.redirect);
                    router.refresh();
                  }}
                  className={`w-full rounded-xl border px-4 py-2.5 text-sm font-semibold transition-colors ${d.color}`}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
