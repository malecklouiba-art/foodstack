import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class SuperAdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async getPlatformStats() {
    const now = new Date();
    const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfPrevMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

    const [
      totalRestaurants,
      activeRestaurants,
      totalUsers,
      currentMonthOrders,
      prevMonthOrders,
      activeSubscriptions,
    ] = await Promise.all([
      this.prisma.restaurant.count(),
      this.prisma.restaurant.count({ where: { isActive: true } }),
      this.prisma.user.count(),
      this.prisma.order.aggregate({
        where: {
          createdAt: { gte: startOfCurrentMonth },
          status: 'delivered',
        },
        _sum: { total: true },
        _count: true,
      }),
      this.prisma.order.aggregate({
        where: {
          createdAt: { gte: startOfPrevMonth, lte: endOfPrevMonth },
          status: 'delivered',
        },
        _sum: { total: true },
        _count: true,
      }),
      this.prisma.subscription.count({ where: { status: 'active' } }),
    ]);

    const monthlyRevenue = currentMonthOrders._sum.total ?? 0;
    const prevMonthRevenue = prevMonthOrders._sum.total ?? 0;
    const ordersCount = currentMonthOrders._count;
    const prevOrdersCount = prevMonthOrders._count;

    const revenueGrowthRate =
      prevMonthRevenue === 0
        ? null
        : Number((((monthlyRevenue - prevMonthRevenue) / prevMonthRevenue) * 100).toFixed(2));

    const ordersGrowthRate =
      prevOrdersCount === 0
        ? null
        : Number((((ordersCount - prevOrdersCount) / prevOrdersCount) * 100).toFixed(2));

    return {
      totalRestaurants,
      activeRestaurants,
      totalUsers,
      monthlyRevenue,
      ordersCount,
      revenueGrowthRate,
      ordersGrowthRate,
      activeSubscriptions,
    };
  }

  async getRestaurantsOverview(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const now = new Date();
    const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [restaurants, total] = await Promise.all([
      this.prisma.restaurant.findMany({
        skip,
        take: limit,
        include: { subscription: true },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.restaurant.count(),
    ]);

    const data = await Promise.all(
      restaurants.map(async (restaurant) => {
        const [ordersAgg, ratingsAgg] = await Promise.all([
          this.prisma.order.aggregate({
            where: {
              restaurantId: restaurant.id,
              createdAt: { gte: startOfCurrentMonth },
              status: 'delivered',
            },
            _sum: { total: true },
            _count: true,
          }),
          this.prisma.review.aggregate({
            where: { restaurantId: restaurant.id },
            _avg: { rating: true },
          }),
        ]);

        return {
          ...restaurant,
          ordersThisMonth: ordersAgg._count,
          revenueThisMonth: ordersAgg._sum.total ?? 0,
          avgRating: ratingsAgg._avg.rating ?? null,
        };
      }),
    );

    return { data, total, page, limit };
  }

  async getRestaurantDetail(id: string) {
    const now = new Date();
    const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [restaurant, ordersAgg, ratingsAgg, recentOrders] = await Promise.all([
      this.prisma.restaurant.findUniqueOrThrow({
        where: { id },
        include: { subscription: true },
      }),
      this.prisma.order.aggregate({
        where: {
          restaurantId: id,
          createdAt: { gte: startOfCurrentMonth },
          status: 'delivered',
        },
        _sum: { total: true },
        _count: true,
      }),
      this.prisma.review.aggregate({
        where: { restaurantId: id },
        _avg: { rating: true },
        _count: true,
      }),
      this.prisma.order.findMany({
        where: { restaurantId: id },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
    ]);

    return {
      ...restaurant,
      metrics: {
        ordersThisMonth: ordersAgg._count,
        revenueThisMonth: ordersAgg._sum.total ?? 0,
        avgRating: ratingsAgg._avg.rating ?? null,
        totalReviews: ratingsAgg._count,
        recentOrders,
      },
    };
  }

  async suspendRestaurant(id: string) {
    const restaurant = await this.prisma.restaurant.update({
      where: { id },
      data: { isActive: false },
    });

    // Audit log — fire-and-forget
    this.auditService.log({
      action: 'restaurant.suspended',
      entityType: 'Restaurant',
      entityId: id,
    }).catch(() => { /* audit failures must never surface */ });

    return restaurant;
  }

  async activateRestaurant(id: string) {
    const restaurant = await this.prisma.restaurant.update({
      where: { id },
      data: { isActive: true },
    });

    // Audit log — fire-and-forget
    this.auditService.log({
      action: 'restaurant.activated',
      entityType: 'Restaurant',
      entityId: id,
    }).catch(() => { /* audit failures must never surface */ });

    return restaurant;
  }

  async getUsers(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.user.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      this.prisma.user.count(),
    ]);

    return { data, total, page, limit };
  }

  async getAuditLogs(
    page = 1,
    limit = 50,
    filters?: { userId?: string; action?: string },
  ) {
    return this.auditService.query({
      userId: filters?.userId,
      action: filters?.action,
      page,
      limit,
    });
  }
}
