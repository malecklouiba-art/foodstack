import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, NotFoundException, BadRequestException } from '@nestjs/common';
import * as request from 'supertest';
import { CouponsController } from './coupons.controller';
import { CouponsService } from './coupons.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

const makeCoupon = (overrides: Record<string, unknown> = {}) => ({
  id: 'coupon-1',
  code: 'SUMMER20',
  discountType: 'PERCENT',
  discountValue: 20,
  minOrderAmount: null,
  maxUses: null,
  usedCount: 0,
  expiresAt: null,
  restaurantId: null,
  active: true,
  createdAt: '2025-01-01T00:00:00.000Z',
  updatedAt: '2025-01-01T00:00:00.000Z',
  ...overrides,
});

describe('CouponsController (HTTP)', () => {
  let app: INestApplication;
  let mockCouponsService: {
    create: jest.Mock;
    findAll: jest.Mock;
    findOne: jest.Mock;
    applyCoupon: jest.Mock;
    remove: jest.Mock;
  };

  beforeEach(async () => {
    mockCouponsService = {
      create: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
      applyCoupon: jest.fn(),
      remove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [CouponsController],
      providers: [{ provide: CouponsService, useValue: mockCouponsService }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    app = module.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  // -------------------------------------------------------------------------
  // POST /coupons
  // -------------------------------------------------------------------------
  describe('POST /coupons', () => {
    it('returns 201 with the created coupon', async () => {
      const coupon = makeCoupon();
      mockCouponsService.create.mockResolvedValue(coupon);

      const dto = {
        code: 'SUMMER20',
        discountType: 'PERCENT',
        discountValue: 20,
      };

      await request(app.getHttpServer())
        .post('/coupons')
        .send(dto)
        .expect(201)
        .expect((res) => {
          expect(res.body.code).toBe('SUMMER20');
          expect(mockCouponsService.create).toHaveBeenCalledWith(expect.objectContaining(dto));
        });
    });
  });

  // -------------------------------------------------------------------------
  // GET /coupons
  // -------------------------------------------------------------------------
  describe('GET /coupons', () => {
    it('returns 200 with list of coupons', async () => {
      const coupons = [makeCoupon(), makeCoupon({ id: 'coupon-2', code: 'FIXED5' })];
      mockCouponsService.findAll.mockResolvedValue(coupons);

      await request(app.getHttpServer())
        .get('/coupons')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveLength(2);
          expect(mockCouponsService.findAll).toHaveBeenCalled();
        });
    });

    it('passes restaurantId query param to service', async () => {
      mockCouponsService.findAll.mockResolvedValue([makeCoupon()]);

      await request(app.getHttpServer())
        .get('/coupons?restaurantId=rest-1')
        .expect(200)
        .expect(() => {
          expect(mockCouponsService.findAll).toHaveBeenCalledWith('rest-1');
        });
    });
  });

  // -------------------------------------------------------------------------
  // GET /coupons/:id
  // -------------------------------------------------------------------------
  describe('GET /coupons/:id', () => {
    it('returns 200 with the coupon', async () => {
      const coupon = makeCoupon();
      mockCouponsService.findOne.mockResolvedValue(coupon);

      await request(app.getHttpServer())
        .get('/coupons/coupon-1')
        .expect(200)
        .expect((res) => {
          expect(res.body.id).toBe('coupon-1');
          expect(mockCouponsService.findOne).toHaveBeenCalledWith('coupon-1');
        });
    });

    it('returns 404 when coupon not found', async () => {
      mockCouponsService.findOne.mockRejectedValue(new NotFoundException('Coupon #missing not found'));

      await request(app.getHttpServer())
        .get('/coupons/missing')
        .expect(404);
    });
  });

  // -------------------------------------------------------------------------
  // DELETE /coupons/:id
  // -------------------------------------------------------------------------
  describe('DELETE /coupons/:id', () => {
    it('returns 200 with the deleted coupon', async () => {
      const coupon = makeCoupon();
      mockCouponsService.remove.mockResolvedValue(coupon);

      await request(app.getHttpServer())
        .delete('/coupons/coupon-1')
        .expect(200)
        .expect((res) => {
          expect(res.body.id).toBe('coupon-1');
          expect(mockCouponsService.remove).toHaveBeenCalledWith('coupon-1');
        });
    });
  });

  // -------------------------------------------------------------------------
  // POST /coupons/apply
  // -------------------------------------------------------------------------
  describe('POST /coupons/apply', () => {
    it('returns 200 with discount calculation', async () => {
      const applyResult = { discount: 10, finalTotal: 90, couponId: 'coupon-1' };
      mockCouponsService.applyCoupon.mockResolvedValue(applyResult);

      const dto = { code: 'SUMMER20', orderTotal: 100 };

      await request(app.getHttpServer())
        .post('/coupons/apply')
        .send(dto)
        .expect(201)
        .expect((res) => {
          expect(res.body.discount).toBe(10);
          expect(res.body.finalTotal).toBe(90);
          expect(mockCouponsService.applyCoupon).toHaveBeenCalledWith(expect.objectContaining(dto));
        });
    });

    it('returns 400 when coupon is invalid (BadRequestException)', async () => {
      mockCouponsService.applyCoupon.mockRejectedValue(
        new BadRequestException('Coupon code not found'),
      );

      const dto = { code: 'INVALID', orderTotal: 100 };

      await request(app.getHttpServer())
        .post('/coupons/apply')
        .send(dto)
        .expect(400);
    });
  });
});
