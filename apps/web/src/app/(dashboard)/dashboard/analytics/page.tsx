'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { motion } from 'framer-motion';
import {
  TrendingUp, TrendingDown, Euro, ShoppingBag, Users, Star,
  Clock, Download, FileSpreadsheet, FileText, ChevronDown,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import api from '@/lib/api';
import { useAuthStore } from '@/store/auth';

const PERIODS = ['7 jours', '30 jours', '3 mois'] as const;
type Period = typeof PERIODS[number];

const PERIOD_DAYS: Record<Period, number> = { '7 jours': 7, '30 jours': 30, '3 mois': 90 };

const TYPE_COLORS: Record<string, string> = {
  delivery: '#f97316',
  pickup: '#60a5fa',
  dine_in: '#34d399',
};
const TYPE_LABELS: Record<string, string> = {
  delivery: 'Livraison',
  pickup: 'À emporter',
  dine_in: 'Sur place',
};

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: { value: number; name: string }[]; label?: string }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 p-3 shadow-lg text-sm">
      <p className="mb-1.5 font-semibold text-surface-500 dark:text-surface-400">{label}</p>
      {payload.map((p) => (
        <p key={p.name} className="font-bold text-surface-900 dark:text-surface-50">
          {p.name === 'revenue' ? `${Number(p.value).toLocaleString('fr-FR')} €` : `${p.value} cmd`}
        </p>
      ))}
    </div>
  );
};

export default function AnalyticsPage() {
  const { user } = useAuthStore();
  const restaurantId = user?.restaurantIds?.[0];

  const [period, setPeriod] = useState<Period>('7 jours');
  const [exportOpen, setExportOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const [kpis, setKpis] = useState<{ revenue: number; orders: number; avgBasket: number; uniqueCustomers: number; revenueChange: number; ordersChange: number } | null>(null);
  const [revenueSeries, setRevenueSeries] = useState<{ label: string; revenue: number; orders: number }[]>([]);
  const [hourly, setHourly] = useState<{ hour: string; orders: number }[]>([]);
  const [orderTypes, setOrderTypes] = useState<{ type: string; count: number; percent: number }[]>([]);
  const [topItems, setTopItems] = useState<{ menuItemId: string; name: string; price: number; totalQuantity: number; totalRevenue: number }[]>([]);

  const fetchAll = useCallback(async () => {
    if (!restaurantId) return;
    setLoading(true);
    const days = PERIOD_DAYS[period];
    const from = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const to = new Date().toISOString().slice(0, 10);

    try {
      const [kpiRes, seriesRes, hourlyRes, typesRes, itemsRes] = await Promise.allSettled([
        api.get(`/analytics/${restaurantId}/kpis`),
        api.get(`/analytics/${restaurantId}/revenue-series?from=${from}&to=${to}`),
        api.get(`/analytics/${restaurantId}/hourly`),
        api.get(`/analytics/${restaurantId}/order-types?from=${from}&to=${to}`),
        api.get(`/analytics/${restaurantId}/top-items?limit=5`),
      ]);

      if (kpiRes.status === 'fulfilled') setKpis(kpiRes.value as unknown as typeof kpis);
      if (seriesRes.status === 'fulfilled') {
        const raw = seriesRes.value as unknown as { date: string; revenue: number; orders: number }[];
        setRevenueSeries(raw.map((r) => ({ label: new Date(r.date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }), revenue: r.revenue, orders: r.orders })));
      }
      if (hourlyRes.status === 'fulfilled') {
        const raw = hourlyRes.value as unknown as { hour: number; orders: number }[];
        setHourly(raw.map((r) => ({ hour: `${r.hour}h`, orders: r.orders })));
      }
      if (typesRes.status === 'fulfilled') setOrderTypes(typesRes.value as unknown as typeof orderTypes);
      if (itemsRes.status === 'fulfilled') setTopItems(itemsRes.value as unknown as typeof topItems);
    } finally {
      setLoading(false);
    }
  }, [restaurantId, period]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const totalRevenue = kpis?.revenue ?? revenueSeries.reduce((s, d) => s + d.revenue, 0);
  const totalOrders = kpis?.orders ?? revenueSeries.reduce((s, d) => s + d.orders, 0);
  const avgBasket = kpis?.avgBasket ?? (totalOrders > 0 ? totalRevenue / totalOrders : 0);
  const revenueChange = kpis?.revenueChange ?? 0;
  const ordersChange = kpis?.ordersChange ?? 0;

  const exportUrl = (type: 'pdf' | 'excel', resource: 'orders' | 'inventory') => {
    const days = PERIOD_DAYS[period];
    const from = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const to = new Date().toISOString().slice(0, 10);
    const base = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';
    if (resource === 'inventory') return `${base}/export/${restaurantId}/inventory/excel`;
    return `${base}/export/${restaurantId}/orders/${type === 'pdf' ? 'pdf' : 'excel'}?from=${from}&to=${to}`;
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-50">Analytiques</h1>
          <p className="mt-1 text-sm text-surface-500 dark:text-surface-400">Performances de votre restaurant</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex gap-1 rounded-xl border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800 p-1">
            {PERIODS.map((p) => (
              <button key={p} onClick={() => setPeriod(p)}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${period === p ? 'bg-white dark:bg-surface-700 text-surface-900 dark:text-surface-50 shadow-sm' : 'text-surface-500 dark:text-surface-400 hover:text-surface-700 dark:hover:text-surface-200'}`}>
                {p}
              </button>
            ))}
          </div>

          {/* Export dropdown */}
          {restaurantId && (
            <div className="relative">
              <Button variant="ghost" size="sm" icon={<Download className="h-4 w-4" />}
                onClick={() => setExportOpen((o) => !o)}>
                Exporter <ChevronDown className="ml-1 h-3 w-3" />
              </Button>
              {exportOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setExportOpen(false)} />
                  <div className="absolute right-0 top-full z-20 mt-1 w-52 rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 shadow-lg py-1">
                    <a href={exportUrl('pdf', 'orders')} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-2.5 px-3 py-2 text-sm text-surface-700 dark:text-surface-300 hover:bg-surface-50 dark:hover:bg-surface-700"
                      onClick={() => setExportOpen(false)}>
                      <FileText className="h-4 w-4 text-red-500" />
                      Commandes PDF
                    </a>
                    <a href={exportUrl('excel', 'orders')} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-2.5 px-3 py-2 text-sm text-surface-700 dark:text-surface-300 hover:bg-surface-50 dark:hover:bg-surface-700"
                      onClick={() => setExportOpen(false)}>
                      <FileSpreadsheet className="h-4 w-4 text-green-600" />
                      Commandes Excel
                    </a>
                    <div className="my-1 border-t border-surface-100 dark:border-surface-700" />
                    <a href={exportUrl('excel', 'inventory')} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-2.5 px-3 py-2 text-sm text-surface-700 dark:text-surface-300 hover:bg-surface-50 dark:hover:bg-surface-700"
                      onClick={() => setExportOpen(false)}>
                      <FileSpreadsheet className="h-4 w-4 text-blue-500" />
                      Inventaire Excel
                    </a>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Loading bar */}
      {loading && (
        <div className="h-0.5 w-full overflow-hidden rounded-full bg-surface-100 dark:bg-surface-800">
          <div className="h-full w-1/3 animate-[slide_1.2s_ease-in-out_infinite] rounded-full bg-brand-500" />
        </div>
      )}

      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { label: "Chiffre d'affaires", value: `${totalRevenue.toLocaleString('fr-FR')} €`, change: revenueChange, icon: Euro, color: 'bg-brand-100 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400' },
          { label: 'Commandes', value: totalOrders.toLocaleString('fr-FR'), change: ordersChange, icon: ShoppingBag, color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' },
          { label: 'Panier moyen', value: `${avgBasket.toFixed(2)} €`, change: null, icon: TrendingUp, color: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' },
          { label: 'Clients uniques', value: kpis?.uniqueCustomers?.toString() ?? '—', change: null, icon: Users, color: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400' },
        ].map((kpi, i) => (
          <motion.div key={kpi.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className="rounded-2xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 p-5 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${kpi.color}`}>
                <kpi.icon className="h-4 w-4" />
              </div>
              {kpi.change !== null && (
                <span className={`flex items-center gap-1 text-xs font-semibold ${kpi.change >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                  {kpi.change >= 0 ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
                  {kpi.change >= 0 ? '+' : ''}{kpi.change}%
                </span>
              )}
            </div>
            <p className="text-2xl font-bold text-surface-900 dark:text-surface-50">{kpi.value}</p>
            <p className="mt-0.5 text-sm text-surface-500 dark:text-surface-400">{kpi.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Revenue chart */}
      <div className="rounded-2xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 p-6 shadow-sm">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="font-semibold text-surface-900 dark:text-surface-50">Revenus & Commandes</h2>
          <span className="flex items-center gap-1.5 text-xs text-surface-500 dark:text-surface-400">
            <span className="h-2.5 w-2.5 rounded-full bg-brand-500" /> Revenus
          </span>
        </div>
        <ResponsiveContainer width="100%" height={240}>
          <AreaChart data={revenueSeries} margin={{ top: 5, right: 0, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f97316" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" />
            <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#71717a' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: '#71717a' }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}€`} />
            <Tooltip content={<CustomTooltip />} />
            <Area type="monotone" dataKey="revenue" name="revenue" stroke="#f97316" strokeWidth={2} fill="url(#grad)" dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        {/* Commandes par heure */}
        <div className="rounded-2xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <Clock className="h-4 w-4 text-brand-500" />
            <h2 className="font-semibold text-surface-900 dark:text-surface-50">Commandes par heure</h2>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={hourly} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" vertical={false} />
              <XAxis dataKey="hour" tick={{ fontSize: 10, fill: '#71717a' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#71717a' }} axisLine={false} tickLine={false} />
              <Tooltip cursor={{ fill: '#f4f4f5' }} contentStyle={{ borderRadius: '12px', border: '1px solid #e4e4e7', fontSize: 12 }} />
              <Bar dataKey="orders" name="Commandes" fill="#f97316" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Répartition par type */}
        <div className="rounded-2xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 p-6 shadow-sm">
          <h2 className="mb-4 font-semibold text-surface-900 dark:text-surface-50">Répartition par type</h2>
          {orderTypes.length > 0 ? (
            <div className="flex items-center gap-6">
              <ResponsiveContainer width={160} height={160}>
                <PieChart>
                  <Pie data={orderTypes} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="percent">
                    {orderTypes.map((entry) => (
                      <Cell key={entry.type} fill={TYPE_COLORS[entry.type] ?? '#e4e4e7'} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-3">
                {orderTypes.map((t) => (
                  <div key={t.type} className="flex items-center gap-2.5">
                    <span className="h-3 w-3 rounded-full flex-shrink-0" style={{ background: TYPE_COLORS[t.type] ?? '#e4e4e7' }} />
                    <span className="text-sm text-surface-700 dark:text-surface-300">{TYPE_LABELS[t.type] ?? t.type}</span>
                    <span className="ml-auto text-sm font-bold text-surface-900 dark:text-surface-50">{t.percent}%</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-sm text-surface-400 dark:text-surface-500">Aucune donnée disponible</p>
          )}
        </div>
      </div>

      {/* Top articles */}
      <div className="rounded-2xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-semibold text-surface-900 dark:text-surface-50">Articles les plus vendus</h2>
          <Badge variant="default" size="sm">Cette période</Badge>
        </div>
        {topItems.length > 0 ? (
          <div className="space-y-3">
            {topItems.map((item, i) => (
              <div key={item.menuItemId} className="flex items-center gap-4">
                <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-surface-100 dark:bg-surface-800 text-xs font-bold text-surface-500 dark:text-surface-400">
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-surface-900 dark:text-surface-50 truncate">{item.name}</p>
                  </div>
                  <div className="mt-1 flex items-center gap-3">
                    <div className="flex-1 h-1.5 overflow-hidden rounded-full bg-surface-100 dark:bg-surface-800">
                      <div className="h-full rounded-full bg-brand-400"
                        style={{ width: `${topItems[0].totalQuantity > 0 ? (item.totalQuantity / topItems[0].totalQuantity) * 100 : 0}%` }} />
                    </div>
                    <span className="text-xs text-surface-400 dark:text-surface-500 w-16 text-right">{item.totalQuantity} cmd</span>
                    <span className="text-xs font-semibold text-surface-700 dark:text-surface-300 w-20 text-right">{item.totalRevenue.toLocaleString('fr-FR')} €</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-surface-400 dark:text-surface-500">
            {restaurantId ? 'Aucune vente sur cette période' : 'Connectez-vous pour voir les données'}
          </p>
        )}
      </div>

      {/* Customer stats from KPI */}
      <div className="rounded-2xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 p-6 shadow-sm">
        <h2 className="mb-4 font-semibold text-surface-900 dark:text-surface-50">Clients</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            { label: 'Clients uniques', value: kpis?.uniqueCustomers?.toLocaleString('fr-FR') ?? '—', icon: Users },
            { label: 'Panier moyen', value: `${avgBasket.toFixed(2)} €`, icon: Euro },
            { label: 'Total commandes', value: totalOrders.toLocaleString('fr-FR'), icon: ShoppingBag },
            { label: 'Revenus période', value: `${totalRevenue.toLocaleString('fr-FR')} €`, icon: Star },
          ].map(({ label, value, icon: Icon }) => (
            <div key={label} className="rounded-xl bg-surface-50 dark:bg-surface-800 p-4">
              <div className="mb-2">
                <Icon className="h-4 w-4 text-surface-400 dark:text-surface-500" />
              </div>
              <p className="text-xl font-bold text-surface-900 dark:text-surface-50">{value}</p>
              <p className="mt-0.5 text-xs text-surface-500 dark:text-surface-400">{label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
