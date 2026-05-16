'use client';

import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Filter, ChevronDown, X, Mail, Phone,
  ShoppingBag, Star, Clock, Users, TrendingUp,
  UserCheck, CreditCard, Calendar, Upload, Download, FileText,
  Smartphone, Truck, Monitor, Gift,
} from 'lucide-react';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { useGSAPReveal } from '@/hooks/useGSAPReveal';
import { useSearchParams } from 'next/navigation';

// ── Types ────────────────────────────────────────────────────────────────────

type Tier = 'Bronze' | 'Silver' | 'Gold' | 'Platinum';
type CustomerStatus = 'active' | 'inactive';
type FilterOption = 'Tous' | 'Actifs' | 'Inactifs' | 'VIP';

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  orders: number;
  spent: number;
  lastOrder: string;
  tier: Tier;
  joinedAt: string;
  status: CustomerStatus;
}

// ── Mock data ─────────────────────────────────────────────────────────────────

const INITIAL_CUSTOMERS: Customer[] = [
  { id: 'c1', name: 'Marie Leclerc', email: 'marie.l@email.com', phone: '+33 6 11 22 33 44', orders: 24, spent: 847.50, lastOrder: 'il y a 2j', tier: 'Gold', joinedAt: 'Jan 2024', status: 'active' },
  { id: 'c2', name: 'Pierre Dubois', email: 'pierre.d@email.com', phone: '+33 6 55 44 33 22', orders: 8, spent: 234.80, lastOrder: 'il y a 5j', tier: 'Silver', joinedAt: 'Mar 2024', status: 'active' },
  { id: 'c3', name: 'Sophie Martin', email: 'sophie.m@email.com', phone: '+33 6 77 88 99 11', orders: 51, spent: 1823.40, lastOrder: 'il y a 1j', tier: 'Platinum', joinedAt: 'Oct 2023', status: 'active' },
  { id: 'c4', name: 'Julien Kowalski', email: 'julien.k@email.com', phone: '+33 6 22 33 44 55', orders: 3, spent: 67.20, lastOrder: 'il y a 3sem', tier: 'Bronze', joinedAt: 'Nov 2024', status: 'active' },
  { id: 'c5', name: 'Emma Rousseau', email: 'emma.r@email.com', phone: '+33 6 44 55 66 77', orders: 0, spent: 0, lastOrder: 'Jamais', tier: 'Bronze', joinedAt: 'Jan 2025', status: 'inactive' },
  { id: 'c6', name: 'Antoine Bernard', email: 'antoine.b@email.com', phone: '+33 6 99 88 77 66', orders: 37, spent: 1240.00, lastOrder: 'il y a 4j', tier: 'Gold', joinedAt: 'Jun 2023', status: 'active' },
];

const MOCK_ORDERS: Record<string, { label: string; amount: number; date: string }[]> = {
  c1: [
    { label: 'Sushi Zen · 3 articles', amount: 48.50, date: 'il y a 2j' },
    { label: 'Burger House · 2 articles', amount: 32.80, date: 'il y a 1sem' },
    { label: 'Pizza Roma · 4 articles', amount: 41.20, date: 'il y a 2sem' },
  ],
  c2: [
    { label: 'Tacos Palace · 2 articles', amount: 27.90, date: 'il y a 5j' },
    { label: 'Sushi Zen · 1 article', amount: 18.50, date: 'il y a 3sem' },
    { label: 'Burger House · 3 articles', amount: 34.40, date: 'il y a 1mois' },
  ],
  c3: [
    { label: 'Sushi Zen · 5 articles', amount: 72.00, date: 'il y a 1j' },
    { label: 'Pizza Roma · 6 articles', amount: 58.60, date: 'il y a 3j' },
    { label: 'Burger House · 4 articles', amount: 45.80, date: 'il y a 5j' },
  ],
  c4: [
    { label: 'Tacos Palace · 1 article', amount: 14.90, date: 'il y a 3sem' },
    { label: 'Burger House · 2 articles', amount: 28.40, date: 'il y a 2mois' },
    { label: 'Pizza Roma · 2 articles', amount: 23.90, date: 'il y a 3mois' },
  ],
  c5: [],
  c6: [
    { label: 'Burger House · 3 articles', amount: 39.50, date: 'il y a 4j' },
    { label: 'Sushi Zen · 4 articles', amount: 62.00, date: 'il y a 2sem' },
    { label: 'Tacos Palace · 2 articles', amount: 26.80, date: 'il y a 3sem' },
  ],
};

const LOYALTY_POINTS: Record<Tier, number> = {
  Bronze: 120,
  Silver: 680,
  Gold: 1450,
  Platinum: 3200,
};

// ── Helpers ───────────────────────────────────────────────────────────────────

const TIER_CONFIG: Record<Tier, { color: string; bg: string; dot: string; variant: 'warning' | 'default' | 'brand' | 'info' }> = {
  Bronze:   { color: 'text-amber-700 dark:text-amber-400',  bg: 'bg-amber-50 dark:bg-amber-900/20',  dot: 'bg-amber-500',  variant: 'warning' },
  Silver:   { color: 'text-slate-600',  bg: 'bg-slate-100', dot: 'bg-slate-400',  variant: 'default' },
  Gold:     { color: 'text-yellow-700 dark:text-yellow-400', bg: 'bg-yellow-50 dark:bg-yellow-900/20', dot: 'bg-yellow-500', variant: 'warning' },
  Platinum: { color: 'text-purple-700 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-900/20', dot: 'bg-purple-500', variant: 'info' },
};

// Static feature chips per customer (demo)
const FEATURE_CHIPS = [
  { label: 'App mobile', icon: Smartphone, color: 'bg-blue-50 text-blue-700' },
  { label: 'Livraisons',  icon: Truck,      color: 'bg-orange-50 text-orange-700' },
  { label: 'Caisse',      icon: Monitor,    color: 'bg-purple-50 text-purple-700' },
  { label: 'Fidélité',    icon: Gift,       color: 'bg-green-50 text-[#15803d]' },
];

function getInitials(name: string) {
  return name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();
}

function CustomerAvatar({ name, tier }: { name: string; tier: Tier }) {
  const cfg = TIER_CONFIG[tier];
  return (
    <div className={`flex h-10 w-10 items-center justify-center rounded-full ${cfg.bg} ring-2 ring-white shrink-0`}>
      <span className={`text-xs font-bold ${cfg.color}`}>{getInitials(name)}</span>
    </div>
  );
}

function TierBadge({ tier }: { tier: Tier }) {
  const cfg = TIER_CONFIG[tier];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${cfg.bg} ${cfg.color}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
      {tier}
    </span>
  );
}

// ── Feature chips strip ───────────────────────────────────────────────────────

function FeatureChips() {
  return (
    <div className="flex flex-wrap gap-1.5">
      {FEATURE_CHIPS.map(({ label, icon: Icon, color }) => (
        <span key={label} className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${color}`}>
          <Icon className="h-2.5 w-2.5" />
          {label}
        </span>
      ))}
    </div>
  );
}

// ── Customer detail panel ─────────────────────────────────────────────────────

function CustomerPanel({ customer, onClose }: { customer: Customer; onClose: () => void }) {
  const orders = MOCK_ORDERS[customer.id] ?? [];
  const points = LOYALTY_POINTS[customer.tier];
  const cfg = TIER_CONFIG[customer.tier];

  return (
    <motion.div
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 24 }}
      className="flex w-80 flex-col overflow-hidden rounded-2xl border border-surface-200 bg-white shadow-lg shrink-0"
    >
      {/* Header */}
      <div className="border-b border-surface-100 p-5">
        <div className="mb-4 flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-surface-400">Profil client</span>
          <button onClick={onClose} className="rounded-lg p-1 hover:bg-surface-100 transition-colors">
            <X className="h-4 w-4 text-surface-400" />
          </button>
        </div>
        <div className="flex items-start gap-4">
          <div className={`flex h-14 w-14 items-center justify-center rounded-2xl ${cfg.bg} shrink-0`}>
            <span className={`text-lg font-bold ${cfg.color}`}>{getInitials(customer.name)}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-surface-900">{customer.name}</p>
            <p className="text-xs text-surface-500 truncate">{customer.email}</p>
            <div className="mt-1.5 flex items-center gap-2">
              <TierBadge tier={customer.tier} />
              <Badge variant={customer.status === 'active' ? 'success' : 'default'} dot>
                {customer.status === 'active' ? 'Actif' : 'Inactif'}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 divide-x divide-surface-100 border-b border-surface-100">
        {[
          { label: 'Commandes', value: String(customer.orders) },
          { label: 'Total dépensé', value: `${customer.spent.toFixed(0)}€` },
          { label: 'Points fidélité', value: String(points) },
        ].map((s) => (
          <div key={s.label} className="py-4 text-center">
            <p className="text-base font-bold text-surface-900">{s.value}</p>
            <p className="text-[10px] text-surface-400 leading-tight mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Info */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        {[
          { icon: Phone, label: 'Téléphone', value: customer.phone },
          { icon: Calendar, label: 'Membre depuis', value: customer.joinedAt },
          { icon: Clock, label: 'Dernière commande', value: customer.lastOrder },
        ].map(({ icon: Icon, label, value }) => (
          <div key={label} className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface-100 shrink-0">
              <Icon className="h-4 w-4 text-surface-400" />
            </div>
            <div>
              <p className="text-xs text-surface-400">{label}</p>
              <p className="text-sm font-medium text-surface-900">{value}</p>
            </div>
          </div>
        ))}

        {/* Loyalty points bar */}
        <div className={`rounded-xl ${cfg.bg} p-3`}>
          <div className="flex items-center justify-between mb-2">
            <p className={`text-xs font-semibold ${cfg.color}`}>Points de fidélité</p>
            <span className={`text-sm font-bold ${cfg.color}`}>{points} pts</span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-white/60">
            <div
              className={`h-1.5 rounded-full ${cfg.dot}`}
              style={{ width: `${Math.min((points / 3000) * 100, 100)}%` }}
            />
          </div>
          <p className="mt-1.5 text-xs text-surface-500">Palier : {customer.tier}</p>
        </div>

        {/* Recent orders */}
        <div>
          <p className="mb-2.5 text-xs font-semibold text-surface-500">Dernières commandes</p>
          {orders.length === 0 ? (
            <p className="text-xs text-surface-400 italic">Aucune commande pour l&apos;instant</p>
          ) : (
            <div className="space-y-2">
              {orders.map((order, i) => (
                <div key={i} className="flex items-center justify-between rounded-xl border border-surface-100 px-3 py-2.5">
                  <div>
                    <p className="text-xs font-medium text-surface-800">{order.label}</p>
                    <p className="text-[10px] text-surface-400">{order.date}</p>
                  </div>
                  <span className="text-xs font-bold text-surface-900">{order.amount.toFixed(2)}€</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="border-t border-surface-100 p-4">
        <div className="flex gap-2">
          <button className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-surface-200 py-2 text-xs font-semibold text-surface-600 hover:bg-surface-50 transition-colors">
            <Phone className="h-3.5 w-3.5" />
            Appeler
          </button>
          <button className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-brand-50 py-2 text-xs font-semibold text-brand-700 hover:bg-brand-100 transition-colors">
            <Mail className="h-3.5 w-3.5" />
            Envoyer email
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function CustomersPage() {
  const pageRef = useGSAPReveal<HTMLDivElement>('.gsap-card');
  const [customers, setCustomers] = useState<Customer[]>(INITIAL_CUSTOMERS);
  const [selected, setSelected] = useState<Customer | null>(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterOption>('Tous');
  const [showFilter, setShowFilter] = useState(false);
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const csvInputRef = useRef<HTMLInputElement>(null);
  const rowRefs = useRef<Record<string, HTMLTableRowElement | null>>({});
  const searchParams = useSearchParams();

  // Scroll-to + highlight when ?id=X is present
  useEffect(() => {
    const id = searchParams.get('id');
    if (!id) return;
    setHighlightedId(id);
    const timer = setTimeout(() => {
      const el = rowRefs.current[id];
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 200);
    const clearTimer = setTimeout(() => setHighlightedId(null), 2200);
    return () => { clearTimeout(timer); clearTimeout(clearTimer); };
  }, [searchParams]);

  const filtered = useMemo(() => {
    return customers.filter((c) => {
      const matchSearch =
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.email.toLowerCase().includes(search.toLowerCase());
      const matchFilter =
        filter === 'Tous' ||
        (filter === 'Actifs' && c.status === 'active') ||
        (filter === 'Inactifs' && c.status === 'inactive') ||
        (filter === 'VIP' && (c.tier === 'Gold' || c.tier === 'Platinum'));
      return matchSearch && matchFilter;
    });
  }, [customers, search, filter]);

  // ── CSV Import ──────────────────────────────────────────────────────────────
  const handleCsvImport = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
      if (lines.length < 2) return;
      // First row = headers, rest = data
      const headers = lines[0].split(',').map((h) => h.replace(/^"|"$/g, '').trim());
      const parsed: Customer[] = lines.slice(1).map((line, idx) => {
        const cols = line.split(',').map((c) => c.replace(/^"|"$/g, '').trim());
        const get = (key: string) => cols[headers.indexOf(key)] ?? '';
        return {
          id: `imported-${Date.now()}-${idx}`,
          name: get('name') || get('nom') || `Client ${idx + 1}`,
          email: get('email') || '',
          phone: get('phone') || get('téléphone') || '',
          orders: parseInt(get('orders') || get('commandes') || '0', 10) || 0,
          spent: parseFloat(get('spent') || get('dépensé') || '0') || 0,
          lastOrder: get('lastOrder') || get('dernière commande') || 'N/A',
          tier: (['Bronze', 'Silver', 'Gold', 'Platinum'].includes(get('tier')) ? get('tier') : 'Bronze') as Tier,
          joinedAt: get('joinedAt') || get('inscrit') || '',
          status: get('status') === 'inactive' ? 'inactive' : 'active',
        };
      });
      setCustomers((prev) => [...prev, ...parsed]);
    };
    reader.readAsText(file);
    // Reset so same file can be re-imported if needed
    e.target.value = '';
  }, []);

  // ── CSV Export ──────────────────────────────────────────────────────────────
  const handleExportCSV = useCallback(() => {
    const headers = ['id', 'name', 'email', 'phone', 'orders', 'spent', 'lastOrder', 'tier', 'joinedAt', 'status'];
    const rows = customers.map((c) =>
      headers.map((h) => `"${String(c[h as keyof Customer]).replace(/"/g, '""')}"`).join(',')
    );
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'clients-foodstack.csv';
    a.click();
    URL.revokeObjectURL(url);
  }, [customers]);

  // ── Excel Export ─────────────────────────────────────────────────────────────
  const handleExportXLSX = useCallback(async () => {
    const XLSX = await import('xlsx');
    const wb = XLSX.utils.book_new();
    const headers = ['ID', 'Nom', 'Email', 'Téléphone', 'Commandes', 'Dépenses (€)', 'Dernière commande', 'Tier', 'Inscrit le', 'Statut'];
    const rows = customers.map((c) => [c.id, c.name, c.email, c.phone, c.orders, c.spent, c.lastOrder, c.tier, c.joinedAt, c.status]);
    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    ws['!cols'] = headers.map((_, i) => ({ wch: [8, 20, 26, 14, 10, 12, 14, 10, 12, 10][i] ?? 14 }));
    XLSX.utils.book_append_sheet(wb, ws, 'Clients');
    XLSX.writeFile(wb, 'clients-foodstack.xlsx');
  }, [customers]);

  // ── PDF Export ──────────────────────────────────────────────────────────────
  const handleExportPDF = useCallback(async () => {
    const { jsPDF } = await import('jspdf');
    const doc = new jsPDF();
    const dateStr = new Date().toLocaleDateString('fr-FR');

    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('Liste des clients — FoodStack', 14, 20);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(120);
    doc.text(`Généré le ${dateStr}`, 14, 28);
    doc.setTextColor(0);

    let y = 38;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    const colX = [14, 60, 105, 130, 155, 180];
    const colH = ['Nom', 'Email', 'Commandes', 'Dépensé', 'Tier', 'Statut'];
    colH.forEach((h, i) => doc.text(h, colX[i], y));
    y += 2;
    doc.setLineWidth(0.3);
    doc.line(14, y, 196, y);
    y += 5;

    doc.setFont('helvetica', 'normal');
    customers.forEach((c) => {
      if (y > 270) { doc.addPage(); y = 20; }
      doc.text(c.name.slice(0, 22), colX[0], y);
      doc.text(c.email.slice(0, 22), colX[1], y);
      doc.text(String(c.orders), colX[2], y);
      doc.text(`${c.spent.toFixed(2)}€`, colX[3], y);
      doc.text(c.tier, colX[4], y);
      doc.text(c.status === 'active' ? 'Actif' : 'Inactif', colX[5], y);
      y += 7;
    });

    doc.save('clients.pdf');
  }, [customers]);

  const KPI = [
    { label: 'Total clients', value: customers.length.toLocaleString('fr-FR'), icon: Users, color: 'text-brand-600', bg: 'bg-brand-50' },
    { label: 'Nouveaux ce mois', value: '89', icon: UserCheck, color: 'text-green-600 dark:text-green-400', bg: 'bg-green-50 dark:bg-green-900/20' },
    { label: 'Clients actifs', value: String(customers.filter((c) => c.status === 'active').length), icon: TrendingUp, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/20' },
    { label: 'Valeur moy. commande', value: '34,50€', icon: CreditCard, color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-900/20' },
  ];

  return (
    <div ref={pageRef} className="space-y-6 p-6">
      {/* Hidden CSV file input */}
      <input
        ref={csvInputRef}
        type="file"
        accept=".csv"
        className="hidden"
        onChange={handleCsvImport}
      />

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-surface-900">Clients</h1>
          <p className="mt-1 text-sm text-surface-500">{customers.length} clients enregistrés</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-surface-400" />
            <input
              type="text"
              placeholder="Rechercher par nom ou email…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-64 rounded-xl border border-surface-200 bg-white py-2.5 pl-9 pr-4 text-sm text-surface-900 placeholder-surface-400 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
            />
          </div>

          {/* Filter */}
          <div className="relative">
            <button
              onClick={() => setShowFilter(!showFilter)}
              className="flex items-center gap-2 rounded-xl border border-surface-200 bg-white px-4 py-2.5 text-sm font-medium text-surface-700 hover:bg-surface-50 transition-colors"
            >
              <Filter className="h-4 w-4 text-surface-400" />
              {filter}
              <ChevronDown className="h-3 w-3 text-surface-400" />
            </button>
            <AnimatePresence>
              {showFilter && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  className="absolute right-0 top-full z-20 mt-1.5 w-40 rounded-xl border border-surface-200 bg-white py-1 shadow-lg"
                >
                  {(['Tous', 'Actifs', 'Inactifs', 'VIP'] as FilterOption[]).map((f) => (
                    <button
                      key={f}
                      onClick={() => { setFilter(f); setShowFilter(false); }}
                      className={`w-full px-4 py-2 text-left text-sm transition-colors ${filter === f ? 'font-semibold text-brand-700 bg-brand-50' : 'text-surface-700 hover:bg-surface-50'}`}
                    >
                      {f}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Import CSV */}
          <button
            onClick={() => csvInputRef.current?.click()}
            className="flex items-center gap-2 rounded-xl border border-surface-200 bg-white px-4 py-2.5 text-sm font-medium text-surface-700 hover:bg-surface-50 transition-colors"
          >
            <Upload className="h-4 w-4 text-surface-400" />
            Importer CSV
          </button>

          {/* Export CSV */}
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 rounded-xl border border-surface-200 bg-white px-4 py-2.5 text-sm font-medium text-surface-700 hover:bg-surface-50 transition-colors"
          >
            <Download className="h-4 w-4 text-surface-400" />
            CSV
          </button>

          {/* Export Excel */}
          <button
            onClick={handleExportXLSX}
            className="flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-4 py-2.5 text-sm font-medium text-green-700 hover:bg-green-100 transition-colors"
          >
            <Download className="h-4 w-4 text-green-500" />
            Excel
          </button>

          {/* Export PDF */}
          <button
            onClick={handleExportPDF}
            className="flex items-center gap-2 rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-600 transition-colors"
            style={{ backgroundColor: '#1EFF6A', color: '#000' }}
          >
            <FileText className="h-4 w-4" />
            Exporter PDF
          </button>
        </div>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {KPI.map(({ label, value, icon: Icon, color, bg }, i) => (
          <motion.div key={label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }} className="gsap-card">
            <Card padding="md" className="flex items-center gap-3">
              <div className={`rounded-xl p-2.5 ${bg} shrink-0`}>
                <Icon className={`h-5 w-5 ${color}`} />
              </div>
              <div>
                <p className="text-lg font-bold text-surface-900">{value}</p>
                <p className="text-xs text-surface-400">{label}</p>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Content: table + detail panel */}
      <div className="flex gap-6 items-start">
        {/* Table */}
        <Card padding="none" className="gsap-card flex-1 min-w-0 overflow-hidden">
          <CardHeader className="border-b border-surface-100 px-6 py-5">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-brand-500" />
              <CardTitle>Liste des clients</CardTitle>
            </div>
            <span className="text-sm text-surface-400">{filtered.length} résultat{filtered.length !== 1 ? 's' : ''}</span>
          </CardHeader>

          <div className="overflow-x-auto">
            {filtered.length === 0 ? (
              <div className="flex h-40 items-center justify-center text-sm text-surface-400">
                Aucun client trouvé
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-surface-100 text-left">
                    {['Client', 'Téléphone', 'Commandes', 'Total dépensé', 'Dernière cmd', 'Tier', 'Statut', 'Modules', ''].map((h) => (
                      <th key={h} className="px-6 py-3 text-xs font-semibold uppercase tracking-wide text-surface-400 whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-50">
                  <AnimatePresence mode="popLayout">
                    {filtered.map((customer) => {
                      const isHighlighted = highlightedId === customer.id;
                      return (
                        <motion.tr
                          key={customer.id}
                          ref={(el) => { rowRefs.current[customer.id] = el; }}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          onClick={() => setSelected(selected?.id === customer.id ? null : customer)}
                          className={`cursor-pointer transition-all hover:bg-surface-50 ${
                            selected?.id === customer.id ? 'bg-brand-50/50' : ''
                          } ${isHighlighted ? 'ring-2 ring-inset ring-[#1EFF6A]' : ''}`}
                          style={isHighlighted ? { borderColor: '#1EFF6A' } : {}}
                        >
                          {/* Avatar + Name/Email */}
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <CustomerAvatar name={customer.name} tier={customer.tier} />
                              <div>
                                <p className="font-medium text-surface-900 whitespace-nowrap">{customer.name}</p>
                                <p className="text-xs text-surface-400">{customer.email}</p>
                              </div>
                            </div>
                          </td>

                          {/* Phone */}
                          <td className="px-6 py-4 text-sm text-surface-600 whitespace-nowrap">{customer.phone}</td>

                          {/* Orders */}
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-1.5">
                              <ShoppingBag className="h-3.5 w-3.5 text-surface-400" />
                              <span className="font-semibold text-surface-900">{customer.orders}</span>
                            </div>
                          </td>

                          {/* Spent */}
                          <td className="px-6 py-4">
                            <span className="font-semibold text-surface-900">{customer.spent.toFixed(2).replace('.', ',')}€</span>
                          </td>

                          {/* Last order */}
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-1.5">
                              <Clock className="h-3 w-3 text-surface-400" />
                              <span className="text-surface-600 whitespace-nowrap">{customer.lastOrder}</span>
                            </div>
                          </td>

                          {/* Tier */}
                          <td className="px-6 py-4">
                            <TierBadge tier={customer.tier} />
                          </td>

                          {/* Status */}
                          <td className="px-6 py-4">
                            <Badge variant={customer.status === 'active' ? 'success' : 'default'} dot>
                              {customer.status === 'active' ? 'Actif' : 'Inactif'}
                            </Badge>
                          </td>

                          {/* Feature chips */}
                          <td className="px-6 py-4">
                            <FeatureChips />
                          </td>

                          {/* Action */}
                          <td className="px-6 py-4">
                            <button
                              onClick={(e) => { e.stopPropagation(); }}
                              className="flex h-8 w-8 items-center justify-center rounded-lg border border-surface-200 text-surface-400 hover:bg-surface-50 hover:text-brand-500 transition-colors"
                              aria-label={`Envoyer email à ${customer.name}`}
                            >
                              <Mail className="h-3.5 w-3.5" />
                            </button>
                          </td>
                        </motion.tr>
                      );
                    })}
                  </AnimatePresence>
                </tbody>
              </table>
            )}
          </div>
        </Card>

        {/* Detail panel */}
        <AnimatePresence>
          {selected && (
            <CustomerPanel
              key={selected.id}
              customer={selected}
              onClose={() => setSelected(null)}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
