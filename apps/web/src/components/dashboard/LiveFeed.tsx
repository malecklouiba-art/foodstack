'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';

export interface FeedEvent {
  id: string;
  type: 'order_new' | 'order_status' | 'inventory_low' | 'delivery';
  message: string;
  detail?: string;
  ts: Date;
}

const TYPE_STYLE = {
  order_new:     { bg: 'bg-brand-50 dark:bg-brand-950/30',  dot: 'bg-brand-500',  text: 'text-brand-700 dark:text-brand-400' },
  order_status:  { bg: 'bg-blue-50 dark:bg-blue-950/30',   dot: 'bg-blue-500',   text: 'text-blue-700 dark:text-blue-400' },
  inventory_low: { bg: 'bg-red-50 dark:bg-red-950/30',    dot: 'bg-red-500',    text: 'text-red-700 dark:text-red-400' },
  delivery:      { bg: 'bg-green-50 dark:bg-green-950/30',  dot: 'bg-green-500',  text: 'text-green-700 dark:text-green-400' },
};

const TYPE_EMOJI = {
  order_new:     '🛎',
  order_status:  '📦',
  inventory_low: '⚠️',
  delivery:      '🛵',
};

function timeAgo(ts: Date): string {
  const s = Math.floor((Date.now() - ts.getTime()) / 1000);
  if (s < 60) return `${s}s`;
  if (s < 3600) return `${Math.floor(s / 60)}min`;
  return `${Math.floor(s / 3600)}h`;
}

interface Props {
  events: FeedEvent[];
}

export function LiveFeed({ events }: Props) {
  const [, tick] = useState(0);

  // Refresh timestamps every 30s
  useEffect(() => {
    const id = setInterval(() => tick((n) => n + 1), 30000);
    return () => clearInterval(id);
  }, []);

  return (
    <Card padding="none" className="flex h-full flex-col">
      <CardHeader className="border-b border-surface-100 px-6 py-5 dark:border-surface-700">
        <div className="flex items-center justify-between">
          <CardTitle>Activité en direct</CardTitle>
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 animate-pulse rounded-full bg-green-500" />
            <span className="text-xs font-medium text-green-700 dark:text-green-400">Live</span>
          </div>
        </div>
      </CardHeader>
      <div className="flex-1 overflow-y-auto p-4">
        {events.length === 0 && (
          <div className="flex h-32 items-center justify-center text-sm text-surface-400">
            En attente d&apos;événements…
          </div>
        )}
        <AnimatePresence mode="popLayout">
          {events.slice(0, 20).map((ev) => {
            const s = TYPE_STYLE[ev.type];
            return (
              <motion.div
                key={ev.id}
                layout
                initial={{ opacity: 0, x: -8, height: 0 }}
                animate={{ opacity: 1, x: 0, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className={`mb-2 flex items-start gap-3 rounded-xl p-3 ${s.bg}`}
              >
                <span className="text-base leading-none">{TYPE_EMOJI[ev.type]}</span>
                <div className="min-w-0 flex-1">
                  <p className={`text-xs font-semibold ${s.text}`}>{ev.message}</p>
                  {ev.detail && <p className="mt-0.5 text-xs text-surface-500 dark:text-surface-400 truncate">{ev.detail}</p>}
                </div>
                <span className="shrink-0 text-xs text-surface-400 dark:text-surface-500">{timeAgo(ev.ts)}</span>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </Card>
  );
}
