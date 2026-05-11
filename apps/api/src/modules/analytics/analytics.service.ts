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

  async getTopItems(restaurantId: string, limit = 10) {
    return this.prisma.menuItem.findMany({
      where: { restaurantId },
      orderBy: { soldCount: 'desc' },
      take: limit,
      select: { id: true, name: true, soldCount: true, price: true, rating: true },
    });
  }

  async getRevenueByPeriod(restaurantId: string, period: 'day' | 'week' | 'month') {
    const daysBack = period === 'day' ? 1 : period === 'week' ? 7 : 30;
    const from = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000);

    const orders = await this.prisma.order.findMany({
      where: {
        restaurantId,
        status: { in: ['delivered'] },
        createdAt: { gte: from },
      },
      select: { total: true, createdAt: true },
      orderBy: { createdAt: 'asc' },
    });

    return { data: orders, period, from };
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
      (d) => d.actualDeliveryAt && d.estimatedDeliveryAt && d.actualDeliveryAt <= d.estimatedDeliveryAt
    ).length;

    return {
      totalDeliveries: deliveries.length,
      onTimeDeliveries: onTime,
      onTimeRate: deliveries.length > 0 ? (onTime / deliveries.length) * 100 : 0,
      avgDistance: deliveries.reduce((acc, d) => acc + (d.distance ?? 0), 0) / (deliveries.length || 1),
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

    return {
      newCustomers: newCustomers.length,
      returningCustomers: returningCustomers.length,
      retentionRate:
        (newCustomers.length + returningCustomers.length) > 0
          ? (returningCustomers.length / (newCustomers.length + returningCustomers.length)) * 100
          : 0,
    };
  }
}
