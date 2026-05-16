'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Shield, CheckCircle, Copy, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function TwoFactorSetupPage() {
  const router = useRouter();
  const [step, setStep] = useState<'loading' | 'setup' | 'verify' | 'done'>('loading');
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState('');
  const [secret, setSecret] = useState('');
  const [showSecret, setShowSecret] = useState(false);
  const [token, setToken] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    initSetup();
  }, []);

  async function initSetup() {
    try {
      const res = await fetch('/api/auth/2fa/setup', { method: 'POST' });
      if (!res.ok) throw new Error('Failed to initialize 2FA');
      const data = await res.json();
      setQrCodeDataUrl(data.qrCodeDataUrl);
      setSecret(data.secret);
      setStep('setup');
    } catch {
      setError('Impossible d\'initialiser la 2FA. Reconnectez-vous.');
      setStep('setup');
    }
  }

  async function handleEnable() {
    if (token.length !== 6) {
      setError('Entrez le code à 6 chiffres');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/2fa/enable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Code invalide');
      }
      setStep('done');
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  function copySecret() {
    navigator.clipboard.writeText(secret);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const formatSecret = (s: string) =>
    s.match(/.{1,4}/g)?.join(' ') ?? s;

  if (step === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
      </div>
    );
  }

  if (step === 'done') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-sm text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">2FA activée !</h1>
          <p className="mt-2 text-gray-500">
            Votre compte est maintenant protégé par l&apos;authentification à deux facteurs.
          </p>
          <Button className="mt-6 w-full" onClick={() => router.push('/dashboard')}>
            Aller au tableau de bord
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-sm">
        {/* Header */}
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500/10">
            <Shield className="h-5 w-5 text-brand-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Activer la 2FA</h1>
            <p className="text-sm text-gray-500">Authentification à deux facteurs</p>
          </div>
        </div>

        {/* Steps */}
        <div className="mb-6 space-y-5">
          {/* Step 1 */}
          <div className="rounded-xl border border-gray-100 p-4">
            <p className="mb-3 text-sm font-semibold text-gray-700">
              1. Scannez ce QR code avec Google Authenticator ou Authy
            </p>
            {qrCodeDataUrl ? (
              <div className="flex justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={qrCodeDataUrl} alt="QR Code 2FA" className="h-48 w-48 rounded-lg" />
              </div>
            ) : (
              <div className="flex h-48 w-48 mx-auto items-center justify-center rounded-lg bg-gray-100">
                <AlertCircle className="h-8 w-8 text-gray-400" />
              </div>
            )}
          </div>

          {/* Step 2 — manual entry */}
          <div className="rounded-xl border border-gray-100 p-4">
            <p className="mb-3 text-sm font-semibold text-gray-700">
              2. Ou entrez manuellement la clé secrète
            </p>
            <div className="flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-2">
              <code className="flex-1 font-mono text-sm text-gray-800 tracking-widest">
                {showSecret ? formatSecret(secret) : '•••• •••• •••• ••••'}
              </code>
              <button
                onClick={() => setShowSecret(s => !s)}
                className="text-gray-400 hover:text-gray-600"
              >
                {showSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
              <button
                onClick={copySecret}
                className="text-gray-400 hover:text-gray-600"
              >
                {copied
                  ? <CheckCircle className="h-4 w-4 text-green-500" />
                  : <Copy className="h-4 w-4" />
                }
              </button>
            </div>
          </div>

          {/* Step 3 — verify */}
          <div className="rounded-xl border border-gray-100 p-4">
            <p className="mb-3 text-sm font-semibold text-gray-700">
              3. Entrez le code à 6 chiffres pour confirmer
            </p>
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={token}
              onChange={(e) => setToken(e.target.value.replace(/\D/g, ''))}
              placeholder="000 000"
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-center font-mono text-2xl tracking-[0.5em] text-gray-900 placeholder:text-gray-300 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            />
          </div>
        </div>

        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            {error}
          </div>
        )}

        <div className="flex gap-3">
          <Button
            variant="secondary"
            className="flex-1"
            onClick={() => router.push('/dashboard/settings')}
          >
            Annuler
          </Button>
          <Button
            className="flex-1"
            onClick={handleEnable}
            disabled={loading || token.length !== 6}
          >
            {loading ? 'Vérification...' : 'Activer la 2FA'}
          </Button>
        </div>
      </div>
    </div>
  );
}
