import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { UpdateDeliveryStatusDto } from './dto/update-delivery-status.dto';

const VALID_TRANSITIONS: Record<string, string[]> = {
  'ASSIGNED': ['EN_ROUTE', 'PICKED_UP'],
  'PICKED_UP': ['EN_ROUTE'],
  'EN_ROUTE': ['DELIVERED'],
  'DELIVERED': [],
  'FAILED': [],
};

@Injectable()
export class DeliveryService {
  constructor(private readonly prisma: PrismaService) {}

  async getActiveDeliveries(restaurantId: string) {
    // TODO: Filter by active delivery statuses (ASSIGNED, PICKED_UP, EN_ROUTE)
    return this.prisma.order.findMany({
      where: {
        restaurantId,
        status: { in: ['ASSIGNED', 'PICKED_UP', 'EN_ROUTE'] as any[] },
      },
      include: {
        // TODO: Include driver and delivery tracking details when schema is ready
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateDriverLocation(driverId: string, lat: number, lng: number) {
    // TODO: Persist driver location to a DriverLocation table or Redis for real-time tracking
    // TODO: Broadcast location update via WebSocket/SSE to connected clients
    return { driverId, lat, lng, updatedAt: new Date() };
  }

  async updateDeliveryStatus(orderId: string, dto: UpdateDeliveryStatusDto) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new NotFoundException(`Order #${orderId} not found`);
    // TODO: Validate allowed status transitions
    // TODO: Notify customer via push/SMS when status changes to EN_ROUTE or DELIVERED
    return this.prisma.order.update({
      where: { id: orderId },
      data: { status: dto.status as any },
    });
  }

  async assignDriver(orderId: string, driverId: string) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new NotFoundException(`Order #${orderId} not found`);
    // TODO: Check driver availability before assigning
    // TODO: Send push notification to driver with order details
    return this.prisma.order.update({
      where: { id: orderId },
      data: { driverId },
    });
  }

  async getDeliveryETA(orderId: string) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new NotFoundException(`Order #${orderId} not found`);
    // TODO: Integrate with a mapping service (Google Maps / Mapbox) to compute real ETA
    // TODO: Factor in driver's current location and traffic conditions
    return {
      orderId,
      estimatedMinutes: null,
      message: 'ETA calculation not yet implemented',
    };
  }
}
