import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { RealtimeGateway } from '../realtime/realtime.gateway';
import { UpdateDeliveryStatusDto } from './dto/update-delivery-status.dto';

// Delivery-phase transitions — supports both DTO enum values and Prisma status values
const VALID_TRANSITIONS: Record<string, string[]> = {
  // Prisma OrderStatus values
  ready:      ['delivering'],
  delivering: ['delivered'],
  delivered:  [],
  // Legacy DTO enum values (kept for backward compat)
  ASSIGNED:   ['EN_ROUTE', 'PICKED_UP'],
  PICKED_UP:  ['EN_ROUTE'],
  EN_ROUTE:   ['DELIVERED'],
  DELIVERED:  [],
  FAILED:     [],
};

@Injectable()
export class DeliveryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly realtime: RealtimeGateway,
  ) {}

  async getActiveDeliveries(restaurantId: string) {
    return this.prisma.order.findMany({
      where: {
        restaurantId,
        status: { in: ['ready', 'delivering'] as any[] },
      },
      include: {
        items: true,
        customer: { select: { id: true, firstName: true, lastName: true, phone: true } },
        delivery: {
          include: {
            driver: { select: { id: true, firstName: true, lastName: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateDriverLocation(driverId: string, lat: number, lng: number) {
    // Broadcast via WebSocket so customers tracking orders get live updates
    const activeOrders = await this.prisma.order.findMany({
      where: { driverId, status: 'delivering' as any },
      select: { id: true, restaurantId: true },
    });

    for (const order of activeOrders) {
      this.realtime['server']?.to(`order:${order.id}`).emit('driver:location', {
        orderId: order.id, driverId, lat, lng,
      });
    }

    return { driverId, lat, lng, updatedAt: new Date() };
  }

  async updateDeliveryStatus(orderId: string, dto: UpdateDeliveryStatusDto) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new NotFoundException(`Order #${orderId} not found`);

    const currentStatus = order.status as string;
    const newStatus = dto.status as string;

    const allowed = VALID_TRANSITIONS[currentStatus] ?? [];
    if (!allowed.includes(newStatus)) {
      throw new BadRequestException(
        `Cannot transition from ${currentStatus} to ${newStatus}`,
      );
    }

    const updated = await this.prisma.order.update({
      where: { id: orderId },
      data: { status: newStatus as any },
    });

    this.realtime.emitOrderStatusUpdated({
      orderId: updated.id,
      orderNumber: updated.orderNumber,
      restaurantId: updated.restaurantId,
      status: updated.status as string,
      customerId: updated.customerId ?? undefined,
      total: updated.total,
      itemCount: 0,
    });

    return updated;
  }

  async assignDriver(orderId: string, driverId: string) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new NotFoundException(`Order #${orderId} not found`);
    return this.prisma.order.update({
      where: { id: orderId },
      data: { driverId },
    });
  }

  async getPendingOrdersForDriver(driverId: string) {
    const orders = await this.prisma.order.findMany({
      where: {
        driverId,
        status: { in: ['ready', 'assigned', 'delivering'] as any[] },
      },
      include: {
        items: { select: { id: true } },
        customer: { select: { firstName: true, lastName: true } },
      },
      orderBy: { createdAt: 'asc' },
    });

    return orders.map((o) => ({
      id: o.id,
      orderId: o.id,
      orderNumber: o.orderNumber,
      customer: {
        firstName: o.customer?.firstName ?? '',
        lastName: o.customer?.lastName ?? '',
      },
      deliveryAddress: o.deliveryAddress ?? '',
      totalItems: o.items.length,
      total: o.total,
      estimatedDistance: null,
      estimatedArrival: o.estimatedDeliveryTime?.toISOString() ?? null,
      status: o.status,
    }));
  }

  async getDeliveryETA(orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      select: { id: true, estimatedDeliveryTime: true, status: true },
    });
    if (!order) throw new NotFoundException(`Order #${orderId} not found`);

    if (order.estimatedDeliveryTime) {
      const remainingMs = order.estimatedDeliveryTime.getTime() - Date.now();
      const remainingMin = Math.max(0, Math.round(remainingMs / 60000));
      return { orderId, estimatedMinutes: remainingMin, estimatedAt: order.estimatedDeliveryTime };
    }

    return { orderId, estimatedMinutes: null };
  }
}
