'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Mail, CheckCircle, ArrowLeft, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';

const RESEND_COOLDOWN = 60;

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get('email') ?? 'votre@email.com';

  const [countdown, setCountdown]   = useState(0);
  const [resendSent, setResendSent] = useState(false);

  const startCountdown = useCallback(() => {
    setCountdown(RESEND_COOLDOWN);
  }, []);

  useEffect(() => {
    if (countdown <= 0) return;
    const id = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(id);
  }, [countdown]);

  function handleResend() {
    if (countdown > 0) return;
    // In a real app: call your resend API here
    setResendSent(true);
    startCountdown();
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-2">
          <div
            className="flex h-9 w-9 items-center justify-center rounded-xl"
            style={{ backgroundColor: '#1EFF6A' }}
          >
            <span className="text-base font-bold text-black">F</span>
          </div>
          <span className="text-lg font-bold text-gray-900">FoodStack</span>
        </Link>
      </div>

      <div className="flex flex-1 items-center justify-center px-4 py-8">
        <div className="w-full max-w-sm">
          {/* Animated icon */}
          <div className="mb-8 flex justify-center">
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 0.1 }}
              className="relative flex h-24 w-24 items-center justify-center rounded-3xl bg-white shadow-lg shadow-gray-200"
            >
              <Mail className="h-12 w-12 text-gray-400" />
              {/* Check badge */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 18, delay: 0.4 }}
                className="absolute -right-2 -top-2 flex h-8 w-8 items-center justify-center rounded-full"
                style={{ backgroundColor: '#1EFF6A' }}
              >
                <CheckCircle className="h-5 w-5 text-black" />
              </motion.div>
            </motion.div>
          </div>

          {/* Heading */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="text-center"
          >
            <h1 className="text-2xl font-bold text-gray-900">Vérifiez votre email</h1>
            <p className="mt-3 text-sm text-gray-500 leading-relaxed">
              Nous avons envoyé un lien de confirmation à{' '}
              <strong className="font-semibold text-gray-800">{email}</strong>
            </p>
          </motion.div>

          {/* Card */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="mt-8 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm space-y-4"
          >
            {/* Steps */}
            {[
              'Ouvrez votre boîte mail',
              'Cliquez sur le lien de confirmation',
              'Vous serez redirigé automatiquement',
            ].map((step, i) => (
              <div key={step} className="flex items-start gap-3">
                <div
                  className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-black"
                  style={{ backgroundColor: '#1EFF6A' }}
                >
                  {i + 1}
                </div>
                <p className="text-sm text-gray-600">{step}</p>
              </div>
            ))}
          </motion.div>

          {/* Resend button */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
            className="mt-5"
          >
            <button
              onClick={handleResend}
              disabled={countdown > 0}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl border-2 border-gray-200 bg-white text-sm font-semibold text-gray-700 transition-all hover:border-gray-300 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${countdown > 0 ? 'animate-spin' : ''}`} />
              {countdown > 0
                ? `Renvoyer dans ${countdown}s`
                : resendSent
                  ? 'Renvoyer à nouveau'
                  : "Renvoyer l'email"}
            </button>

            {resendSent && countdown === 0 && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-2 text-center text-xs text-green-600 font-medium"
              >
                Email renvoyé avec succès !
              </motion.p>
            )}
          </motion.div>

          {/* Helper text */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.55 }}
            className="mt-4 text-center text-xs text-gray-400"
          >
            Vous n&apos;avez pas reçu l&apos;email ? Vérifiez vos spams
          </motion.p>

          {/* Back to login */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="mt-6 flex justify-center"
          >
            <Link
              href="/login"
              className="flex items-center gap-1.5 text-sm font-medium text-gray-500 transition-colors hover:text-gray-800"
            >
              <ArrowLeft className="h-4 w-4" />
              Retour à la connexion
            </Link>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense>
      <VerifyEmailContent />
    </Suspense>
  );
}
