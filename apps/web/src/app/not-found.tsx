import Link from 'next/link';

export default function NotFound() {
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
        <div
          className="text-[120px] font-black leading-none select-none"
          style={{ color: '#1EFF6A' }}
        >
          404
        </div>
        <h1 className="mt-4 text-2xl font-bold text-gray-900">Page introuvable</h1>
        <p className="mt-2 max-w-sm text-sm text-gray-500">
          La page que vous recherchez n&apos;existe pas ou a été déplacée.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/"
            className="inline-flex h-12 items-center justify-center rounded-2xl border border-gray-200 bg-white px-6 text-sm font-semibold text-gray-700 shadow-sm transition-colors hover:bg-gray-50"
          >
            Retour à l&apos;accueil
          </Link>
          <Link
            href="/dashboard"
            className="inline-flex h-12 items-center justify-center rounded-2xl px-6 text-sm font-bold text-white shadow-md transition-opacity hover:opacity-90"
            style={{ backgroundColor: '#1EFF6A', color: '#0a0a0a' }}
          >
            Tableau de bord
          </Link>
        </div>
      </div>
    </div>
  );
}
