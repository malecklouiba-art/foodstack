import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { EventsGateway } from '../events/events.gateway';
import { PushService } from '../notifications/push.service';
import { UpdateDeliveryStatusDto } from './dto/update-delivery-status.dto';

@Injectable()
export class DeliveryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventsGateway: EventsGateway,
    private readonly pushService: PushService,
  ) {}

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
    // Persist current GPS coordinates on all active deliveries for this driver
    const updated = await this.prisma.delivery.updateMany({
      where: {
        driverId,
        status: {
          in: ['assigned', 'en_route_to_restaurant', 'at_restaurant', 'picked_up', 'en_route_to_customer'],
        },
      },
      data: { currentLatitude: lat, currentLongitude: lng },
    });

    // Broadcast to any active delivery room so customers see real-time movement
    if (updated.count > 0) {
      const deliveries = await this.prisma.delivery.findMany({
        where: {
          driverId,
          status: {
            in: ['assigned', 'en_route_to_restaurant', 'at_restaurant', 'picked_up', 'en_route_to_customer'],
          },
        },
        select: { orderId: true },
      });

      for (const delivery of deliveries) {
        this.eventsGateway.emitDriverLocation(driverId, delivery.orderId, lat, lng);
      }
    }

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
    const updated = await this.prisma.order.update({
      where: { id: orderId },
      data: { driverId },
    });
    this.pushService
      .sendPushNotification(driverId, {
        title: 'Nouvelle livraison',
        body: 'Une commande vous a été assignée',
      })
      .catch(() => null);
    return updated;
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
