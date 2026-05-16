'use client';

import Link from 'next/link';

interface ErrorPageProps {
  error: Error;
  reset: () => void;
}

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Top bar */}
      <div className="flex items-center px-6 py-4">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-500">
            <span className="text-base font-bold text-white">F</span>
          </div>
          <span className="text-lg font-bold text-gray-900">FoodStack</span>
        </Link>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center px-4 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-red-100 text-4xl">
          ⚠️
        </div>
        <h1 className="mt-6 text-2xl font-bold text-gray-900">Une erreur est survenue</h1>
        <p className="mt-2 text-sm text-gray-500">
          Quelque chose s&apos;est mal passé. Réessayez ou revenez à l&apos;accueil.
        </p>

        {error.message && (
          <code className="mt-4 block max-w-sm rounded-xl bg-gray-100 px-4 py-3 text-left text-xs text-gray-600 break-all">
            {error.message}
          </code>
        )}

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <button
            onClick={reset}
            className="inline-flex h-12 items-center justify-center rounded-2xl bg-brand-500 px-6 text-sm font-bold text-white shadow-md transition-opacity hover:opacity-90"
          >
            Réessayer
          </button>
          <Link
            href="/"
            className="inline-flex h-12 items-center justify-center rounded-2xl border border-gray-200 bg-white px-6 text-sm font-semibold text-gray-700 shadow-sm transition-colors hover:bg-gray-50"
          >
            Retour à l&apos;accueil
          </Link>
        </div>
      </div>
    </div>
  );
}
