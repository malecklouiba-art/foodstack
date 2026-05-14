'use client';

import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Settings } from 'lucide-react';

export default function AdminConfigPage() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-surface-900">Configuration</h1>
        <p className="mt-1 text-sm text-surface-500">Paramètres globaux de la plateforme</p>
      </div>

      <Card padding="lg">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface-100 dark:bg-surface-800">
              <Settings className="h-5 w-5 text-surface-500" />
            </div>
            <div>
              <CardTitle>Paramètres plateforme</CardTitle>
              <CardDescription className="mt-0.5">Configuration avancée — à venir</CardDescription>
            </div>
          </div>
        </CardHeader>
        <p className="text-sm text-surface-500">
          Cette section contiendra les paramètres globaux : limites de plans, webhooks, clés API,
          configuration SMTP, intégrations tierces, et gestion des feature flags.
        </p>
      </Card>
    </div>
  );
}
