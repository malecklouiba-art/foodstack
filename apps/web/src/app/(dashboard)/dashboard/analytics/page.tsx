'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp, TrendingDown, Users, ShoppingBag, Euro,
  Download, FileText, Store, CreditCard, BarChart2,
} from 'lucide-react';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { useGSAPReveal } from '@/hooks/useGSAPReveal';
import { AIInsights } from '@/components/analytics/AIInsights';
import { useAuthStore } from '@/store/auth';
import api from '@/lib/api';
import type {} from 'jspdf-autotable';

// ── Constants ──────────────────────────────────────────────────────────────────

const PERIODS = ['7j', '30j', '90j', 'Année'];

// Maps UI period index → API period param
const PERIOD_API_MAP: Record<number, 'day' | 'week' | 'month'> = {
  0: 'week',
  1: 'month',
  2: 'month',
  3: 'month',
};

const PIE_COLORS = ['#1EFF6A', '#42ff7b', '#70ff98', '#abffbe'];

const DAYS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
const HOURS = ['8h', '10h', '12h', '14h', '16h', '18h', '20h', '22h'];

// ── Types ──────────────────────────────────────────────────────────────────────

interface RevenuePoint {
  day: string;
  revenue: number;
  objectif: number;
}

interface TopItem {
  rank: number;
  name: string;
  sold: number;
  revenue: number;
  change: number;
  up: boolean;
}

interface KpiCard {
  title: string;
  value: string;
  change: string;
  positive: boolean;
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
}

// ── API response types ─────────────────────────────────────────────────────────

interface ApiSalesData {
  revenue: number;
  orderCount: number;
  avgOrderValue: number;
}

interface ApiRevenuePoint {
  date: string;
  amount: number;
}

interface ApiTopItem {
  id: string;
  name: string;
  soldCount: number;
  price: number;
  rating?: number;
}

interface ApiDeliveryStats {
  totalDeliveries: number;
  onTimeDeliveries: number;
  onTimeRate: number;
  avgDistance: number;
}

// ── Static data (kept for admin/platform view) ─────────────────────────────────

const PIE_DATA = [
  { name: 'Plats principaux', value: 45 },
  { name: 'Entrées',          value: 20 },
  { name: 'Desserts',         value: 18 },
  { name: 'Boissons',         value: 17 },
];

const HEATMAP: Record<string, number[]> = {
  Lun: [2, 4, 18, 12,  8, 10, 14,  5],
  Mar: [1, 3, 20, 14,  9, 11, 16,  4],
  Mer: [3, 5, 22, 15, 10, 12, 17,  6],
  Jeu: [2, 4, 25, 16, 11, 13, 18,  7],
  Ven: [4, 6, 38, 20, 14, 17, 28, 10],
  Sam: [5, 8, 42, 24, 18, 20, 35, 14],
  Dim: [6, 9, 40, 22, 16, 18, 30, 12],
};

const MAX_HEATMAP = 42;

// ── Platform (admin) data — no dedicated API yet, kept as static ───────────────

const PLATFORM_KPI = [
  { title: 'CA Plateforme',           value: '248 600€', change: '+21.4%', positive: true,  icon: Euro,        iconBg: 'bg-green-50',   iconColor: 'text-green-600',   desc: 'Somme des abonnements' },
  { title: 'Restaurants actifs',      value: '1 342',    change: '+8.3%',  positive: true,  icon: Store,       iconBg: 'bg-brand-50',   iconColor: 'text-brand-600',   desc: 'Abonnés actifs' },
  { title: 'Clients consommateurs',   value: '84 210',   change: '+15.7%', positive: true,  icon: Users,       iconBg: 'bg-blue-50',    iconColor: 'text-blue-600',    desc: 'Utilisateurs finaux' },
  { title: 'MRR',                     value: '62 150€',  change: '+11.2%', positive: true,  icon: CreditCard,  iconBg: 'bg-purple-50',  iconColor: 'text-purple-600',  desc: 'Monthly Recurring Revenue' },
  { title: 'Croissance MoM',          value: '+11.2%',   change: 'vs mois préc.', positive: true, icon: BarChart2, iconBg: 'bg-orange-50', iconColor: 'text-orange-600', desc: 'Growth rate mensuel' },
];

// 12-month MRR data
const MRR_DATA = [
  { month: 'Jun 25', mrr: 38200 },
  { month: 'Jul 25', mrr: 40500 },
  { month: 'Aoû 25', mrr: 41800 },
  { month: 'Sep 25', mrr: 43600 },
  { month: 'Oct 25', mrr: 46200 },
  { month: 'Nov 25', mrr: 48900 },
  { month: 'Déc 25', mrr: 51400 },
  { month: 'Jan 26', mrr: 54100 },
  { month: 'Fév 26', mrr: 56800 },
  { month: 'Mar 26', mrr: 58700 },
  { month: 'Avr 26', mrr: 60300 },
  { month: 'Mai 26', mrr: 62150 },
];

// ── Helpers ────────────────────────────────────────────────────────────────────

function parseCookieRole(): string {
  if (typeof document === 'undefined') return 'owner';
  const match = document.cookie
    .split(';')
    .map((c) => c.trim())
    .find((c) => c.startsWith('fs_demo='));
  return match ? match.split('=')[1]?.trim() ?? 'owner' : 'owner';
}

// ── Custom tooltips ────────────────────────────────────────────────────────────

function AreaTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string }>; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-surface-200 bg-white px-3 py-2 shadow-md">
      <p className="mb-1 text-xs font-medium text-surface-500">{label}</p>
      {payload.map((p) => (
        <p key={p.name} className="text-sm font-bold" style={{ color: p.color }}>
          {p.name === 'objectif' ? 'Objectif' : 'CA'}: {p.value.toLocaleString('fr-FR')}€
        </p>
      ))}
    </div>
  );
}

function MrrTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-surface-200 bg-white px-3 py-2 shadow-md">
      <p className="mb-1 text-xs font-medium text-surface-500">{label}</p>
      <p className="text-sm font-bold text-[#1EFF6A]">MRR: {payload[0].value.toLocaleString('fr-FR')}€</p>
    </div>
  );
}

// ── Admin view ─────────────────────────────────────────────────────────────────

function AdminAnalytics({ onExportCSV, onExportPDF, onExportXLSX }: { onExportCSV: () => void; onExportPDF: () => void; onExportXLSX: () => void }) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-surface-900">Analytique Plateforme FoodStack</h1>
          <p className="mt-1 text-sm text-surface-500">Vue globale · Tous les restaurants et consommateurs</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={onExportCSV}
            className="flex items-center gap-2 rounded-xl border border-surface-200 bg-white px-4 py-2.5 text-sm font-medium text-surface-700 hover:bg-surface-50 transition-colors"
          >
            <Download className="h-4 w-4 text-surface-400" />
            CSV
          </button>
          <button
            onClick={onExportXLSX}
            className="flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-4 py-2.5 text-sm font-medium text-green-700 hover:bg-green-100 transition-colors"
          >
            <Download className="h-4 w-4 text-green-500" />
            Excel
          </button>
          <button
            onClick={onExportPDF}
            className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors"
            style={{ backgroundColor: '#1EFF6A', color: '#000' }}
          >
            <FileText className="h-4 w-4" />
            PDF
          </button>
        </div>
      </div>

      {/* Platform KPI cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {PLATFORM_KPI.map((kpi, i) => {
          const Icon = kpi.icon;
          return (
            <motion.div
              key={kpi.title}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}
              className="gsap-card"
            >
              <Card padding="lg" className="hover:shadow-md transition-shadow">
                <div className={`mb-3 inline-flex rounded-xl p-2.5 ${kpi.iconBg}`}>
                  <Icon className={`h-5 w-5 ${kpi.iconColor}`} />
                </div>
                <p className="text-xs font-medium text-surface-500">{kpi.title}</p>
                <p className="mt-1 text-2xl font-bold text-surface-900">{kpi.value}</p>
                <p className={`mt-1 flex items-center gap-1 text-xs font-medium ${kpi.positive ? 'text-green-600' : 'text-red-500'}`}>
                  {kpi.positive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                  {kpi.change}
                </p>
                <p className="mt-0.5 text-[10px] text-surface-400">{kpi.desc}</p>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* AI Insights */}
      <AIInsights
        scope="admin"
        period="12 mois"
        kpis={PLATFORM_KPI.map((k) => ({ title: k.title, value: k.value, change: k.change }))}
      />

      {/* 12-month MRR chart */}
      <Card padding="lg" className="gsap-card">
        <CardHeader>
          <CardTitle>MRR — 12 derniers mois</CardTitle>
          <span className="text-sm text-surface-400">Monthly Recurring Revenue</span>
        </CardHeader>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={MRR_DATA} margin={{ top: 8, right: 8, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="mrrGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#1EFF6A" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#1EFF6A" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k€`} />
            <Tooltip content={<MrrTooltip />} />
            <Area
              type="monotone"
              dataKey="mrr"
              stroke="#1EFF6A"
              strokeWidth={2.5}
              fill="url(#mrrGrad)"
              dot={{ fill: '#1EFF6A', r: 4, strokeWidth: 0 }}
              activeDot={{ r: 6, fill: '#1EFF6A' }}
            />
          </AreaChart>
        </ResponsiveContainer>
        <div className="mt-3 flex items-center gap-4 text-xs text-surface-500">
          <div className="flex items-center gap-2">
            <div className="h-0.5 w-6 rounded" style={{ backgroundColor: '#1EFF6A' }} />
            <span>MRR (€)</span>
          </div>
          <span className="text-surface-400">·</span>
          <span>Croissance juin 25 → mai 26 : <strong className="text-surface-700">+62.7%</strong></span>
        </div>
      </Card>

      {/* Bottom row: subscriptions breakdown + growth */}
      <div className="grid gap-6 xl:grid-cols-2">
        <Card padding="lg" className="gsap-card">
          <CardHeader>
            <CardTitle>Répartition abonnements</CardTitle>
          </CardHeader>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={[
                { name: 'Starter',     value: 42 },
                { name: 'Pro',         value: 35 },
                { name: 'Enterprise',  value: 23 },
              ]} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={3} dataKey="value">
                {['#1EFF6A', '#42ff7b', '#abffbe'].map((c, i) => <Cell key={i} fill={c} />)}
              </Pie>
              <Tooltip formatter={(v: number) => [`${v}%`, '']} />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-2 space-y-1.5">
            {[['Starter', '42%', '#1EFF6A'], ['Pro', '35%', '#42ff7b'], ['Enterprise', '23%', '#abffbe']].map(([label, val, color]) => (
              <div key={label} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
                  <span className="text-surface-600">{label}</span>
                </div>
                <span className="font-semibold text-surface-900">{val}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card padding="lg" className="gsap-card">
          <CardHeader>
            <CardTitle>Restaurants — top pays</CardTitle>
          </CardHeader>
          <div className="space-y-4 mt-1">
            {[
              { country: 'France',     count: 682, pct: 51 },
              { country: 'Belgique',   count: 284, pct: 21 },
              { country: 'Suisse',     count: 188, pct: 14 },
              { country: 'Canada',     count: 108, pct: 8  },
              { country: 'Autres',     count: 80,  pct: 6  },
            ].map((r) => (
              <div key={r.country}>
                <div className="mb-1 flex justify-between text-sm">
                  <span className="font-medium text-surface-800">{r.country}</span>
                  <span className="text-surface-500">{r.count} restaurants</span>
                </div>
                <div className="h-2 w-full rounded-full bg-surface-100">
                  <div className="h-full rounded-full transition-all" style={{ width: `${r.pct}%`, backgroundColor: '#1EFF6A' }} />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

// ── Owner view ────────────────────────────────────────────────────────────────

function OwnerAnalytics({ period, setPeriod, onExportCSV, onExportPDF, onExportXLSX, salesData, revenueData, topItems, deliveryStats, loading }: {
  period: number;
  setPeriod: (i: number) => void;
  onExportCSV: () => void;
  onExportPDF: () => void;
  onExportXLSX: () => void;
  salesData: ApiSalesData | null;
  revenueData: ApiRevenuePoint[];
  topItems: ApiTopItem[];
  deliveryStats: ApiDeliveryStats | null;
  loading: boolean;
}) {
  // Derive KPI cards from live API data
  const kpiCards: KpiCard[] = [
    {
      title: 'Chiffre d\'affaires',
      value: salesData ? `${salesData.revenue.toLocaleString('fr-FR')}€` : '—',
      change: '—',
      positive: true,
      icon: Euro,
      iconBg: 'bg-green-50',
      iconColor: 'text-green-600',
    },
    {
      title: 'Commandes',
      value: salesData ? String(salesData.orderCount) : '—',
      change: '—',
      positive: true,
      icon: ShoppingBag,
      iconBg: 'bg-brand-50',
      iconColor: 'text-brand-600',
    },
    {
      title: 'Panier moyen',
      value: salesData ? `${salesData.avgOrderValue.toFixed(2)}€` : '—',
      change: '—',
      positive: true,
      icon: CreditCard,
      iconBg: 'bg-purple-50',
      iconColor: 'text-purple-600',
    },
    {
      title: 'Livraisons à l\'heure',
      value: deliveryStats ? `${deliveryStats.onTimeRate.toFixed(0)}%` : '—',
      change: '—',
      positive: true,
      icon: Users,
      iconBg: 'bg-blue-50',
      iconColor: 'text-blue-600',
    },
  ];

  // Map API revenue data to chart format (use date label as day)
  const revenueChartData: RevenuePoint[] = revenueData.map((p) => ({
    day: new Date(p.date).toLocaleDateString('fr-FR', { weekday: 'short' }),
    revenue: p.amount,
    objectif: 2500,
  }));

  // Map API top items to display format
  const topItemsDisplay: TopItem[] = topItems.map((item, i) => ({
    rank: i + 1,
    name: item.name,
    sold: item.soldCount,
    revenue: Math.round(item.soldCount * item.price),
    change: 0,
    up: true,
  }));

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-surface-900">Analytiques</h1>
            <p className="mt-1 text-sm text-surface-500">Chargement des données…</p>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse rounded-2xl bg-surface-100 h-28" />
          ))}
        </div>
        <div className="grid gap-6 xl:grid-cols-2">
          <div className="animate-pulse rounded-2xl bg-surface-100 h-80" />
          <div className="animate-pulse rounded-2xl bg-surface-100 h-80" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-surface-900">Analytiques</h1>
          <p className="mt-1 text-sm text-surface-500">Analyse approfondie de votre activité</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex rounded-xl border border-surface-200 bg-surface-50 p-1">
            {PERIODS.map((p, i) => (
              <button
                key={p}
                onClick={() => setPeriod(i)}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                  period === i
                    ? 'bg-white text-surface-900 shadow-sm'
                    : 'text-surface-500 hover:text-surface-700'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
          <button
            onClick={onExportCSV}
            className="flex items-center gap-2 rounded-xl border border-surface-200 bg-white px-4 py-2.5 text-sm font-medium text-surface-700 hover:bg-surface-50 transition-colors"
          >
            <Download className="h-4 w-4 text-surface-400" />
            CSV
          </button>
          <button
            onClick={onExportXLSX}
            className="flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-4 py-2.5 text-sm font-medium text-green-700 hover:bg-green-100 transition-colors"
          >
            <Download className="h-4 w-4 text-green-500" />
            Excel
          </button>
          <button
            onClick={onExportPDF}
            className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors"
            style={{ backgroundColor: '#1EFF6A', color: '#000' }}
          >
            <FileText className="h-4 w-4" />
            PDF
          </button>
        </div>
      </div>

      {/* KPI row */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpiCards.map((kpi, i) => {
          const Icon = kpi.icon;
          return (
            <motion.div
              key={kpi.title}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}
              className="gsap-card"
            >
              <Card padding="lg" className="hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-surface-500">{kpi.title}</p>
                    <p className="mt-2 text-2xl font-bold text-surface-900">{kpi.value}</p>
                    <p className={`mt-1 flex items-center gap-1 text-xs font-medium ${kpi.positive ? 'text-green-600 dark:text-green-400' : 'text-red-500'}`}>
                      {kpi.positive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                      {kpi.change} vs période préc.
                    </p>
                  </div>
                  <div className={`rounded-xl p-2.5 ${kpi.iconBg}`}>
                    <Icon className={`h-5 w-5 ${kpi.iconColor}`} />
                  </div>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* AI Insights */}
      <AIInsights
        scope="owner"
        period={PERIODS[period]}
        kpis={kpiCards.map((k) => ({ title: k.title, value: k.value, change: k.change }))}
        topItems={topItemsDisplay.map((t) => ({ name: t.name, sold: t.sold, revenue: t.revenue, change: t.change }))}
        revenue={revenueChartData}
        categories={PIE_DATA}
      />

      {/* Charts row */}
      <div className="grid gap-6 xl:grid-cols-2">
        {/* Area chart */}
        <Card padding="lg" className="gsap-card">
          <CardHeader>
            <CardTitle>Chiffre d&apos;affaires — 7 derniers jours</CardTitle>
          </CardHeader>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={revenueChartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#1EFF6A" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#1EFF6A" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="day" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}€`} />
              <Tooltip content={<AreaTooltip />} />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#1EFF6A"
                strokeWidth={2}
                fill="url(#colorRevenue)"
                dot={{ fill: '#1EFF6A', r: 4, strokeWidth: 0 }}
                activeDot={{ r: 6 }}
              />
              <Area
                type="monotone"
                dataKey="objectif"
                stroke="#cbd5e1"
                strokeWidth={2}
                strokeDasharray="6 4"
                fill="none"
                dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
          <div className="mt-3 flex items-center gap-6 text-xs text-surface-500">
            <div className="flex items-center gap-2">
              <div className="h-0.5 w-6 rounded bg-brand-500" />
              <span>CA réel</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-0.5 w-6 rounded border-t-2 border-dashed border-surface-300" />
              <span>Objectif (2 500€/j)</span>
            </div>
          </div>
        </Card>

        {/* Pie chart */}
        <Card padding="lg" className="gsap-card">
          <CardHeader>
            <CardTitle>Répartition des commandes</CardTitle>
          </CardHeader>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={PIE_DATA}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={3}
                dataKey="value"
              >
                {PIE_DATA.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={PIE_COLORS[index]} />
                ))}
              </Pie>
              <Tooltip formatter={(value: number) => [`${value}%`, '']} />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {PIE_DATA.map((entry, i) => (
              <div key={entry.name} className="flex items-center gap-2 text-sm">
                <div className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: PIE_COLORS[i] }} />
                <span className="text-surface-600">{entry.name}</span>
                <span className="ml-auto font-semibold text-surface-900">{entry.value}%</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Heatmap */}
      <Card padding="lg" className="gsap-card">
        <CardHeader>
          <CardTitle>Commandes par jour / heure</CardTitle>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="w-14 pb-2 text-left text-xs font-semibold text-surface-400" />
                {HOURS.map((h) => (
                  <th key={h} className="pb-2 text-center text-xs font-semibold text-surface-400">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="space-y-1">
              {DAYS.map((day) => (
                <tr key={day}>
                  <td className="pr-3 py-1 text-xs font-medium text-surface-600">{day}</td>
                  {HEATMAP[day].map((count, hi) => {
                    const opacity = Math.max(0.07, count / MAX_HEATMAP);
                    return (
                      <td key={hi} className="px-1 py-1">
                        <div
                          className="mx-auto flex h-9 w-full min-w-[2.5rem] items-center justify-center rounded-lg text-xs font-semibold"
                          style={{
                            backgroundColor: `rgba(249,115,22,${opacity})`,
                            color: opacity > 0.5 ? '#fff' : '#9a3412',
                          }}
                          title={`${day} ${HOURS[hi]}: ${count} cmd`}
                        >
                          {count}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-3 flex items-center gap-3 text-xs text-surface-400">
          <span>Intensité :</span>
          {[0.07, 0.3, 0.6, 1].map((op, i) => (
            <div key={i} className="flex items-center gap-1">
              <div className="h-4 w-4 rounded" style={{ backgroundColor: `rgba(249,115,22,${op})` }} />
              {i === 0 ? 'Faible' : i === 3 ? 'Fort' : ''}
            </div>
          ))}
        </div>
      </Card>

      {/* Bottom row */}
      <div className="grid gap-6 xl:grid-cols-[2fr,1fr]">
        {/* Top performers */}
        <Card padding="none" className="gsap-card">
          <CardHeader className="border-b border-surface-100 px-6 py-5">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-brand-500" />
              <CardTitle>Top 5 plats — cette période</CardTitle>
            </div>
          </CardHeader>
          <div className="divide-y divide-surface-100">
            {topItemsDisplay.map((item, i) => (
              <motion.div
                key={item.name}
                initial={{ opacity: 0, x: -4 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-center justify-between px-6 py-4 hover:bg-surface-50"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-surface-100 text-sm font-bold text-surface-600">
                    {item.rank}
                  </div>
                  <div>
                    <p className="font-medium text-surface-900">{item.name}</p>
                    <p className="text-sm text-surface-500">{item.sold} vendus</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <p className="font-bold text-surface-900">{item.revenue.toLocaleString('fr-FR')}€</p>
                  <div className={`flex items-center gap-1 text-xs font-medium ${item.up ? 'text-green-600 dark:text-green-400' : 'text-red-500'}`}>
                    {item.up
                      ? <TrendingUp className="h-3.5 w-3.5" />
                      : <TrendingDown className="h-3.5 w-3.5" />}
                    {item.up ? '+' : ''}{item.change}%
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </Card>

        {/* Customer retention */}
        <Card padding="lg" className="gsap-card">
          <CardHeader>
            <CardTitle>Fidélisation clients</CardTitle>
          </CardHeader>
          <div className="space-y-5">
            {[
              { label: 'Clients récurrents',      value: '67%', bar: 67, color: 'bg-green-500',  desc: 'Ont commandé 2× ou plus' },
              { label: 'Abandon de panier',        value: '23%', bar: 23, color: 'bg-red-400',    desc: 'Panier non finalisé' },
              { label: 'NPS Score',                value: '72',  bar: 72, color: 'bg-brand-500',   desc: 'Net Promoter Score' },
            ].map((metric) => (
              <div key={metric.label}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <div>
                    <p className="font-medium text-surface-800">{metric.label}</p>
                    <p className="text-xs text-surface-400">{metric.desc}</p>
                  </div>
                  <span className="text-lg font-bold text-surface-900">{metric.value}</span>
                </div>
                <div className="h-2 w-full rounded-full bg-surface-100">
                  <div className={`h-full rounded-full ${metric.color} transition-all`} style={{ width: `${metric.bar}%` }} />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6 rounded-xl bg-brand-50 px-4 py-3">
            <p className="text-xs font-medium text-brand-700">Conseil IA</p>
            <p className="mt-1 text-sm text-brand-800">
              Vos clients récurrents génèrent <strong>78%</strong> du CA. Pensez à activer des offres de fidélité.
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function AnalyticsPage() {
  const [period, setPeriod] = useState(0);
  const pageRef = useGSAPReveal<HTMLDivElement>('.gsap-card');

  // ── API state ──────────────────────────────────────────────────────────────
  const [salesData, setSalesData] = useState<ApiSalesData | null>(null);
  const [revenueData, setRevenueData] = useState<ApiRevenuePoint[]>([]);
  const [topItems, setTopItems] = useState<ApiTopItem[]>([]);
  const [deliveryStats, setDeliveryStats] = useState<ApiDeliveryStats | null>(null);
  const [loading, setLoading] = useState(true);

  const authUser = useAuthStore((s) => s.user);
  const RESTAURANT_ID = authUser?.restaurantIds?.[0] ?? '';
  const selectedPeriod = PERIOD_API_MAP[period] ?? 'week';

  // Use real auth role; fall back to cookie for unauthenticated demo mode
  const [cookieRole, setCookieRole] = useState<string>('owner');
  useEffect(() => { if (!authUser) setCookieRole(parseCookieRole()); }, [authUser]);
  const role = authUser
    ? (authUser.role === 'super_admin' ? 'admin' : 'owner')
    : cookieRole;

  // ── Fetch analytics data ───────────────────────────────────────────────────
  useEffect(() => {
    if (role === 'admin' || !RESTAURANT_ID) {
      setLoading(false);
      return;
    }

    async function fetchAll() {
      setLoading(true);

      try {
        const [sales, revenue, items, delivery] = await Promise.allSettled([
          api.get(`/analytics/${RESTAURANT_ID}/sales`) as Promise<any>,
          api.get(`/analytics/${RESTAURANT_ID}/revenue?period=${selectedPeriod}`) as Promise<any>,
          api.get(`/analytics/${RESTAURANT_ID}/top-items?limit=5`) as Promise<any>,
          api.get(`/analytics/${RESTAURANT_ID}/delivery-performance`) as Promise<any>,
        ]);

        if (sales.status === 'fulfilled' && sales.value && !sales.value.error) {
          setSalesData(sales.value as ApiSalesData);
        }
        if (revenue.status === 'fulfilled' && revenue.value && !revenue.value.error) {
          const raw = revenue.value as { data?: Array<{ total: number; createdAt: string }> };
          // Convert raw order list to aggregated daily revenue points
          const dailyMap = new Map<string, number>();
          (raw.data ?? []).forEach((o) => {
            const day = new Date(o.createdAt).toISOString().slice(0, 10);
            dailyMap.set(day, (dailyMap.get(day) ?? 0) + o.total);
          });
          const points: ApiRevenuePoint[] = Array.from(dailyMap.entries())
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([date, amount]) => ({ date, amount }));
          setRevenueData(points);
        }
        if (items.status === 'fulfilled' && Array.isArray(items.value)) {
          setTopItems(items.value as ApiTopItem[]);
        }
        if (delivery.status === 'fulfilled' && delivery.value && !delivery.value.error) {
          setDeliveryStats(delivery.value as ApiDeliveryStats);
        }
      } finally {
        setLoading(false);
      }
    }

    void fetchAll();
  }, [selectedPeriod, RESTAURANT_ID, role]);

  // Derived data for export handlers (computed from live state)
  const kpiCardsForExport = [
    { title: 'Chiffre d\'affaires', value: salesData ? `${salesData.revenue.toLocaleString('fr-FR')}€` : '—', change: '—' },
    { title: 'Commandes', value: salesData ? String(salesData.orderCount) : '—', change: '—' },
    { title: 'Panier moyen', value: salesData ? `${salesData.avgOrderValue.toFixed(2)}€` : '—', change: '—' },
    { title: 'Livraisons à l\'heure', value: deliveryStats ? `${deliveryStats.onTimeRate.toFixed(0)}%` : '—', change: '—' },
  ];

  const revenueDataForExport = revenueData.map((p) => ({
    day: new Date(p.date).toLocaleDateString('fr-FR', { weekday: 'short' }),
    revenue: p.amount,
    objectif: 2500,
  }));

  const topItemsForExport = topItems.map((item, i) => ({
    rank: i + 1,
    name: item.name,
    sold: item.soldCount,
    revenue: Math.round(item.soldCount * item.price),
    change: 0,
    up: true,
  }));

  // ── Export handlers ──────────────────────────────────────────────────────────

  const handleExportPDF = async () => {
    const { default: jsPDF } = await import('jspdf');
    const { default: autoTable } = await import('jspdf-autotable');
    const doc = new jsPDF();
    const dateStr = new Date().toLocaleDateString('fr-FR');

    if (role === 'admin') {
      doc.setFontSize(22);
      doc.setFont('helvetica', 'bold');
      doc.text('Analytique Plateforme FoodStack', 14, 22);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100);
      doc.text(`Généré le ${dateStr}`, 14, 32);
      doc.setTextColor(0);

      doc.setFontSize(13);
      doc.setFont('helvetica', 'bold');
      doc.text('KPIs Plateforme', 14, 46);

      autoTable(doc, {
        startY: 51,
        head: [['Indicateur', 'Valeur', 'Évolution', 'Description']],
        body: PLATFORM_KPI.map((k) => [k.title, k.value, k.change, k.desc]),
        styles: { fontSize: 10, cellPadding: 4 },
        headStyles: { fillColor: [30, 255, 106], textColor: [0, 0, 0], fontStyle: 'bold' },
      });

      const afterY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;
      doc.setFontSize(13);
      doc.setFont('helvetica', 'bold');
      doc.text('MRR — 12 mois', 14, afterY);

      autoTable(doc, {
        startY: afterY + 5,
        head: [['Mois', 'MRR (€)']],
        body: MRR_DATA.map((d) => [d.month, d.mrr.toLocaleString('fr-FR')]),
        styles: { fontSize: 10, cellPadding: 4 },
        headStyles: { fillColor: [30, 255, 106], textColor: [0, 0, 0], fontStyle: 'bold' },
      });

      doc.save('analytique-plateforme-foodstack.pdf');
    } else {
      const periodLabel = PERIODS[period];
      doc.setFontSize(22);
      doc.setFont('helvetica', 'bold');
      doc.text('Rapport Analytics FoodStack', 14, 22);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100);
      doc.text(`Période : ${periodLabel}`, 14, 32);
      doc.text(`Généré le ${dateStr}`, 14, 39);
      doc.setTextColor(0);

      doc.setFontSize(13);
      doc.setFont('helvetica', 'bold');
      doc.text('Indicateurs clés', 14, 52);

      autoTable(doc, {
        startY: 57,
        head: [['Indicateur', 'Valeur', 'Évolution']],
        body: kpiCardsForExport.map((k) => [k.title, k.value, k.change]),
        styles: { fontSize: 10, cellPadding: 4 },
        headStyles: { fillColor: [30, 255, 106], textColor: [0, 0, 0], fontStyle: 'bold' },
        didParseCell: (data) => {
          if (data.section === 'body' && data.column.index === 2) {
            const val = data.cell.raw as string;
            data.cell.styles.textColor = val.startsWith('+') ? [22, 163, 74] : [239, 68, 68];
            data.cell.styles.fontStyle = 'bold';
          }
        },
      });

      const afterKpi = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;
      doc.setFontSize(13);
      doc.setFont('helvetica', 'bold');
      doc.text('CA par jour', 14, afterKpi);

      autoTable(doc, {
        startY: afterKpi + 5,
        head: [['Jour', 'CA (€)', 'Objectif (€)', 'Atteint']],
        body: revenueDataForExport.map((d) => [
          d.day,
          d.revenue.toLocaleString('fr-FR'),
          d.objectif.toLocaleString('fr-FR'),
          d.revenue >= d.objectif ? 'Oui' : 'Non',
        ]),
        styles: { fontSize: 10, cellPadding: 4 },
        headStyles: { fillColor: [30, 255, 106], textColor: [0, 0, 0], fontStyle: 'bold' },
      });

      doc.save(`rapport-analytics-foodstack-${periodLabel}.pdf`);
    }
  };

  const handleExportCSV = () => {
    const formatSection = (title: string, headers: string[], rows: string[][]) => {
      const headerRow = headers.map((h) => `"${h}"`).join(',');
      const dataRows = rows.map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(','));
      return [`"${title}"`, headerRow, ...dataRows].join('\n');
    };

    let csv: string;
    let filename: string;

    if (role === 'admin') {
      const kpiSection = formatSection(
        'KPIs Plateforme FoodStack',
        ['Indicateur', 'Valeur', 'Évolution', 'Description'],
        PLATFORM_KPI.map((k) => [k.title, k.value, k.change, k.desc]),
      );
      const mrrSection = formatSection(
        'MRR 12 mois',
        ['Mois', 'MRR (€)'],
        MRR_DATA.map((d) => [d.month, String(d.mrr)]),
      );
      csv = [kpiSection, '', mrrSection].join('\n');
      filename = 'analytique-plateforme-foodstack.csv';
    } else {
      const periodLabel = PERIODS[period];
      const kpiSection = formatSection(
        `Analytics FoodStack — Période : ${periodLabel}`,
        ['Indicateur', 'Valeur', 'Évolution'],
        kpiCardsForExport.map((k) => [k.title, k.value, k.change]),
      );
      const revenueSection = formatSection(
        'CA par jour',
        ['Jour', 'CA (€)', 'Objectif (€)'],
        revenueDataForExport.map((d) => [d.day, String(d.revenue), String(d.objectif)]),
      );
      csv = [kpiSection, '', revenueSection].join('\n');
      filename = `analytics-foodstack-${periodLabel}.csv`;
    }

    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportXLSX = async () => {
    const XLSX = await import('xlsx');
    const periodLabel = PERIODS[period];
    const wb = XLSX.utils.book_new();

    if (role === 'admin') {
      const kpiSheet = XLSX.utils.aoa_to_sheet([
        ['Indicateur', 'Valeur', 'Évolution', 'Description'],
        ...PLATFORM_KPI.map((k) => [k.title, k.value, k.change, k.desc]),
      ]);
      const mrrSheet = XLSX.utils.aoa_to_sheet([
        ['Mois', 'MRR (€)'],
        ...MRR_DATA.map((d) => [d.month, d.mrr]),
      ]);
      XLSX.utils.book_append_sheet(wb, kpiSheet, 'KPIs Plateforme');
      XLSX.utils.book_append_sheet(wb, mrrSheet, 'MRR 12 mois');
      XLSX.writeFile(wb, 'analytique-plateforme-foodstack.xlsx');
    } else {
      const kpiSheet = XLSX.utils.aoa_to_sheet([
        ['Indicateur', 'Valeur', 'Évolution'],
        ...kpiCardsForExport.map((k) => [k.title, k.value, k.change]),
      ]);
      const revenueSheet = XLSX.utils.aoa_to_sheet([
        ['Jour', 'CA (€)', 'Objectif (€)', 'Atteint'],
        ...revenueDataForExport.map((d) => [d.day, d.revenue, d.objectif, d.revenue >= d.objectif ? 'Oui' : 'Non']),
      ]);
      const topSheet = XLSX.utils.aoa_to_sheet([
        ['Rang', 'Article', 'Vendus', 'CA (€)', 'Évolution (%)'],
        ...topItemsForExport.map((t) => [t.rank, t.name, t.sold, t.revenue, `${t.up ? '+' : ''}${t.change}%`]),
      ]);
      XLSX.utils.book_append_sheet(wb, kpiSheet, 'KPIs');
      XLSX.utils.book_append_sheet(wb, revenueSheet, 'CA par jour');
      XLSX.utils.book_append_sheet(wb, topSheet, 'Top articles');
      XLSX.writeFile(wb, `analytics-foodstack-${periodLabel}.xlsx`);
    }
  };

  return (
    <div ref={pageRef} className="p-6">
      {role === 'admin' ? (
        <AdminAnalytics onExportCSV={handleExportCSV} onExportPDF={handleExportPDF} onExportXLSX={handleExportXLSX} />
      ) : (
        <OwnerAnalytics
          period={period}
          setPeriod={setPeriod}
          onExportCSV={handleExportCSV}
          onExportPDF={handleExportPDF}
          onExportXLSX={handleExportXLSX}
          salesData={salesData}
          revenueData={revenueData}
          topItems={topItems}
          deliveryStats={deliveryStats}
          loading={loading}
        />
      )}
    </div>
  );
}
