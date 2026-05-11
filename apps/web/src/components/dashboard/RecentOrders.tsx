'use client';

import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

const orders = [
  { id: 'ORD-8815', customer: 'Alice B.', total: 34.50, status: 'delivered', time: '13:24' },
  { id: 'ORD-8814', customer: 'Bob M.', total: 22.90, status: 'cancelled', time: '12:58' },
  { id: 'ORD-8813', customer: 'Claire P.', total: 56.80, status: 'delivered', time: '12:41' },
  { id: 'ORD-8812', customer: 'David K.', total: 18.50, status: 'delivered', time: '12:15' },
];

const statusConfig = {
  delivered: { label: 'Livrée', variant: 'success' as const },
  cancelled: { label: 'Annulée', variant: 'danger' as const },
};

export function RecentOrders() {
  return (
    <Card padding="none">
      <CardHeader className="border-b border-surface-100 px-6 py-5">
        <CardTitle>Commandes récentes</CardTitle>
      </CardHeader>
      <div className="divide-y divide-surface-100">
        {orders.map((order) => {
          const status = statusConfig[order.status as keyof typeof statusConfig];
          return (
            <div key={order.id} className="flex items-center justify-between px-6 py-3.5 hover:bg-surface-50">
              <div>
                <p className="text-sm font-medium text-surface-900">{order.id}</p>
                <p className="text-xs text-surface-400">{order.customer} · {order.time}</p>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant={status.variant}>{status.label}</Badge>
                <span className="text-sm font-semibold text-surface-900">{order.total.toFixed(2)}€</span>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
