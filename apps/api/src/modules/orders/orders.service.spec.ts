import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { PrismaService } from '../../database/prisma.service';
import { RealtimeGateway } from '../realtime/realtime.gateway';
import { NotificationsService } from '../notifications/notifications.service';
import { PushService } from '../notifications/push.service';
import { LoyaltyService } from '../loyalty/loyalty.service';
import { AuditService } from '../audit/audit.service';
import { UpdateOrderStatusDto, OrderStatus } from './dto/update-order-status.dto';
import { CreateOrderDto } from './dto/create-order.dto';

// ---------------------------------------------------------------------------
// Prisma mock
// ---------------------------------------------------------------------------
const mockPrisma = {
  order: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  menuItem: {
    findMany: jest.fn(),
  },
  user: {
    findUnique: jest.fn(),
  },
  review: {
    upsert: jest.fn(),
  },
};

// ---------------------------------------------------------------------------
// Other dependency mocks
// ---------------------------------------------------------------------------
const mockRealtime = {
  emitOrderCreated: jest.fn(),
  emitOrderStatusUpdated: jest.fn(),
  emitOrderReady: jest.fn(),
};

const mockNotifications = {
  sendOrderConfirmation: jest.fn().mockResolvedValue(undefined),
  sendOrderStatusUpdate: jest.fn().mockResolvedValue(undefined),
};

const mockPush = {
  sendExpoNotification: jest.fn().mockResolvedValue(undefined),
};

const mockLoyalty = {
  addPoints: jest.fn().mockResolvedValue(undefined),
};

const mockAudit = {
  log: jest.fn().mockResolvedValue(undefined),
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function makeOrder(overrides: Record<string, unknown> = {}) {
  return {
    id: 'order_1',
    orderNumber: 'ORD-001',
    restaurantId: 'rest_1',
    customerId: 'customer_1',
    driverId: null,
    status: 'pending',
    subtotal: 10.0,
    deliveryFee: 2.9,
    tax: 1.0,
    total: 13.9,
    items: [],
    ...overrides,
  };
}

describe('OrdersService', () => {
  let service: OrdersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: RealtimeGateway, useValue: mockRealtime },
        { provide: NotificationsService, useValue: mockNotifications },
        { provide: PushService, useValue: mockPush },
        { provide: LoyaltyService, useValue: mockLoyalty },
        { provide: AuditService, useValue: mockAudit },
      ],
    }).compile();

    service = module.get<OrdersService>(OrdersService);
    jest.clearAllMocks();
  });

  // ---------------------------------------------------------------------------
  // findByIdForUser()
  // ---------------------------------------------------------------------------
  describe('findByIdForUser', () => {
    it('should return order when caller is the customer who placed it', async () => {
      const order = makeOrder({ customerId: 'customer_1' });
      mockPrisma.order.findUnique.mockResolvedValue(order);

      const result = await service.findByIdForUser('order_1', {
        id: 'customer_1',
        role: 'customer',
      });

      expect(result).toEqual(order);
    });

    it('should return order when caller is an admin', async () => {
      const order = makeOrder({ customerId: 'customer_1' });
      mockPrisma.order.findUnique.mockResolvedValue(order);

      const result = await service.findByIdForUser('order_1', {
        id: 'admin_1',
        role: 'super_admin',
      });

      expect(result).toEqual(order);
    });

    it('should return order when caller is staff', async () => {
      const order = makeOrder({ customerId: 'customer_1' });
      mockPrisma.order.findUnique.mockResolvedValue(order);

      const result = await service.findByIdForUser('order_1', {
        id: 'staff_1',
        role: 'staff',
      });

      expect(result).toEqual(order);
    });

    it('should throw ForbiddenException when caller is a different customer', async () => {
      const order = makeOrder({ customerId: 'customer_1' });
      mockPrisma.order.findUnique.mockResolvedValue(order);

      await expect(
        service.findByIdForUser('order_1', { id: 'other_customer', role: 'customer' }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw NotFoundException when order does not exist', async () => {
      mockPrisma.order.findUnique.mockResolvedValue(null);

      await expect(
        service.findByIdForUser('nonexistent_order', { id: 'customer_1', role: 'customer' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ---------------------------------------------------------------------------
  // cancelOrder()
  // ---------------------------------------------------------------------------
  describe('cancelOrder', () => {
    it('should cancel when caller owns the order', async () => {
      const order = makeOrder({ customerId: 'customer_1', status: 'pending' });
      mockPrisma.order.findUnique.mockResolvedValue(order);
      mockPrisma.order.update.mockResolvedValue({ ...order, status: 'cancelled', cancelReason: 'Changed mind' });
      mockAudit.log.mockResolvedValue(undefined);

      const result = await service.cancelOrder('order_1', 'Changed mind', {
        id: 'customer_1',
        role: 'customer',
      });

      expect(mockPrisma.order.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'order_1' },
          data: expect.objectContaining({ status: 'cancelled', cancelReason: 'Changed mind' }),
        }),
      );
      expect(result.status).toBe('cancelled');
    });

    it('should cancel when caller is admin', async () => {
      const order = makeOrder({ customerId: 'customer_1', status: 'confirmed' });
      mockPrisma.order.findUnique.mockResolvedValue(order);
      mockPrisma.order.update.mockResolvedValue({ ...order, status: 'cancelled', cancelReason: 'Admin cancelled' });

      const result = await service.cancelOrder('order_1', 'Admin cancelled', {
        id: 'admin_1',
        role: 'super_admin',
      });

      expect(result.status).toBe('cancelled');
    });

    it('should throw ForbiddenException when caller is a different customer', async () => {
      const order = makeOrder({ customerId: 'customer_1', status: 'pending' });
      mockPrisma.order.findUnique.mockResolvedValue(order);

      await expect(
        service.cancelOrder('order_1', 'reason', { id: 'other_customer', role: 'customer' }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw BadRequestException when order is already delivered', async () => {
      const order = makeOrder({ customerId: 'customer_1', status: 'delivered' });
      mockPrisma.order.findUnique.mockResolvedValue(order);

      await expect(
        service.cancelOrder('order_1', 'too late', { id: 'customer_1', role: 'customer' }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ---------------------------------------------------------------------------
  // updateStatus()
  // ---------------------------------------------------------------------------
  describe('updateStatus', () => {
    it('should throw BadRequestException for invalid status transitions (pending → delivered)', async () => {
      const order = makeOrder({ status: 'pending' });
      mockPrisma.order.findUnique.mockResolvedValue(order);

      const dto: UpdateOrderStatusDto = { status: OrderStatus.DELIVERED };

      await expect(service.updateStatus('order_1', dto)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when transitioning from cancelled to any status', async () => {
      const order = makeOrder({ status: 'cancelled' });
      mockPrisma.order.findUnique.mockResolvedValue(order);

      const dto: UpdateOrderStatusDto = { status: OrderStatus.CONFIRMED };

      await expect(service.updateStatus('order_1', dto)).rejects.toThrow(BadRequestException);
    });

    it('should allow valid transition: pending → confirmed', async () => {
      const order = makeOrder({ status: 'pending', customerId: null });
      mockPrisma.order.findUnique.mockResolvedValue(order);
      const updatedOrder = {
        ...order,
        status: 'confirmed',
        items: [],
        restaurant: { name: 'Test', street: '1 Rue', city: 'Paris', latitude: null, longitude: null },
      };
      mockPrisma.order.update.mockResolvedValue(updatedOrder);

      const dto: UpdateOrderStatusDto = { status: OrderStatus.CONFIRMED };
      const result = await service.updateStatus('order_1', dto);

      expect(result.status).toBe('confirmed');
      expect(mockPrisma.order.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'order_1' },
          data: { status: 'confirmed' },
        }),
      );
    });

    it('should allow valid transition: confirmed → preparing', async () => {
      const order = makeOrder({ status: 'confirmed', customerId: null });
      mockPrisma.order.findUnique.mockResolvedValue(order);
      const updatedOrder = {
        ...order,
        status: 'preparing',
        items: [],
        restaurant: { name: 'Test', street: null, city: null, latitude: null, longitude: null },
      };
      mockPrisma.order.update.mockResolvedValue(updatedOrder);

      const dto: UpdateOrderStatusDto = { status: OrderStatus.PREPARING };
      const result = await service.updateStatus('order_1', dto);

      expect(result.status).toBe('preparing');
    });
  });

  // ---------------------------------------------------------------------------
  // createOrder()
  // ---------------------------------------------------------------------------
  describe('createOrder', () => {
    it('should look up real menu item prices and not trust client-submitted prices', async () => {
      mockPrisma.menuItem.findMany.mockResolvedValue([
        { id: 'item_1', name: 'Burger', price: 12.5 },
      ]);

      const createdOrder = {
        id: 'order_new',
        orderNumber: 'ORD-12345',
        restaurantId: 'rest_1',
        customerId: 'customer_1',
        subtotal: 12.5,
        deliveryFee: 2.9,
        tax: 1.25,
        total: 16.65,
        status: 'pending',
        items: [{ name: 'Burger', quantity: 1, price: 12.5 }],
        customer: { email: 'customer@example.com' },
      };
      mockPrisma.order.create.mockResolvedValue(createdOrder);
      mockAudit.log.mockResolvedValue(undefined);

      const dto: CreateOrderDto = {
        restaurantId: 'rest_1',
        customerId: 'customer_1',
        items: [{ menuItemId: 'item_1', quantity: 1 }],
      };

      await service.createOrder(dto);

      // Verify prisma.menuItem.findMany was called with the correct item IDs
      expect(mockPrisma.menuItem.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: { in: ['item_1'] } },
        }),
      );
    });

    it('should calculate total as subtotal + delivery fee + tax', async () => {
      // Two burgers at 10.00 each → subtotal = 20.00
      // tax = 20.00 * 0.10 = 2.00
      // delivery = 2.90
      // total = 20.00 + 2.00 + 2.90 = 24.90
      mockPrisma.menuItem.findMany.mockResolvedValue([
        { id: 'item_a', name: 'Burger', price: 10.0 },
      ]);

      let capturedCreateData: Record<string, unknown> = {};
      mockPrisma.order.create.mockImplementation(({ data }: { data: Record<string, unknown> }) => {
        capturedCreateData = data;
        return Promise.resolve({
          id: 'order_calc',
          orderNumber: 'ORD-calc',
          restaurantId: 'rest_1',
          customerId: 'customer_1',
          subtotal: data.subtotal,
          deliveryFee: data.deliveryFee,
          tax: data.tax,
          total: data.total,
          status: 'pending',
          items: [],
          customer: null,
        });
      });

      const dto: CreateOrderDto = {
        restaurantId: 'rest_1',
        customerId: 'customer_1',
        items: [{ menuItemId: 'item_a', quantity: 2 }],
      };

      await service.createOrder(dto);

      expect(capturedCreateData.subtotal).toBe(20.0);
      expect(capturedCreateData.deliveryFee).toBe(2.9);
      expect(capturedCreateData.tax).toBe(2.0);
      expect(capturedCreateData.total).toBe(24.9);
    });

    it('should calculate total correctly for multiple different items', async () => {
      // item_x: 8.00 × 2 = 16.00
      // item_y: 5.00 × 1 = 5.00
      // subtotal = 21.00, tax = 2.10, delivery = 2.90, total = 26.00
      mockPrisma.menuItem.findMany.mockResolvedValue([
        { id: 'item_x', name: 'Pizza', price: 8.0 },
        { id: 'item_y', name: 'Salad', price: 5.0 },
      ]);

      let capturedCreateData: Record<string, unknown> = {};
      mockPrisma.order.create.mockImplementation(({ data }: { data: Record<string, unknown> }) => {
        capturedCreateData = data;
        return Promise.resolve({
          id: 'order_multi',
          orderNumber: 'ORD-multi',
          restaurantId: 'rest_1',
          customerId: 'customer_1',
          subtotal: data.subtotal,
          deliveryFee: data.deliveryFee,
          tax: data.tax,
          total: data.total,
          status: 'pending',
          items: [],
          customer: null,
        });
      });

      const dto: CreateOrderDto = {
        restaurantId: 'rest_1',
        customerId: 'customer_1',
        items: [
          { menuItemId: 'item_x', quantity: 2 },
          { menuItemId: 'item_y', quantity: 1 },
        ],
      };

      await service.createOrder(dto);

      expect(capturedCreateData.subtotal).toBe(21.0);
      expect(capturedCreateData.tax).toBe(2.1);
      expect(capturedCreateData.total).toBe(26.0);
    });

    it('should emit an order created realtime event after creating the order', async () => {
      mockPrisma.menuItem.findMany.mockResolvedValue([
        { id: 'item_ev', name: 'Wrap', price: 7.0 },
      ]);
      mockPrisma.order.create.mockResolvedValue({
        id: 'order_ev',
        orderNumber: 'ORD-ev',
        restaurantId: 'rest_ev',
        customerId: 'customer_ev',
        subtotal: 7.0,
        deliveryFee: 2.9,
        tax: 0.7,
        total: 10.6,
        status: 'pending',
        items: [],
        customer: null,
      });

      const dto: CreateOrderDto = {
        restaurantId: 'rest_ev',
        customerId: 'customer_ev',
        items: [{ menuItemId: 'item_ev', quantity: 1 }],
      };

      await service.createOrder(dto);

      expect(mockRealtime.emitOrderCreated).toHaveBeenCalledWith(
        expect.objectContaining({ orderId: 'order_ev', restaurantId: 'rest_ev' }),
      );
    });
  });
});
