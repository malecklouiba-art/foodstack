import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { CouponsService } from './coupons.service';
import { PrismaService } from '../../database/prisma.service';
import { DiscountType } from './dto/create-coupon.dto';

const makeCoupon = (overrides: Record<string, unknown> = {}) => ({
  id: 'coupon-1',
  code: 'SUMMER20',
  discountType: 'PERCENT',
  discountValue: 10,
  minOrderAmount: null,
  maxUses: null,
  usedCount: 0,
  expiresAt: null,
  restaurantId: null,
  active: true,
  createdAt: new Date('2025-01-01'),
  updatedAt: new Date('2025-01-01'),
  ...overrides,
});

describe('CouponsService', () => {
  let service: CouponsService;
  let prismaMock: {
    coupon: {
      create: jest.Mock;
      findUnique: jest.Mock;
      findMany: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
    };
  };

  beforeEach(async () => {
    prismaMock = {
      coupon: {
        create: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CouponsService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    service = module.get<CouponsService>(CouponsService);
  });

  // ------------------------------------------------------------------
  // create
  // ------------------------------------------------------------------
  describe('create', () => {
    it('creates and returns a coupon', async () => {
      const dto = {
        code: 'summer20',
        discountType: DiscountType.PERCENT,
        discountValue: 20,
      };
      const created = makeCoupon({ code: 'SUMMER20', discountValue: 20 });
      prismaMock.coupon.create.mockResolvedValue(created);

      const result = await service.create(dto);

      expect(prismaMock.coupon.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ code: 'SUMMER20', discountValue: 20 }),
        }),
      );
      expect(result).toEqual(created);
    });
  });

  // ------------------------------------------------------------------
  // findAll
  // ------------------------------------------------------------------
  describe('findAll', () => {
    it('calls findMany with restaurantId filter when provided', async () => {
      prismaMock.coupon.findMany.mockResolvedValue([]);
      await service.findAll('rest-1');
      expect(prismaMock.coupon.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { restaurantId: 'rest-1' } }),
      );
    });

    it('calls findMany with no filter when restaurantId is omitted', async () => {
      prismaMock.coupon.findMany.mockResolvedValue([]);
      await service.findAll();
      expect(prismaMock.coupon.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: undefined }),
      );
    });
  });

  // ------------------------------------------------------------------
  // findOne
  // ------------------------------------------------------------------
  describe('findOne', () => {
    it('returns the coupon when found', async () => {
      const coupon = makeCoupon();
      prismaMock.coupon.findUnique.mockResolvedValue(coupon);
      await expect(service.findOne('coupon-1')).resolves.toEqual(coupon);
    });

    it('throws NotFoundException when coupon is not found', async () => {
      prismaMock.coupon.findUnique.mockResolvedValue(null);
      await expect(service.findOne('missing')).rejects.toThrow(NotFoundException);
    });
  });

  // ------------------------------------------------------------------
  // applyCoupon
  // ------------------------------------------------------------------
  describe('applyCoupon', () => {
    const baseDto = { code: 'SAVE10', orderTotal: 100, restaurantId: undefined };

    it('happy path: PERCENT discount — 10% off 100 → discount=10, finalTotal=90', async () => {
      prismaMock.coupon.findUnique.mockResolvedValue(
        makeCoupon({ code: 'SAVE10', discountType: 'PERCENT', discountValue: 10 }),
      );
      const result = await service.applyCoupon(baseDto);
      expect(result.discount).toBe(10);
      expect(result.finalTotal).toBe(90);
      expect(result.couponId).toBe('coupon-1');
    });

    it('happy path: FIXED discount — 5€ off 100 → discount=5, finalTotal=95', async () => {
      prismaMock.coupon.findUnique.mockResolvedValue(
        makeCoupon({ code: 'SAVE10', discountType: 'FIXED', discountValue: 5 }),
      );
      const result = await service.applyCoupon(baseDto);
      expect(result.discount).toBe(5);
      expect(result.finalTotal).toBe(95);
    });

    it('throws BadRequestException when coupon is inactive', async () => {
      prismaMock.coupon.findUnique.mockResolvedValue(
        makeCoupon({ code: 'SAVE10', active: false }),
      );
      await expect(service.applyCoupon(baseDto)).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException when coupon has expired', async () => {
      prismaMock.coupon.findUnique.mockResolvedValue(
        makeCoupon({ code: 'SAVE10', expiresAt: new Date('2000-01-01') }),
      );
      await expect(service.applyCoupon(baseDto)).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException when maxUses has been reached', async () => {
      prismaMock.coupon.findUnique.mockResolvedValue(
        makeCoupon({ code: 'SAVE10', maxUses: 5, usedCount: 5 }),
      );
      await expect(service.applyCoupon(baseDto)).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException when orderTotal is below minOrderAmount', async () => {
      prismaMock.coupon.findUnique.mockResolvedValue(
        makeCoupon({ code: 'SAVE10', minOrderAmount: 200 }),
      );
      await expect(service.applyCoupon(baseDto)).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException when restaurantId does not match', async () => {
      prismaMock.coupon.findUnique.mockResolvedValue(
        makeCoupon({ code: 'SAVE10', restaurantId: 'rest-A' }),
      );
      await expect(
        service.applyCoupon({ ...baseDto, restaurantId: 'rest-B' }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ------------------------------------------------------------------
  // redeemCoupon
  // ------------------------------------------------------------------
  describe('redeemCoupon', () => {
    it('calls prisma.coupon.update with increment usedCount', async () => {
      const updated = makeCoupon({ usedCount: 1 });
      prismaMock.coupon.update.mockResolvedValue(updated);

      const result = await service.redeemCoupon('coupon-1');

      expect(prismaMock.coupon.update).toHaveBeenCalledWith({
        where: { id: 'coupon-1' },
        data: { usedCount: { increment: 1 } },
      });
      expect(result).toEqual(updated);
    });
  });

  // ------------------------------------------------------------------
  // remove
  // ------------------------------------------------------------------
  describe('remove', () => {
    it('finds then deletes the coupon', async () => {
      const coupon = makeCoupon();
      prismaMock.coupon.findUnique.mockResolvedValue(coupon);
      prismaMock.coupon.delete.mockResolvedValue(coupon);

      const result = await service.remove('coupon-1');

      expect(prismaMock.coupon.findUnique).toHaveBeenCalledWith({ where: { id: 'coupon-1' } });
      expect(prismaMock.coupon.delete).toHaveBeenCalledWith({ where: { id: 'coupon-1' } });
      expect(result).toEqual(coupon);
    });

    it('throws NotFoundException if coupon is missing', async () => {
      prismaMock.coupon.findUnique.mockResolvedValue(null);
      await expect(service.remove('missing')).rejects.toThrow(NotFoundException);
      expect(prismaMock.coupon.delete).not.toHaveBeenCalled();
    });
  });
});
