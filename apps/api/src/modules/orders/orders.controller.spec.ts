import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, NotFoundException } from '@nestjs/common';
import * as request from 'supertest';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

const mockOrdersService = {
  createOrder: jest.fn(),
  findById: jest.fn(),
  findByRestaurant: jest.fn(),
  findByCustomer: jest.fn(),
  updateStatus: jest.fn(),
  cancelOrder: jest.fn(),
  assignDriver: jest.fn(),
};

describe('OrdersController (integration)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OrdersController],
      providers: [
        { provide: OrdersService, useValue: mockOrdersService },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    app = module.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ─── POST /orders ────────────────────────────────────────────────────────────

  describe('POST /orders', () => {
    it('returns 201 and calls service.createOrder with body', async () => {
      const body = {
        restaurantId: 'rest-1',
        customerId: 'cust-1',
        items: [{ menuItemId: 'item-1', quantity: 2 }],
        deliveryAddress: '123 Main St',
      };
      const created = { id: 'order-1', ...body, status: 'pending' };
      mockOrdersService.createOrder.mockResolvedValue(created);

      const res = await request(app.getHttpServer())
        .post('/orders')
        .send(body)
        .expect(201);

      expect(res.body).toEqual(created);
      expect(mockOrdersService.createOrder).toHaveBeenCalledWith(
        expect.objectContaining({ restaurantId: 'rest-1', customerId: 'cust-1' }),
      );
    });
  });

  // ─── GET /orders/:id ─────────────────────────────────────────────────────────

  describe('GET /orders/:id', () => {
    it('returns 200 and the order when found', async () => {
      const order = { id: 'order-1', status: 'pending', items: [] };
      mockOrdersService.findById.mockResolvedValue(order);

      const res = await request(app.getHttpServer())
        .get('/orders/order-1')
        .expect(200);

      expect(res.body).toEqual(order);
      expect(mockOrdersService.findById).toHaveBeenCalledWith('order-1');
    });

    it('returns 404 when service throws NotFoundException', async () => {
      mockOrdersService.findById.mockRejectedValue(
        new NotFoundException('Order not found'),
      );

      await request(app.getHttpServer())
        .get('/orders/missing-id')
        .expect(404);
    });
  });

  // ─── PATCH /orders/:id/status ────────────────────────────────────────────────

  describe('PATCH /orders/:id/status', () => {
    it('returns 200 and the updated order', async () => {
      const updated = { id: 'order-1', status: 'confirmed' };
      mockOrdersService.updateStatus.mockResolvedValue(updated);

      const res = await request(app.getHttpServer())
        .patch('/orders/order-1/status')
        .send({ status: 'confirmed' })
        .expect(200);

      expect(res.body).toEqual(updated);
      expect(mockOrdersService.updateStatus).toHaveBeenCalledWith(
        'order-1',
        expect.objectContaining({ status: 'confirmed' }),
      );
    });
  });

  // ─── PATCH /orders/:id/cancel ────────────────────────────────────────────────

  describe('PATCH /orders/:id/cancel', () => {
    it('returns 200 and the cancelled order', async () => {
      const cancelled = { id: 'order-1', status: 'cancelled' };
      mockOrdersService.cancelOrder.mockResolvedValue(cancelled);

      const res = await request(app.getHttpServer())
        .patch('/orders/order-1/cancel')
        .send({ reason: 'Changed mind' })
        .expect(200);

      expect(res.body).toEqual(cancelled);
      expect(mockOrdersService.cancelOrder).toHaveBeenCalledWith(
        'order-1',
        'Changed mind',
      );
    });
  });
});
