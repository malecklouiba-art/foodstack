import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { DeliveryService } from './delivery.service';
import { PrismaService } from '../../database/prisma.service';
import { EventsGateway } from '../events/events.gateway';
import { PushService } from '../notifications/push.service';
import { DeliveryStatus, UpdateDeliveryStatusDto } from './dto/update-delivery-status.dto';

const mockPrismaService = {
  order: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  delivery: {
    updateMany: jest.fn(),
    findMany: jest.fn(),
  },
};

const mockEventsGateway = {
  emitDriverLocation: jest.fn(),
  emitOrderStatusUpdate: jest.fn(),
};

const mockPushService = {
  sendPushNotification: jest.fn(),
};

describe('DeliveryService', () => {
  let service: DeliveryService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DeliveryService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: EventsGateway, useValue: mockEventsGateway },
        { provide: PushService, useValue: mockPushService },
      ],
    }).compile();

    service = module.get<DeliveryService>(DeliveryService);
  });

  describe('getActiveDeliveries', () => {
    it('returns orders with active statuses for the given restaurantId', async () => {
      const orders = [
        { id: 'order-1', status: 'ASSIGNED', restaurantId: 'rest-1' },
        { id: 'order-2', status: 'EN_ROUTE', restaurantId: 'rest-1' },
      ];
      mockPrismaService.order.findMany.mockResolvedValue(orders);

      const result = await service.getActiveDeliveries('rest-1');

      expect(mockPrismaService.order.findMany).toHaveBeenCalledWith({
        where: {
          restaurantId: 'rest-1',
          status: { in: ['ASSIGNED', 'PICKED_UP', 'EN_ROUTE'] },
        },
        include: {},
        orderBy: { createdAt: 'desc' },
      });
      expect(result).toEqual(orders);
    });

    it('returns an empty array when no active deliveries exist', async () => {
      mockPrismaService.order.findMany.mockResolvedValue([]);

      const result = await service.getActiveDeliveries('rest-999');

      expect(result).toEqual([]);
    });
  });

  describe('updateDriverLocation', () => {
    it('updates GPS coordinates on active deliveries and emits socket events', async () => {
      mockPrismaService.delivery.updateMany.mockResolvedValue({ count: 2 });
      mockPrismaService.delivery.findMany.mockResolvedValue([
        { orderId: 'order-1' },
        { orderId: 'order-2' },
      ]);

      const result = await service.updateDriverLocation('driver-1', 48.8566, 2.3522);

      expect(mockPrismaService.delivery.updateMany).toHaveBeenCalledWith({
        where: {
          driverId: 'driver-1',
          status: {
            in: ['assigned', 'en_route_to_restaurant', 'at_restaurant', 'picked_up', 'en_route_to_customer'],
          },
        },
        data: { currentLatitude: 48.8566, currentLongitude: 2.3522 },
      });

      expect(mockEventsGateway.emitDriverLocation).toHaveBeenCalledTimes(2);
      expect(mockEventsGateway.emitDriverLocation).toHaveBeenCalledWith('driver-1', 'order-1', 48.8566, 2.3522);
      expect(mockEventsGateway.emitDriverLocation).toHaveBeenCalledWith('driver-1', 'order-2', 48.8566, 2.3522);

      expect(result).toMatchObject({ driverId: 'driver-1', lat: 48.8566, lng: 2.3522 });
      expect(result.updatedAt).toBeInstanceOf(Date);
    });

    it('does not query deliveries or emit events when no records were updated', async () => {
      mockPrismaService.delivery.updateMany.mockResolvedValue({ count: 0 });

      const result = await service.updateDriverLocation('driver-1', 0, 0);

      expect(mockPrismaService.delivery.findMany).not.toHaveBeenCalled();
      expect(mockEventsGateway.emitDriverLocation).not.toHaveBeenCalled();
      expect(result).toMatchObject({ driverId: 'driver-1', lat: 0, lng: 0 });
    });
  });

  describe('updateDeliveryStatus', () => {
    const dto: UpdateDeliveryStatusDto = { status: DeliveryStatus.EN_ROUTE };

    it('updates the order status and returns the updated order', async () => {
      const order = { id: 'order-1', status: 'ASSIGNED' };
      const updated = { id: 'order-1', status: 'EN_ROUTE' };
      mockPrismaService.order.findUnique.mockResolvedValue(order);
      mockPrismaService.order.update.mockResolvedValue(updated);

      const result = await service.updateDeliveryStatus('order-1', dto);

      expect(mockPrismaService.order.findUnique).toHaveBeenCalledWith({ where: { id: 'order-1' } });
      expect(mockPrismaService.order.update).toHaveBeenCalledWith({
        where: { id: 'order-1' },
        data: { status: DeliveryStatus.EN_ROUTE },
      });
      expect(result).toEqual(updated);
    });

    it('throws NotFoundException when the order does not exist', async () => {
      mockPrismaService.order.findUnique.mockResolvedValue(null);

      await expect(service.updateDeliveryStatus('missing-order', dto)).rejects.toThrow(NotFoundException);
      expect(mockPrismaService.order.update).not.toHaveBeenCalled();
    });
  });

  describe('assignDriver', () => {
    it('assigns a driver to the order, fires push notification, and returns updated order', async () => {
      const order = { id: 'order-1', driverId: null };
      const updated = { id: 'order-1', driverId: 'driver-1' };
      mockPrismaService.order.findUnique.mockResolvedValue(order);
      mockPrismaService.order.update.mockResolvedValue(updated);
      mockPushService.sendPushNotification.mockResolvedValue(undefined);

      const result = await service.assignDriver('order-1', 'driver-1');

      expect(mockPrismaService.order.findUnique).toHaveBeenCalledWith({ where: { id: 'order-1' } });
      expect(mockPrismaService.order.update).toHaveBeenCalledWith({
        where: { id: 'order-1' },
        data: { driverId: 'driver-1' },
      });
      expect(result).toEqual(updated);

      // Allow microtasks to settle so the fire-and-forget push runs
      await Promise.resolve();
      expect(mockPushService.sendPushNotification).toHaveBeenCalledWith('driver-1', {
        title: 'Nouvelle livraison',
        body: 'Une commande vous a été assignée',
      });
    });

    it('throws NotFoundException when the order does not exist', async () => {
      mockPrismaService.order.findUnique.mockResolvedValue(null);

      await expect(service.assignDriver('missing-order', 'driver-1')).rejects.toThrow(NotFoundException);
      expect(mockPrismaService.order.update).not.toHaveBeenCalled();
    });

    it('swallows push notification errors silently', async () => {
      const order = { id: 'order-1', driverId: null };
      const updated = { id: 'order-1', driverId: 'driver-1' };
      mockPrismaService.order.findUnique.mockResolvedValue(order);
      mockPrismaService.order.update.mockResolvedValue(updated);
      mockPushService.sendPushNotification.mockRejectedValue(new Error('push failed'));

      await expect(service.assignDriver('order-1', 'driver-1')).resolves.toEqual(updated);
    });
  });

  describe('getDeliveryETA', () => {
    it('returns a stub ETA object for a known order', async () => {
      mockPrismaService.order.findUnique.mockResolvedValue({ id: 'order-1' });

      const result = await service.getDeliveryETA('order-1');

      expect(result).toEqual({
        orderId: 'order-1',
        estimatedMinutes: null,
        message: 'ETA calculation not yet implemented',
      });
    });

    it('throws NotFoundException when the order does not exist', async () => {
      mockPrismaService.order.findUnique.mockResolvedValue(null);

      await expect(service.getDeliveryETA('missing-order')).rejects.toThrow(NotFoundException);
    });
  });
});
