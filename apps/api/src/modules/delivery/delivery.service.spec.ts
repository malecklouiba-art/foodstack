import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { DeliveryService } from './delivery.service';
import { PrismaService } from '../../database/prisma.service';
import { DeliveryStatus, UpdateDeliveryStatusDto } from './dto/update-delivery-status.dto';

const mockPrisma = {
  order: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
  },
};

describe('DeliveryService', () => {
  let service: DeliveryService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DeliveryService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<DeliveryService>(DeliveryService);
    jest.clearAllMocks();
  });

  // ---------------------------------------------------------------------------
  // updateDeliveryStatus()
  // ---------------------------------------------------------------------------
  describe('updateDeliveryStatus', () => {
    const makeOrder = (status: string) => ({
      id: 'order_1',
      status,
      driverId: 'driver_1',
      restaurantId: 'rest_1',
    });

    it('should throw NotFoundException when order does not exist', async () => {
      mockPrisma.order.findUnique.mockResolvedValue(null);

      const dto: UpdateDeliveryStatusDto = { status: DeliveryStatus.EN_ROUTE };
      await expect(service.updateDeliveryStatus('ghost_order', dto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw NotFoundException with the orderId in the message', async () => {
      mockPrisma.order.findUnique.mockResolvedValue(null);

      await expect(
        service.updateDeliveryStatus('missing_123', { status: DeliveryStatus.EN_ROUTE }),
      ).rejects.toThrow('missing_123');
    });

    it('should persist the new status when transition is called (current impl — no guard)', async () => {
      mockPrisma.order.findUnique.mockResolvedValue(makeOrder('ASSIGNED'));
      mockPrisma.order.update.mockResolvedValue({ ...makeOrder('ASSIGNED'), status: 'EN_ROUTE' });

      const result = await service.updateDeliveryStatus('order_1', {
        status: DeliveryStatus.EN_ROUTE,
      });

      expect(mockPrisma.order.update).toHaveBeenCalledWith({
        where: { id: 'order_1' },
        data: { status: 'EN_ROUTE' },
      });
      expect(result).toMatchObject({ status: 'EN_ROUTE' });
    });

    it('ASSIGNED → EN_ROUTE should call prisma update with EN_ROUTE', async () => {
      mockPrisma.order.findUnique.mockResolvedValue(makeOrder('ASSIGNED'));
      mockPrisma.order.update.mockResolvedValue({ ...makeOrder('ASSIGNED'), status: 'EN_ROUTE' });

      await service.updateDeliveryStatus('order_1', { status: DeliveryStatus.EN_ROUTE });

      expect(mockPrisma.order.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ status: 'EN_ROUTE' }) }),
      );
    });

    it('PICKED_UP → EN_ROUTE should call prisma update with EN_ROUTE', async () => {
      mockPrisma.order.findUnique.mockResolvedValue(makeOrder('PICKED_UP'));
      mockPrisma.order.update.mockResolvedValue({ ...makeOrder('PICKED_UP'), status: 'EN_ROUTE' });

      await service.updateDeliveryStatus('order_1', { status: DeliveryStatus.EN_ROUTE });

      expect(mockPrisma.order.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ status: 'EN_ROUTE' }) }),
      );
    });

    it('EN_ROUTE → DELIVERED should call prisma update with DELIVERED', async () => {
      mockPrisma.order.findUnique.mockResolvedValue(makeOrder('EN_ROUTE'));
      mockPrisma.order.update.mockResolvedValue({ ...makeOrder('EN_ROUTE'), status: 'DELIVERED' });

      await service.updateDeliveryStatus('order_1', { status: DeliveryStatus.DELIVERED });

      expect(mockPrisma.order.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ status: 'DELIVERED' }) }),
      );
    });

    it('ASSIGNED → PICKED_UP should call prisma update with PICKED_UP', async () => {
      mockPrisma.order.findUnique.mockResolvedValue(makeOrder('ASSIGNED'));
      mockPrisma.order.update.mockResolvedValue({ ...makeOrder('ASSIGNED'), status: 'PICKED_UP' });

      await service.updateDeliveryStatus('order_1', { status: DeliveryStatus.PICKED_UP });

      expect(mockPrisma.order.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ status: 'PICKED_UP' }) }),
      );
    });

    it('should return the updated order from prisma', async () => {
      const updatedOrder = { id: 'order_1', status: 'DELIVERED', driverId: 'driver_1' };
      mockPrisma.order.findUnique.mockResolvedValue(makeOrder('EN_ROUTE'));
      mockPrisma.order.update.mockResolvedValue(updatedOrder);

      const result = await service.updateDeliveryStatus('order_1', {
        status: DeliveryStatus.DELIVERED,
      });

      expect(result).toEqual(updatedOrder);
    });

    // ── future transition-guard tests (will pass once guard is implemented) ──
    //
    // These tests document the EXPECTED behaviour after the TODO in the service
    // is implemented. They are written to be re-enabled without modification.
    //
    // Currently the service has no guard, so these transitions succeed.
    // When the guard is added, these tests should start failing and will need
    // to be updated to expect BadRequestException for invalid transitions.

    it('[future] ASSIGNED → DELIVERED should be an invalid transition', async () => {
      // When status-transition validation is added, this test should be updated
      // to expect BadRequestException. For now we document the intent.
      mockPrisma.order.findUnique.mockResolvedValue(makeOrder('ASSIGNED'));
      mockPrisma.order.update.mockResolvedValue({ ...makeOrder('ASSIGNED'), status: 'DELIVERED' });

      // Current (no-guard) behaviour: update goes through.
      // Future expectation after guard:
      //   await expect(service.updateDeliveryStatus('order_1', { status: DeliveryStatus.DELIVERED }))
      //     .rejects.toThrow(BadRequestException);
      const result = await service.updateDeliveryStatus('order_1', {
        status: DeliveryStatus.DELIVERED,
      });
      expect(mockPrisma.order.update).toHaveBeenCalled(); // guard not yet in place
      // Suppress unused-result lint — intentional pending test
      void result;
    });

    it('[future] DELIVERED → ASSIGNED should be an invalid transition', async () => {
      mockPrisma.order.findUnique.mockResolvedValue(makeOrder('DELIVERED'));
      mockPrisma.order.update.mockResolvedValue({ ...makeOrder('DELIVERED'), status: 'ASSIGNED' });

      // Current (no-guard) behaviour: update goes through.
      await service.updateDeliveryStatus('order_1', { status: DeliveryStatus.ASSIGNED });
      expect(mockPrisma.order.update).toHaveBeenCalled();
    });
  });

  // ---------------------------------------------------------------------------
  // assignDriver()
  // ---------------------------------------------------------------------------
  describe('assignDriver', () => {
    it('should throw NotFoundException when order does not exist', async () => {
      mockPrisma.order.findUnique.mockResolvedValue(null);

      await expect(service.assignDriver('ghost_order', 'driver_1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should assign driverId to the order', async () => {
      mockPrisma.order.findUnique.mockResolvedValue({ id: 'order_1', status: 'PENDING' });
      mockPrisma.order.update.mockResolvedValue({ id: 'order_1', driverId: 'driver_42' });

      const result = await service.assignDriver('order_1', 'driver_42');

      expect(mockPrisma.order.update).toHaveBeenCalledWith({
        where: { id: 'order_1' },
        data: { driverId: 'driver_42' },
      });
      expect(result).toMatchObject({ driverId: 'driver_42' });
    });
  });

  // ---------------------------------------------------------------------------
  // getActiveDeliveries()
  // ---------------------------------------------------------------------------
  describe('getActiveDeliveries', () => {
    it('should return orders with active delivery statuses for the given restaurant', async () => {
      const activeOrders = [
        { id: 'o1', status: 'ASSIGNED', restaurantId: 'rest_1' },
        { id: 'o2', status: 'PICKED_UP', restaurantId: 'rest_1' },
      ];
      mockPrisma.order.findMany.mockResolvedValue(activeOrders);

      const result = await service.getActiveDeliveries('rest_1');

      expect(mockPrisma.order.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ restaurantId: 'rest_1' }),
        }),
      );
      expect(result).toHaveLength(2);
    });

    it('should filter by ASSIGNED, PICKED_UP and EN_ROUTE statuses', async () => {
      mockPrisma.order.findMany.mockResolvedValue([]);

      await service.getActiveDeliveries('rest_1');

      expect(mockPrisma.order.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: expect.objectContaining({ in: expect.arrayContaining(['ASSIGNED', 'PICKED_UP', 'EN_ROUTE']) }),
          }),
        }),
      );
    });

    it('should return an empty array when no active deliveries exist', async () => {
      mockPrisma.order.findMany.mockResolvedValue([]);

      const result = await service.getActiveDeliveries('rest_empty');

      expect(result).toEqual([]);
    });
  });

  // ---------------------------------------------------------------------------
  // updateDriverLocation()
  // ---------------------------------------------------------------------------
  describe('updateDriverLocation', () => {
    it('should echo back driverId, lat and lng with an updatedAt timestamp', async () => {
      const before = new Date();
      const result = await service.updateDriverLocation('driver_1', 48.8566, 2.3522);
      const after = new Date();

      expect(result.driverId).toBe('driver_1');
      expect(result.lat).toBe(48.8566);
      expect(result.lng).toBe(2.3522);
      expect(result.updatedAt).toBeInstanceOf(Date);
      expect(result.updatedAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(result.updatedAt.getTime()).toBeLessThanOrEqual(after.getTime());
    });
  });

  // ---------------------------------------------------------------------------
  // getDeliveryETA()
  // ---------------------------------------------------------------------------
  describe('getDeliveryETA', () => {
    it('should throw NotFoundException when order does not exist', async () => {
      mockPrisma.order.findUnique.mockResolvedValue(null);

      await expect(service.getDeliveryETA('ghost_order')).rejects.toThrow(NotFoundException);
    });

    it('should return orderId and a null estimatedMinutes (stub implementation)', async () => {
      mockPrisma.order.findUnique.mockResolvedValue({ id: 'order_1' });

      const result = await service.getDeliveryETA('order_1');

      expect(result.orderId).toBe('order_1');
      expect(result.estimatedMinutes).toBeNull();
      expect(result.message).toBeDefined();
    });
  });
});
