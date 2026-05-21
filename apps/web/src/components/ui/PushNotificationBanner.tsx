'use client';

import { useState } from 'react';
import { Bell, X } from 'lucide-react';
import { usePushNotifications } from '@/hooks/usePushNotifications';

export function PushNotificationBanner() {
  const { supported, permission, subscribed, subscribe } = usePushNotifications();
  const [dismissed, setDismissed] = useState(false);
  const [loading, setLoading] = useState(false);

  // Show only when push is supported, not yet subscribed, permission not denied, and not dismissed
  if (!supported || subscribed || permission === 'denied' || dismissed) {
    return null;
  }

  const handleActivate = async () => {
    setLoading(true);
    try {
      await subscribe();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-between gap-4 bg-surface-900 dark:bg-surface-800 px-4 py-3 shadow-lg sm:px-6">
      <div className="flex items-center gap-3">
        <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-brand-500/20">
          <Bell className="h-4 w-4 text-brand-400" />
        </span>
        <p className="text-sm text-white">
          Activez les notifications pour suivre vos commandes en temps réel.
        </p>
      </div>

      <div className="flex flex-shrink-0 items-center gap-2">
        <button
          onClick={handleActivate}
          disabled={loading}
          className="rounded-lg bg-brand-500 px-4 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-brand-600 disabled:opacity-60"
        >
          {loading ? 'Activation…' : 'Activer'}
        </button>

        <button
          onClick={() => setDismissed(true)}
          aria-label="Fermer"
          className="rounded-full p-1 text-surface-400 transition-colors hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
