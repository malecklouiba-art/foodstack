'use client';

import { useState, useEffect, useCallback } from 'react';
import { clsx } from 'clsx';
import { CheckCircle2, AlertTriangle, XCircle, Activity } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

// ── Types ─────────────────────────────────────────────────────────────────────

interface Metric {
  tick:    number;
  cpu:     number;
  ram:     number;
  apiMs:   number;
  dbMs:    number;
}

type LogLevel = 'INFO' | 'WARN' | 'ERROR';

interface LogEntry {
  id:        string;
  timestamp: string;
  level:     LogLevel;
  service:   string;
  message:   string;
}

// ── Static demo data ──────────────────────────────────────────────────────────

const SERVICES = [
  { name: 'API Server',   uptime: '99.98%', region: 'EU-West-1',  status: 'Opérationnel' },
  { name: 'PostgreSQL',   uptime: '99.99%', region: 'EU-West-1',  status: 'Opérationnel' },
  { name: 'Redis',        uptime: '100%',   region: 'EU-West-1',  status: 'Opérationnel' },
  { name: 'CDN',          uptime: '99.95%', region: 'Global',     status: 'Opérationnel' },
  { name: 'Socket.io',    uptime: '99.92%', region: 'EU-West-1',  status: 'Opérationnel' },
];

const INITIAL_LOGS: LogEntry[] = [
  { id: 'l1', timestamp: '14:32:41', level: 'ERROR', service: 'API Server',  message: 'POST /api/orders 503 – upstream timeout (restaurant r7)' },
  { id: 'l2', timestamp: '14:28:15', level: 'WARN',  service: 'Redis',       message: 'Memory usage at 82% — consider scaling' },
  { id: 'l3', timestamp: '14:21:03', level: 'INFO',  service: 'PostgreSQL',  message: 'Auto-vacuum completed on table orders (12 340 rows)' },
  { id: 'l4', timestamp: '14:18:59', level: 'WARN',  service: 'CDN',         message: 'Cache hit rate dropped to 74% (threshold: 80%)' },
  { id: 'l5', timestamp: '14:05:27', level: 'INFO',  service: 'Socket.io',   message: 'Peak concurrent connections: 1 247' },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function rand(min: number, max: number): number {
  return Math.round((Math.random() * (max - min) + min) * 10) / 10;
}

function buildInitialHistory(): Metric[] {
  return Array.from({ length: 20 }, (_, i) => ({
    tick:  i,
    cpu:   rand(20, 45),
    ram:   rand(2.1, 2.8),
    apiMs: rand(45, 120),
    dbMs:  rand(8, 25),
  }));
}

function levelIcon(level: LogLevel) {
  if (level === 'ERROR') return <XCircle     className="h-4 w-4 text-red-500 flex-shrink-0"    />;
  if (level === 'WARN')  return <AlertTriangle className="h-4 w-4 text-yellow-500 flex-shrink-0" />;
  return                        <CheckCircle2  className="h-4 w-4 text-blue-400 flex-shrink-0"  />;
}

function levelBadge(level: LogLevel) {
  if (level === 'ERROR') return <Badge variant="danger">{level}</Badge>;
  if (level === 'WARN')  return <Badge variant="warning">{level}</Badge>;
  return                        <Badge variant="info">{level}</Badge>;
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function MonitoringPage() {
  const [history, setHistory] = useState<Metric[]>(() => buildInitialHistory());
  const [tick,    setTick]    = useState(20);

  const latest = history[history.length - 1] ?? { cpu: 0, ram: 0, apiMs: 0, dbMs: 0, tick: 0 };

  const addTick = useCallback(() => {
    setTick((t) => {
      const next = t + 1;
      const newPoint: Metric = {
        tick:  next,
        cpu:   rand(20, 45),
        ram:   rand(2.1, 2.8),
        apiMs: rand(45, 120),
        dbMs:  rand(8, 25),
      };
      setHistory((prev) => [...prev.slice(-19), newPoint]);
      return next;
    });
  }, []);

  useEffect(() => {
    const id = setInterval(addTick, 3000);
    return () => clearInterval(id);
  }, [addTick]);

  const cpuColor  = latest.cpu  > 80 ? 'text-red-500'    : latest.cpu  > 60 ? 'text-yellow-500' : 'text-green-500';
  const ramColor  = latest.ram  > 3.5 ? 'text-red-500'   : latest.ram  > 3   ? 'text-yellow-500' : 'text-green-500';
  const apiColor  = latest.apiMs > 200 ? 'text-red-500'  : latest.apiMs > 100 ? 'text-yellow-500' : 'text-green-500';
  const dbColor   = latest.dbMs  > 50  ? 'text-red-500'  : latest.dbMs  > 25  ? 'text-yellow-500' : 'text-green-500';

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-900">Monitoring</h1>
          <p className="mt-1 text-sm text-surface-500">Métriques temps réel — mise à jour toutes les 3 s</p>
        </div>
        <div className="flex items-center gap-2 rounded-xl bg-green-50 dark:bg-green-900/20 px-4 py-2">
          <Activity className="h-4 w-4 text-green-600 dark:text-green-400 animate-pulse" />
          <span className="text-sm font-medium text-green-700 dark:text-green-400">Live</span>
        </div>
      </div>

      {/* Live metric cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: 'CPU',          value: `${latest.cpu}%`,    color: cpuColor,  sub: 'Utilisation',       max: 100,  pct: latest.cpu  },
          { label: 'RAM',          value: `${latest.ram} GB`,  color: ramColor,  sub: 'sur 4 GB',          max: 4,    pct: (latest.ram / 4) * 100 },
          { label: 'API Latency',  value: `${latest.apiMs} ms`,color: apiColor,  sub: 'P95 response time', max: 500,  pct: Math.min((latest.apiMs / 500) * 100, 100) },
          { label: 'DB Latency',   value: `${latest.dbMs} ms`, color: dbColor,   sub: 'Query avg',         max: 100,  pct: Math.min((latest.dbMs / 100) * 100, 100) },
        ].map((m) => (
          <Card key={m.label} padding="lg" className="hover:shadow-md transition-shadow">
            <p className="text-xs font-medium uppercase tracking-wide text-surface-500">{m.label}</p>
            <p className={clsx('mt-2 text-3xl font-extrabold tabular-nums', m.color)}>{m.value}</p>
            <p className="mt-0.5 text-xs text-surface-400">{m.sub}</p>
            <div className="mt-3 h-1.5 w-full rounded-full bg-surface-100 dark:bg-surface-700">
              <div
                className={clsx('h-full rounded-full transition-all duration-700',
                  m.pct > 80 ? 'bg-red-500' : m.pct > 60 ? 'bg-yellow-500' : 'bg-green-500'
                )}
                style={{ width: `${Math.min(m.pct, 100)}%` }}
              />
            </div>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid gap-6 xl:grid-cols-2">
        {/* CPU chart */}
        <Card padding="none">
          <CardHeader className="border-b border-surface-100 dark:border-surface-700 px-6 py-5">
            <div>
              <CardTitle>CPU</CardTitle>
              <CardDescription className="mt-0.5">20 dernières mesures</CardDescription>
            </div>
            <span className={clsx('text-lg font-bold', cpuColor)}>{latest.cpu}%</span>
          </CardHeader>
          <div className="p-6 pt-4">
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={history} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="tick" hide />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} domain={[0, 100]} tickFormatter={(v: number) => `${v}%`} />
                <Tooltip
                  contentStyle={{ background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, fontSize: 12 }}
                  formatter={(value: number) => [`${value}%`, 'CPU']}
                  labelFormatter={() => ''}
                />
                <Line type="monotone" dataKey="cpu" stroke="#1EFF6A" strokeWidth={2} dot={false} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* RAM + Latency chart */}
        <Card padding="none">
          <CardHeader className="border-b border-surface-100 dark:border-surface-700 px-6 py-5">
            <div>
              <CardTitle>RAM & Latence</CardTitle>
              <CardDescription className="mt-0.5">API ms (gauche) · RAM GB (droite)</CardDescription>
            </div>
          </CardHeader>
          <div className="p-6 pt-4">
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={history} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="tick" hide />
                <YAxis yAxisId="api" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} tickFormatter={(v: number) => `${v}ms`} />
                <YAxis yAxisId="ram" orientation="right" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} domain={[0, 4]} tickFormatter={(v: number) => `${v}G`} />
                <Tooltip
                  contentStyle={{ background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, fontSize: 12 }}
                  formatter={(value: number, name: string) => name === 'apiMs' ? [`${value}ms`, 'API'] : [`${value}GB`, 'RAM']}
                  labelFormatter={() => ''}
                />
                <Legend iconSize={10} iconType="circle" wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
                <Line yAxisId="api" type="monotone" dataKey="apiMs" name="API (ms)" stroke="#60a5fa" strokeWidth={1.5} dot={false} isAnimationActive={false} />
                <Line yAxisId="ram" type="monotone" dataKey="ram"   name="RAM (GB)" stroke="#a78bfa" strokeWidth={1.5} dot={false} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Services table */}
      <Card padding="none">
        <CardHeader className="border-b border-surface-100 dark:border-surface-700 px-6 py-5">
          <CardTitle>Services</CardTitle>
          <Badge variant="success" dot>5 / 5 opérationnels</Badge>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-surface-100 dark:border-surface-700">
                {['Service', 'Région', 'Uptime', 'Statut'].map((h) => (
                  <th key={h} className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-surface-500">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-100 dark:divide-surface-700">
              {SERVICES.map((svc) => (
                <tr key={svc.name} className="hover:bg-surface-50 dark:hover:bg-surface-800/40 transition-colors">
                  <td className="px-6 py-4 font-medium text-surface-900">{svc.name}</td>
                  <td className="px-6 py-4 text-surface-500">{svc.region}</td>
                  <td className="px-6 py-4 font-medium text-surface-900">{svc.uptime}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-green-500" />
                      <span className="text-sm text-green-600 dark:text-green-400">{svc.status}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Error logs */}
      <Card padding="none">
        <CardHeader className="border-b border-surface-100 dark:border-surface-700 px-6 py-5">
          <CardTitle>Logs récents</CardTitle>
          <span className="text-sm text-surface-400">Aujourd'hui</span>
        </CardHeader>
        <div className="divide-y divide-surface-100 dark:divide-surface-700">
          {INITIAL_LOGS.map((log) => (
            <div key={log.id} className="flex items-start gap-4 px-6 py-4 hover:bg-surface-50 dark:hover:bg-surface-800/40 transition-colors">
              {levelIcon(log.level)}
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-0.5">
                  {levelBadge(log.level)}
                  <span className="text-xs font-medium text-surface-600 dark:text-surface-400">{log.service}</span>
                </div>
                <p className="text-sm text-surface-700 dark:text-surface-300 font-mono">{log.message}</p>
              </div>
              <span className="flex-shrink-0 text-xs text-surface-400 font-mono">{log.timestamp}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
