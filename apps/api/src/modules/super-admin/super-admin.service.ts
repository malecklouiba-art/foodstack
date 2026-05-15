import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class SuperAdminService {
  constructor(private readonly prisma: PrismaService) {}

  async getStats() {
    const [
      totalRestaurants,
      activeRestaurants,
      totalUsers,
      totalOrders,
      revenueAgg,
      activeSubscriptions,
    ] = await Promise.all([
      this.prisma.restaurant.count(),
      this.prisma.restaurant.count({ where: { isActive: true } }),
      this.prisma.user.count(),
      this.prisma.order.count(),
      this.prisma.order.aggregate({ _sum: { total: true } }),
      this.prisma.subscription.count({ where: { status: 'active' } }),
    ]);

    return {
      totalRestaurants,
      activeRestaurants,
      totalUsers,
      totalOrders,
      totalRevenue: revenueAgg._sum.total ?? 0,
      activeSubscriptions,
    };
  }

  async getRestaurants(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.restaurant.findMany({
        skip,
        take: limit,
        include: { subscription: true },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.restaurant.count(),
    ]);

    return { data, total, page, limit };
  }

  suspendRestaurant(id: string) {
    return this.prisma.restaurant.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async getAuditLogs(page = 1, limit = 50) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.auditLog.count(),
    ]);

    return { data, total, page, limit };
  }
}
