'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Activity, Server, Database, Zap, AlertTriangle,
  CheckCircle2, Clock, RefreshCw, Cpu, HardDrive,
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from 'recharts';

const LATENCY_DATA = Array.from({ length: 20 }, (_, i) => ({
  t: `${i}s`,
  api: Math.floor(30 + Math.random() * 80),
  db: Math.floor(5 + Math.random() * 20),
}));

const LOG_ENTRIES = [
  { level: 'info', message: 'POST /payments/webhook — 200 OK — 38ms', time: '14:23:01' },
  { level: 'info', message: 'GET /menu?restaurantId=r3 — 200 OK — 22ms', time: '14:22:58' },
  { level: 'warn', message: 'Redis memory usage exceeded 75% threshold', time: '14:22:45' },
  { level: 'info', message: 'Socket event emitted: order:status — room order:o42', time: '14:22:40' },
  { level: 'error', message: 'Stripe webhook retry failed (attempt 3/3) — paymentIntent pi_xxx', time: '14:22:30' },
  { level: 'info', message: 'POST /orders — 201 Created — 145ms', time: '14:22:15' },
  { level: 'info', message: 'User login — userId u188 — 200 OK', time: '14:22:08' },
  { level: 'warn', message: 'Slow query detected: 850ms on orders table', time: '14:21:55' },
  { level: 'info', message: 'GET /analytics/revenue — 200 OK — 94ms', time: '14:21:40' },
  { level: 'info', message: 'Prisma health check — OK', time: '14:21:30' },
];

const SERVICES = [
  { name: 'API NestJS', status: 'up', uptime: '99.98%', latency: '42ms', icon: Server },
  { name: 'PostgreSQL', status: 'up', uptime: '100%', latency: '8ms', icon: Database },
  { name: 'Redis', status: 'degraded', uptime: '99.91%', latency: '3ms', icon: Zap },
  { name: 'Socket.io', status: 'up', uptime: '99.95%', latency: '12ms', icon: Activity },
  { name: 'Stripe Webhooks', status: 'down', uptime: '98.2%', latency: '—', icon: AlertTriangle },
  { name: 'Supabase Auth', status: 'up', uptime: '99.99%', latency: '65ms', icon: CheckCircle2 },
];

const STATUS_STYLE: Record<string, { dot: string; label: string }> = {
  up: { dot: 'bg-green-500', label: 'Opérationnel' },
  degraded: { dot: 'bg-yellow-400', label: 'Dégradé' },
  down: { dot: 'bg-red-500', label: 'En panne' },
};

export default function MonitoringPage() {
  const [tick, setTick] = useState(0);
  const [cpu, setCpu] = useState(34);
  const [ram, setRam] = useState(61);

  useEffect(() => {
    const interval = setInterval(() => {
      setTick((t) => t + 1);
      setCpu((v) => Math.max(10, Math.min(95, v + Math.round((Math.random() - 0.5) * 8))));
      setRam((v) => Math.max(40, Math.min(90, v + Math.round((Math.random() - 0.5) * 4))));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-900">Monitoring</h1>
          <p className="mt-1 text-sm text-surface-500">Infrastructure en temps réel</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-surface-500">
          <motion.div
            animate={{ opacity: [1, 0.3, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="h-2 w-2 rounded-full bg-green-500"
          />
          Mise à jour toutes les 3s
        </div>
      </div>

      {/* System metrics */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { label: 'CPU', value: cpu, icon: Cpu, color: cpu > 80 ? 'text-red-500' : cpu > 60 ? 'text-yellow-500' : 'text-green-600', unit: '%' },
          { label: 'RAM', value: ram, icon: HardDrive, color: ram > 80 ? 'text-red-500' : ram > 60 ? 'text-yellow-500' : 'text-green-600', unit: '%' },
          { label: 'Connexions DB', value: 12, icon: Database, color: 'text-blue-600', unit: '/100' },
          { label: 'Sockets actifs', value: 38, icon: Activity, color: 'text-purple-600', unit: '' },
        ].map((m, i) => (
          <motion.div
            key={m.label}
            animate={{ opacity: 1 }}
            transition={{ delay: i * 0.05 }}
            className="rounded-2xl border border-surface-200 bg-white p-5 shadow-sm"
          >
            <div className="mb-2 flex items-center justify-between">
              <m.icon className="h-4 w-4 text-surface-400" />
              <span className={`text-xs font-semibold ${m.color}`}>{m.value}{m.unit}</span>
            </div>
            <div className="mb-1 h-1.5 overflow-hidden rounded-full bg-surface-100">
              <motion.div
                animate={{ width: `${Math.min(100, (m.value / (m.unit === '/100' ? 100 : m.unit === '%' ? 100 : 50)) * 100)}%` }}
                transition={{ duration: 0.5 }}
                className={`h-full rounded-full ${
                  m.unit === '%' && m.value > 80 ? 'bg-red-500' :
                  m.unit === '%' && m.value > 60 ? 'bg-yellow-400' : 'bg-green-500'
                }`}
              />
            </div>
            <p className="text-xs text-surface-500">{m.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Latency chart & services */}
      <div className="grid gap-5 lg:grid-cols-2">
        <div className="rounded-2xl border border-surface-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 font-semibold text-surface-900">Latence API & DB (20 dernières secondes)</h2>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={LATENCY_DATA} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" />
              <XAxis dataKey="t" tick={{ fontSize: 10, fill: '#71717a' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#71717a' }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}ms`} />
              <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e4e4e7', fontSize: 12 }} />
              <Line type="monotone" dataKey="api" name="API" stroke="#f97316" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="db" name="DB" stroke="#60a5fa" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
          <div className="mt-2 flex gap-4 text-xs text-surface-500">
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-brand-500" /> API NestJS</span>
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-blue-400" /> PostgreSQL</span>
          </div>
        </div>

        <div className="rounded-2xl border border-surface-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 font-semibold text-surface-900">Services</h2>
          <div className="space-y-3">
            {SERVICES.map((svc) => {
              const st = STATUS_STYLE[svc.status];
              return (
                <div key={svc.name} className="flex items-center gap-3">
                  <div className={`h-2.5 w-2.5 rounded-full flex-shrink-0 ${st.dot}`} />
                  <svc.icon className="h-4 w-4 flex-shrink-0 text-surface-400" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-surface-900">{svc.name}</p>
                  </div>
                  <span className="text-xs text-surface-400">{svc.latency}</span>
                  <span className="text-xs text-surface-400">{svc.uptime}</span>
                  <span className={`text-xs font-medium ${svc.status === 'up' ? 'text-green-600' : svc.status === 'degraded' ? 'text-yellow-600' : 'text-red-500'}`}>
                    {st.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Logs */}
      <div className="rounded-2xl border border-surface-200 bg-white shadow-sm overflow-hidden">
        <div className="flex items-center justify-between border-b border-surface-100 px-6 py-4">
          <h2 className="font-semibold text-surface-900">Logs récents</h2>
          <button className="flex items-center gap-1.5 text-xs text-brand-600 hover:underline">
            <RefreshCw className="h-3 w-3" /> Actualiser
          </button>
        </div>
        <div className="divide-y divide-surface-50 font-mono text-xs">
          {LOG_ENTRIES.map((log, i) => (
            <div key={i} className={`flex items-start gap-3 px-6 py-2.5 ${
              log.level === 'error' ? 'bg-red-50' :
              log.level === 'warn' ? 'bg-yellow-50' : ''
            }`}>
              <div className="flex items-center gap-2 flex-shrink-0 w-32">
                <Clock className="h-3 w-3 text-surface-300" />
                <span className="text-surface-400">{log.time}</span>
              </div>
              <span className={`w-12 flex-shrink-0 font-bold uppercase ${
                log.level === 'error' ? 'text-red-500' :
                log.level === 'warn' ? 'text-yellow-600' :
                'text-green-600'
              }`}>
                {log.level}
              </span>
              <span className="text-surface-700 leading-relaxed">{log.message}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
