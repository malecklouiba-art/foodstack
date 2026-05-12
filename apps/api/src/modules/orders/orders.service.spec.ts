import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { PrismaService } from '../../database/prisma.service';
import { EventsGateway } from '../events/events.gateway';
import { NotificationsService } from '../notifications/notifications.service';
import { LoyaltyService } from '../loyalty/loyalty.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { OrderFiltersDto } from './dto/order-filters.dto';

const mockNotifications = { sendOrderConfirmation: jest.fn() };
const mockLoyalty = { earnPoints: jest.fn() };

const mockPrisma = {
  order: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
  },
};

const mockEventsGateway = {
  emitNewOrder: jest.fn(),
  emitOrderStatusUpdate: jest.fn(),
};

describe('OrdersService', () => {
  let service: OrdersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: EventsGateway, useValue: mockEventsGateway },
        { provide: NotificationsService, useValue: mockNotifications },
        { provide: LoyaltyService, useValue: mockLoyalty },
      ],
    }).compile();

    service = module.get<OrdersService>(OrdersService);
    jest.clearAllMocks();
  });

  // ─── createOrder ────────────────────────────────────────────────────────────

  describe('createOrder', () => {
    const dto: CreateOrderDto = {
      restaurantId: 'rest-1',
      customerId: 'cust-1',
      deliveryAddress: '123 Main St',
      deliveryNotes: 'Leave at door',
      items: [
        { menuItemId: 'item-1', quantity: 2, notes: 'No onions' },
      ],
    } as CreateOrderDto;

    it('happy path – creates order and emits event', async () => {
      // Arrange
      const createdOrder = {
        id: 'order-1',
        restaurantId: 'rest-1',
        customerId: 'cust-1',
        status: 'pending',
        items: [{ id: 'oi-1', menuItemId: 'item-1', quantity: 2 }],
      };
      mockPrisma.order.create.mockResolvedValue(createdOrder);

      // Act
      const result = await service.createOrder(dto);

      // Assert
      expect(mockPrisma.order.create).toHaveBeenCalledTimes(1);
      expect(mockPrisma.order.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            restaurantId: 'rest-1',
            customerId: 'cust-1',
            status: 'pending',
          }),
          include: expect.objectContaining({ items: true }),
        }),
      );
      expect(mockEventsGateway.emitNewOrder).toHaveBeenCalledWith(
        'rest-1',
        createdOrder,
      );
      expect(result).toEqual(createdOrder);
    });

    it('propagates prisma error when create fails', async () => {
      // Arrange
      mockPrisma.order.create.mockRejectedValue(new Error('DB error'));

      // Act & Assert
      await expect(service.createOrder(dto)).rejects.toThrow('DB error');
      expect(mockEventsGateway.emitNewOrder).not.toHaveBeenCalled();
    });
  });

  // ─── findById ───────────────────────────────────────────────────────────────

  describe('findById', () => {
    it('returns the order when found', async () => {
      // Arrange
      const order = { id: 'order-1', status: 'pending', items: [] };
      mockPrisma.order.findUnique.mockResolvedValue(order);

      // Act
      const result = await service.findById('order-1');

      // Assert
      expect(result).toEqual(order);
      expect(mockPrisma.order.findUnique).toHaveBeenCalledWith({
        where: { id: 'order-1' },
        include: { items: true },
      });
    });

    it('throws NotFoundException when order does not exist', async () => {
      // Arrange
      mockPrisma.order.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(service.findById('missing')).rejects.toThrow(NotFoundException);
    });
  });

  // ─── updateStatus ───────────────────────────────────────────────────────────

  describe('updateStatus', () => {
    const existingOrder = {
      id: 'order-1',
      restaurantId: 'rest-1',
      status: 'pending',
      items: [],
    };

    const dto: UpdateOrderStatusDto = { status: 'confirmed' } as UpdateOrderStatusDto;

    it('updates status and emits event', async () => {
      // Arrange
      const updatedOrder = {
        ...existingOrder,
        status: 'confirmed',
        updatedAt: new Date('2024-01-01T12:00:00Z'),
      };
      mockPrisma.order.findUnique.mockResolvedValue(existingOrder);
      mockPrisma.order.update.mockResolvedValue(updatedOrder);

      // Act
      const result = await service.updateStatus('order-1', dto);

      // Assert
      expect(mockPrisma.order.update).toHaveBeenCalledWith({
        where: { id: 'order-1' },
        data: { status: 'confirmed' },
      });
      expect(mockEventsGateway.emitOrderStatusUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          orderId: 'order-1',
          restaurantId: 'rest-1',
          status: 'confirmed',
        }),
      );
      expect(result).toEqual(updatedOrder);
    });

    it('throws NotFoundException when order does not exist', async () => {
      // Arrange
      mockPrisma.order.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(service.updateStatus('missing', dto)).rejects.toThrow(NotFoundException);
      expect(mockPrisma.order.update).not.toHaveBeenCalled();
    });
  });

  // ─── getOrders (findByRestaurant / findByCustomer) ──────────────────────────

  describe('findByRestaurant', () => {
    it('returns orders without filters', async () => {
      // Arrange
      const orders = [{ id: 'order-1' }, { id: 'order-2' }];
      mockPrisma.order.findMany.mockResolvedValue(orders);
      const filters: OrderFiltersDto = {} as OrderFiltersDto;

      // Act
      const result = await service.findByRestaurant('rest-1', filters);

      // Assert
      expect(mockPrisma.order.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ restaurantId: 'rest-1' }),
          orderBy: { createdAt: 'desc' },
        }),
      );
      expect(result).toEqual(orders);
    });

    it('applies status filter', async () => {
      // Arrange
      mockPrisma.order.findMany.mockResolvedValue([]);
      const filters: OrderFiltersDto = { status: 'pending' } as OrderFiltersDto;

      // Act
      await service.findByRestaurant('rest-1', filters);

      // Assert
      expect(mockPrisma.order.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ restaurantId: 'rest-1', status: 'pending' }),
        }),
      );
    });

    it('applies date range filters', async () => {
      // Arrange
      mockPrisma.order.findMany.mockResolvedValue([]);
      const filters: OrderFiltersDto = {
        from: '2024-01-01',
        to: '2024-01-31',
      } as OrderFiltersDto;

      // Act
      await service.findByRestaurant('rest-1', filters);

      // Assert
      const call = mockPrisma.order.findMany.mock.calls[0][0];
      expect(call.where.createdAt).toEqual({
        gte: new Date('2024-01-01'),
        lte: new Date('2024-01-31'),
      });
    });
  });

  describe('findByCustomer', () => {
    it('returns orders for a customer', async () => {
      // Arrange
      const orders = [{ id: 'order-1' }];
      mockPrisma.order.findMany.mockResolvedValue(orders);

      // Act
      const result = await service.findByCustomer('cust-1');

      // Assert
      expect(mockPrisma.order.findMany).toHaveBeenCalledWith({
        where: { customerId: 'cust-1' },
        include: { items: true },
        orderBy: { createdAt: 'desc' },
      });
      expect(result).toEqual(orders);
    });
  });

  // ─── cancelOrder ────────────────────────────────────────────────────────────

  describe('cancelOrder', () => {
    it('cancels an order that has not been delivered', async () => {
      // Arrange
      const order = { id: 'order-1', restaurantId: 'rest-1', status: 'confirmed', items: [] };
      const cancelledOrder = { ...order, status: 'cancelled', cancelReason: 'Changed mind' };
      mockPrisma.order.findUnique.mockResolvedValue(order);
      mockPrisma.order.update.mockResolvedValue(cancelledOrder);

      // Act
      const result = await service.cancelOrder('order-1', 'Changed mind');

      // Assert
      expect(mockPrisma.order.update).toHaveBeenCalledWith({
        where: { id: 'order-1' },
        data: { status: 'cancelled', cancelReason: 'Changed mind' },
      });
      expect(result).toEqual(cancelledOrder);
    });

    it('throws BadRequestException when order is already delivered', async () => {
      // Arrange
      const order = { id: 'order-1', status: 'delivered', items: [] };
      mockPrisma.order.findUnique.mockResolvedValue(order);

      // Act & Assert
      await expect(service.cancelOrder('order-1', 'Late')).rejects.toThrow(BadRequestException);
      expect(mockPrisma.order.update).not.toHaveBeenCalled();
    });
  });

  // ─── assignDriver ───────────────────────────────────────────────────────────

  describe('assignDriver', () => {
    it('assigns a driver to an order', async () => {
      // Arrange
      const order = { id: 'order-1', status: 'confirmed', items: [] };
      const updatedOrder = { ...order, driverId: 'driver-1' };
      mockPrisma.order.findUnique.mockResolvedValue(order);
      mockPrisma.order.update.mockResolvedValue(updatedOrder);

      // Act
      const result = await service.assignDriver('order-1', 'driver-1');

      // Assert
      expect(mockPrisma.order.update).toHaveBeenCalledWith({
        where: { id: 'order-1' },
        data: { driverId: 'driver-1' },
      });
      expect(result).toEqual(updatedOrder);
    });
  });
});
