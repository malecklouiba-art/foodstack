import { useState, useEffect, useCallback } from 'react';
import { useApi } from '@/hooks/useApi';

interface NotificationSummary {
  id: string;
  read: boolean;
}

// Lightweight hook that fetches only enough to compute the unread badge count.
// Falls back to 0 silently when the API is unavailable so the tab bar never breaks.
export function useNotificationBadge(): number {
  const { get } = useApi();
  const [unreadCount, setUnreadCount] = useState(0);

  const fetch = useCallback(async () => {
    try {
      const data = await get<NotificationSummary[]>('/api/v1/notifications');
      setUnreadCount(data.filter((n) => !n.read).length);
    } catch {
      // Keep previous count — don't reset to 0 on network error
    }
  }, [get]);

  useEffect(() => {
    void fetch();
    // Refresh every 60 s while the tab bar is mounted
    const id = setInterval(() => { void fetch(); }, 60_000);
    return () => clearInterval(id);
  }, [fetch]);

  return unreadCount;
}
