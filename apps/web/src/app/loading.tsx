export default function Loading() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-gray-50">
      <div
        className="h-10 w-10 animate-spin rounded-full border-4 border-brand-500 border-t-transparent"
      />
      <p className="text-sm font-medium text-gray-500">Chargement...</p>
    </div>
  );
}
