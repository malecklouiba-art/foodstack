'use client';

import { Card, CardHeader, CardTitle } from '@/components/ui/Card';

const items = [
  { name: 'Classic Smash Burger', sold: 156, revenue: 2324.4, trend: 12 },
  { name: 'Truffle Cheeseburger', sold: 89, revenue: 2002.5, trend: 8 },
  { name: 'Margherita Napoletana', sold: 134, revenue: 1862.6, trend: -3 },
  { name: 'Tiramisu Classique', sold: 201, revenue: 1507.5, trend: 24 },
  { name: 'Salade César Premium', sold: 78, revenue: 975.0, trend: 6 },
];

export function TopItems() {
  const maxSold = Math.max(...items.map((i) => i.sold));

  return (
    <Card padding="none">
      <CardHeader className="border-b border-surface-100 px-6 py-5 dark:border-surface-700">
        <CardTitle>Top Plats</CardTitle>
      </CardHeader>
      <div className="p-6">
        <div className="space-y-4">
          {items.map((item, index) => (
            <div key={item.name}>
              <div className="mb-1.5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-surface-100 text-xs font-bold text-surface-500 dark:bg-surface-700 dark:text-surface-400">
                    {index + 1}
                  </span>
                  <span className="text-sm font-medium text-surface-800 truncate max-w-[130px] dark:text-surface-200">{item.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`text-xs font-medium ${
                      item.trend > 0 ? 'text-green-600' : 'text-red-500'
                    }`}
                  >
                    {item.trend > 0 ? '+' : ''}{item.trend}%
                  </span>
                  <span className="text-sm font-semibold text-surface-900 dark:text-surface-100">{item.sold}</span>
                </div>
              </div>
              <div className="h-1.5 w-full rounded-full bg-surface-100 dark:bg-surface-700">
                <div
                  className="h-full rounded-full bg-gradient-brand transition-all"
                  style={{ width: `${(item.sold / maxSold) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}
