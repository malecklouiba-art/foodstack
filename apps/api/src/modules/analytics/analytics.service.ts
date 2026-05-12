import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

  async getSalesSummary(restaurantId: string, from: Date, to: Date) {
    const orders = await this.prisma.order.findMany({
      where: {
        restaurantId,
        status: 'delivered',
        createdAt: { gte: from, lte: to },
      },
      select: { total: true, subtotal: true, deliveryFee: true, tax: true, createdAt: true },
    });

    const revenue = orders.reduce((acc, o) => acc + o.total, 0);
    const orderCount = orders.length;
    const avgOrderValue = orderCount > 0 ? revenue / orderCount : 0;

    return { revenue, orderCount, avgOrderValue, period: { from, to } };
  }

  async getRevenueTimeSeries(restaurantId: string, from: Date, to: Date) {
    const orders = await this.prisma.order.findMany({
      where: {
        restaurantId,
        status: { in: ['delivered', 'confirmed'] },
        createdAt: { gte: from, lte: to },
      },
      select: { total: true, createdAt: true },
      orderBy: { createdAt: 'asc' },
    });

    // Bucket by day
    const buckets = new Map<string, { revenue: number; orders: number }>();
    for (const order of orders) {
      const day = order.createdAt.toISOString().slice(0, 10);
      const existing = buckets.get(day) ?? { revenue: 0, orders: 0 };
      buckets.set(day, { revenue: existing.revenue + order.total, orders: existing.orders + 1 });
    }

    // Fill missing days with 0
    const result: { date: string; revenue: number; orders: number }[] = [];
    const cursor = new Date(from);
    while (cursor <= to) {
      const day = cursor.toISOString().slice(0, 10);
      const bucket = buckets.get(day) ?? { revenue: 0, orders: 0 };
      result.push({ date: day, ...bucket });
      cursor.setDate(cursor.getDate() + 1);
    }

    return result;
  }

  async getHourlyOrders(restaurantId: string, date?: Date) {
    const target = date ?? new Date();
    const from = new Date(target);
    from.setHours(0, 0, 0, 0);
    const to = new Date(target);
    to.setHours(23, 59, 59, 999);

    const orders = await this.prisma.order.findMany({
      where: { restaurantId, createdAt: { gte: from, lte: to } },
      select: { createdAt: true },
    });

    const hourBuckets = Array.from({ length: 24 }, (_, h) => ({ hour: h, orders: 0 }));
    for (const order of orders) {
      const h = order.createdAt.getHours();
      hourBuckets[h].orders++;
    }

    return hourBuckets.filter((b) => b.hour >= 8 && b.hour <= 23);
  }

  async getOrderTypeBreakdown(restaurantId: string, from: Date, to: Date) {
    const result = await this.prisma.order.groupBy({
      by: ['type'],
      where: { restaurantId, createdAt: { gte: from, lte: to } },
      _count: { id: true },
    });

    const total = result.reduce((s, r) => s + r._count.id, 0);
    return result.map((r) => ({
      type: r.type,
      count: r._count.id,
      percent: total > 0 ? Math.round((r._count.id / total) * 100) : 0,
    }));
  }

  async getTopItems(restaurantId: string, limit = 10) {
    // Aggregate from OrderItem to get real sales counts
    const items = await this.prisma.orderItem.groupBy({
      by: ['menuItemId'],
      where: { order: { restaurantId, status: { in: ['delivered', 'confirmed'] } } },
      _sum: { quantity: true, subtotal: true },
      _count: { id: true },
      orderBy: { _sum: { quantity: 'desc' } },
      take: limit,
    });

    const menuItems = await this.prisma.menuItem.findMany({
      where: { id: { in: items.map((i) => i.menuItemId) } },
      select: { id: true, name: true, price: true },
    });

    const menuMap = new Map(menuItems.map((m) => [m.id, m]));

    return items.map((item) => ({
      menuItemId: item.menuItemId,
      name: menuMap.get(item.menuItemId)?.name ?? 'Unknown',
      price: menuMap.get(item.menuItemId)?.price ?? 0,
      totalQuantity: item._sum.quantity ?? 0,
      totalRevenue: item._sum.subtotal ?? 0,
    }));
  }

  async getDeliveryPerformance(restaurantId: string) {
    const deliveries = await this.prisma.delivery.findMany({
      where: { order: { restaurantId }, status: 'delivered' },
      select: {
        actualDeliveryAt: true,
        estimatedDeliveryAt: true,
        distance: true,
        duration: true,
      },
    });

    const onTime = deliveries.filter(
      (d) => d.actualDeliveryAt && d.estimatedDeliveryAt && d.actualDeliveryAt <= d.estimatedDeliveryAt,
    ).length;

    return {
      totalDeliveries: deliveries.length,
      onTimeDeliveries: onTime,
      onTimeRate: deliveries.length > 0 ? (onTime / deliveries.length) * 100 : 0,
      avgDistance: deliveries.reduce((acc, d) => acc + (d.distance ?? 0), 0) / (deliveries.length || 1),
      avgDuration: deliveries.reduce((acc, d) => acc + (d.duration ?? 0), 0) / (deliveries.length || 1),
    };
  }

  async getCustomerInsights(restaurantId: string) {
    const [newCustomers, returningCustomers] = await Promise.all([
      this.prisma.order.groupBy({
        by: ['customerId'],
        where: { restaurantId },
        having: { customerId: { _count: { equals: 1 } } },
        _count: true,
      }),
      this.prisma.order.groupBy({
        by: ['customerId'],
        where: { restaurantId },
        having: { customerId: { _count: { gt: 1 } } },
        _count: true,
      }),
    ]);

    const total = newCustomers.length + returningCustomers.length;
    return {
      newCustomers: newCustomers.length,
      returningCustomers: returningCustomers.length,
      retentionRate: total > 0 ? (returningCustomers.length / total) * 100 : 0,
    };
  }

  async getDashboardKpis(restaurantId: string) {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    const [currentWeek, previousWeek, uniqueCustomers] = await Promise.all([
      this.getSalesSummary(restaurantId, weekAgo, now),
      this.getSalesSummary(restaurantId, twoWeeksAgo, weekAgo),
      this.prisma.order.groupBy({
        by: ['customerId'],
        where: { restaurantId, createdAt: { gte: weekAgo } },
        _count: true,
      }),
    ]);

    const revChange = previousWeek.revenue > 0
      ? ((currentWeek.revenue - previousWeek.revenue) / previousWeek.revenue) * 100
      : 0;
    const ordersChange = previousWeek.orderCount > 0
      ? ((currentWeek.orderCount - previousWeek.orderCount) / previousWeek.orderCount) * 100
      : 0;

    return {
      revenue: currentWeek.revenue,
      revenueChange: Math.round(revChange * 10) / 10,
      orders: currentWeek.orderCount,
      ordersChange: Math.round(ordersChange * 10) / 10,
      avgOrderValue: currentWeek.avgOrderValue,
      uniqueCustomers: uniqueCustomers.length,
    };
  }
}
