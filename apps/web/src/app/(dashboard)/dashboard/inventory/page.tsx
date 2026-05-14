'use client';

import { useState } from 'react';
import { Plus, Search, AlertTriangle, Package, TrendingDown, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { StatCard } from '@/components/ui/StatCard';

interface StockItem {
  id: string;
  name: string;
  category: string;
  currentStock: number;
  unit: string;
  minStock: number;
  costPerUnit: number;
  supplier: string;
  lastUpdated: string;
}

const STOCK_ITEMS: StockItem[] = [
  { id: '1', name: 'Farine T55', category: 'Épicerie', currentStock: 25, unit: 'kg', minStock: 10, costPerUnit: 0.80, supplier: 'Moulins du Sud', lastUpdated: '2026-05-11' },
  { id: '2', name: 'Steak haché 180g', category: 'Viandes', currentStock: 3, unit: 'kg', minStock: 8, costPerUnit: 12.50, supplier: 'Boucherie Martin', lastUpdated: '2026-05-11' },
  { id: '3', name: 'Mozzarella fior di latte', category: 'Laitiers', currentStock: 5.5, unit: 'kg', minStock: 4, costPerUnit: 8.40, supplier: 'Fromagerie Centrale', lastUpdated: '2026-05-10' },
  { id: '4', name: 'Tomates San Marzano', category: 'Épicerie', currentStock: 12, unit: 'boîtes', minStock: 5, costPerUnit: 3.20, supplier: 'Épicerie du Monde', lastUpdated: '2026-05-09' },
  { id: '5', name: 'Huile d\'olive AOP', category: 'Épicerie', currentStock: 2, unit: 'L', minStock: 5, costPerUnit: 14.00, supplier: 'Épicerie du Monde', lastUpdated: '2026-05-11' },
  { id: '6', name: 'Œufs bio', category: 'Frais', currentStock: 120, unit: 'unités', minStock: 50, costPerUnit: 0.35, supplier: 'Ferme de la Vallée', lastUpdated: '2026-05-10' },
  { id: '7', name: 'Lait entier', category: 'Laitiers', currentStock: 8, unit: 'L', minStock: 10, costPerUnit: 1.10, supplier: 'Fromagerie Centrale', lastUpdated: '2026-05-11' },
  { id: '8', name: 'Sucre en poudre', category: 'Épicerie', currentStock: 15, unit: 'kg', minStock: 5, costPerUnit: 0.90, supplier: 'Moulins du Sud', lastUpdated: '2026-05-08' },
  { id: '9', name: 'Bacon fumé', category: 'Viandes', currentStock: 1.5, unit: 'kg', minStock: 3, costPerUnit: 18.00, supplier: 'Boucherie Martin', lastUpdated: '2026-05-11' },
  { id: '10', name: 'Salami piquant', category: 'Charcuterie', currentStock: 2.8, unit: 'kg', minStock: 2, costPerUnit: 22.00, supplier: 'Épicerie du Monde', lastUpdated: '2026-05-10' },
];

const CATEGORIES = ['Tous', 'Épicerie', 'Viandes', 'Laitiers', 'Charcuterie', 'Frais'];

function getStockStatus(item: StockItem): 'ok' | 'low' | 'critical' {
  const ratio = item.currentStock / item.minStock;
  if (ratio <= 0.5) return 'critical';
  if (ratio < 1) return 'low';
  return 'ok';
}

export default function InventoryPage() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('Tous');
  const [showLowOnly, setShowLowOnly] = useState(false);

  const filtered = STOCK_ITEMS.filter((item) => {
    const matchSearch = !search || item.name.toLowerCase().includes(search.toLowerCase());
    const matchCat = category === 'Tous' || item.category === category;
    const matchLow = !showLowOnly || getStockStatus(item) !== 'ok';
    return matchSearch && matchCat && matchLow;
  });

  const lowItems = STOCK_ITEMS.filter((i) => getStockStatus(i) !== 'ok').length;
  const criticalItems = STOCK_ITEMS.filter((i) => getStockStatus(i) === 'critical').length;
  const totalValue = STOCK_ITEMS.reduce((acc, i) => acc + i.currentStock * i.costPerUnit, 0);

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-900">Inventaire</h1>
          <p className="mt-1 text-sm text-surface-500">{STOCK_ITEMS.length} références · mis à jour aujourd'hui</p>
        </div>
        <Button icon={<Plus className="h-4 w-4" />}>Ajouter un article</Button>
      </div>

      {/* Stats */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Valeur totale du stock" value={`${totalValue.toFixed(0)}€`} icon={Package} iconColor="text-blue-600 dark:text-blue-400" iconBg="bg-blue-50 dark:bg-blue-900/20" />
        <StatCard title="Articles en stock bas" value={lowItems} icon={TrendingDown} iconColor="text-yellow-600 dark:text-yellow-400" iconBg="bg-yellow-50 dark:bg-yellow-900/20" />
        <StatCard title="Articles critiques" value={criticalItems} icon={AlertTriangle} iconColor="text-red-600 dark:text-red-400" iconBg="bg-red-50 dark:bg-red-900/20" />
        <StatCard title="Références totales" value={STOCK_ITEMS.length} icon={TrendingUp} iconColor="text-green-600 dark:text-green-400" iconBg="bg-green-50 dark:bg-green-900/20" />
      </div>

      {/* Filters */}
      <div className="mb-4 flex flex-wrap gap-3">
        <div className="w-64">
          <Input placeholder="Rechercher..." value={search} onChange={(e) => setSearch(e.target.value)} leftIcon={<Search className="h-4 w-4" />} />
        </div>
        <div className="flex gap-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`rounded-xl border px-3 py-2 text-sm font-medium transition-colors ${
                category === cat ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-surface-200 bg-white text-surface-600 hover:border-surface-300'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
        <button
          onClick={() => setShowLowOnly(!showLowOnly)}
          className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium transition-colors ${
            showLowOnly ? 'border-red-400 bg-red-50 text-red-700' : 'border-surface-200 bg-white text-surface-600'
          }`}
        >
          <AlertTriangle className="h-4 w-4" />
          Stock bas uniquement
        </button>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-surface-200 bg-white shadow-sm">
        <table className="w-full">
          <thead>
            <tr className="border-b border-surface-100 bg-surface-50">
              {['Article', 'Catégorie', 'Stock actuel', 'Stock min.', 'Valeur', 'Fournisseur', 'Statut', 'Actions'].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-surface-400">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-100">
            {filtered.map((item) => {
              const status = getStockStatus(item);
              const ratio = (item.currentStock / item.minStock) * 100;
              return (
                <tr key={item.id} className="hover:bg-surface-50">
                  <td className="px-4 py-3.5">
                    <p className="text-sm font-medium text-surface-900">{item.name}</p>
                    <p className="text-xs text-surface-400">Mis à jour : {item.lastUpdated}</p>
                  </td>
                  <td className="px-4 py-3.5 text-sm text-surface-600">{item.category}</td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-semibold ${
                        status === 'critical' ? 'text-red-600' : status === 'low' ? 'text-yellow-600' : 'text-surface-900'
                      }`}>
                        {item.currentStock} {item.unit}
                      </span>
                    </div>
                    <div className="mt-1 h-1.5 w-20 rounded-full bg-surface-100">
                      <div
                        className={`h-full rounded-full ${
                          status === 'critical' ? 'bg-red-500' : status === 'low' ? 'bg-yellow-500' : 'bg-green-500'
                        }`}
                        style={{ width: `${Math.min(100, ratio)}%` }}
                      />
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-sm text-surface-500">{item.minStock} {item.unit}</td>
                  <td className="px-4 py-3.5 text-sm font-medium text-surface-700">
                    {(item.currentStock * item.costPerUnit).toFixed(2)}€
                  </td>
                  <td className="px-4 py-3.5 text-sm text-surface-600">{item.supplier}</td>
                  <td className="px-4 py-3.5">
                    <Badge
                      variant={status === 'critical' ? 'danger' : status === 'low' ? 'warning' : 'success'}
                      dot
                    >
                      {status === 'critical' ? 'Critique' : status === 'low' ? 'Bas' : 'OK'}
                    </Badge>
                  </td>
                  <td className="px-4 py-3.5">
                    <Button size="sm" variant="ghost">Réapprovisionner</Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
