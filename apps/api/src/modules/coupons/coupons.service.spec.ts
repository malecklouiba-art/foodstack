import { Test, TestingModule } from '@nestjs/testing';
import { CouponsService } from './coupons.service';
import { PrismaService } from '../../database/prisma.service';

const mockPrisma = {
  coupon: {
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    findMany: jest.fn(),
  },
};

describe('CouponsService', () => {
  let service: CouponsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CouponsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<CouponsService>(CouponsService);
    jest.clearAllMocks();
  });

  // ---------------------------------------------------------------------------
  // validate()
  // ---------------------------------------------------------------------------
  describe('validate', () => {
    const tomorrow = new Date(Date.now() + 86_400_000);
    const yesterday = new Date(Date.now() - 86_400_000);

    const validCoupon = {
      id: 'c1',
      code: 'SAVE10',
      active: true,
      discountType: 'percent',
      discountValue: 10,
      minOrderValue: 20,
      maxUses: 100,
      usedCount: 5,
      expiresAt: tomorrow,
      restaurantId: 'r1',
    };

    // ── happy paths ────────────────────────────────────────────────────────

    it('should return valid:true with correct percent discount', async () => {
      mockPrisma.coupon.findFirst.mockResolvedValue(validCoupon);
      mockPrisma.coupon.update.mockResolvedValue({ ...validCoupon, usedCount: 6 });

      const result = await service.validate({
        code: 'SAVE10',
        restaurantId: 'r1',
        orderTotal: 50,
      });

      expect(result.valid).toBe(true);
      expect(result.discount).toBe(5); // 10% of 50
      expect(result.finalTotal).toBe(45);
      expect(result.discountType).toBe('percent');
    });

    it('should return valid:true with correct fixed discount', async () => {
      mockPrisma.coupon.findFirst.mockResolvedValue({
        ...validCoupon,
        discountType: 'fixed',
        discountValue: 8,
      });
      mockPrisma.coupon.update.mockResolvedValue({});

      const result = await service.validate({
        code: 'SAVE10',
        restaurantId: 'r1',
        orderTotal: 50,
      });

      expect(result.valid).toBe(true);
      expect(result.discount).toBe(8);
      expect(result.finalTotal).toBe(42);
    });

    it('should cap fixed discount at orderTotal (discount cannot exceed order)', async () => {
      mockPrisma.coupon.findFirst.mockResolvedValue({
        ...validCoupon,
        discountType: 'fixed',
        discountValue: 100,
        minOrderValue: 0,
      });
      mockPrisma.coupon.update.mockResolvedValue({});

      const result = await service.validate({
        code: 'SAVE10',
        restaurantId: 'r1',
        orderTotal: 30,
      });

      expect(result.valid).toBe(true);
      expect(result.discount).toBe(30); // capped by Math.min(100, 30)
      expect(result.finalTotal).toBe(0);
    });

    it('should increment usedCount when coupon is valid', async () => {
      mockPrisma.coupon.findFirst.mockResolvedValue(validCoupon);
      mockPrisma.coupon.update.mockResolvedValue({});

      await service.validate({ code: 'SAVE10', restaurantId: 'r1', orderTotal: 50 });

      expect(mockPrisma.coupon.update).toHaveBeenCalledWith({
        where: { id: 'c1' },
        data: { usedCount: { increment: 1 } },
      });
    });

    it('should accept coupon with no expiry (expiresAt: null)', async () => {
      mockPrisma.coupon.findFirst.mockResolvedValue({ ...validCoupon, expiresAt: null });
      mockPrisma.coupon.update.mockResolvedValue({});

      const result = await service.validate({
        code: 'SAVE10',
        restaurantId: 'r1',
        orderTotal: 50,
      });

      expect(result.valid).toBe(true);
    });

    it('should accept coupon with no maxUses limit (maxUses: null)', async () => {
      mockPrisma.coupon.findFirst.mockResolvedValue({ ...validCoupon, maxUses: null });
      mockPrisma.coupon.update.mockResolvedValue({});

      const result = await service.validate({
        code: 'SAVE10',
        restaurantId: 'r1',
        orderTotal: 50,
      });

      expect(result.valid).toBe(true);
    });

    // ── invalid paths (return valid:false, no throw) ───────────────────────

    it('should return valid:false when coupon is not found', async () => {
      mockPrisma.coupon.findFirst.mockResolvedValue(null);

      const result = await service.validate({
        code: 'INVALID',
        restaurantId: 'r1',
        orderTotal: 50,
      });

      expect(result.valid).toBe(false);
      expect(result.discount).toBe(0);
      expect(result.message).toBe('Coupon introuvable');
    });

    it('should return valid:false when coupon is inactive', async () => {
      mockPrisma.coupon.findFirst.mockResolvedValue({ ...validCoupon, active: false });

      const result = await service.validate({
        code: 'SAVE10',
        restaurantId: 'r1',
        orderTotal: 50,
      });

      expect(result.valid).toBe(false);
      expect(result.message).toBe('Coupon inactif');
      expect(result.discount).toBe(0);
      expect(result.finalTotal).toBe(50);
    });

    it('should return valid:false when coupon is expired', async () => {
      mockPrisma.coupon.findFirst.mockResolvedValue({ ...validCoupon, expiresAt: yesterday });

      const result = await service.validate({
        code: 'SAVE10',
        restaurantId: 'r1',
        orderTotal: 50,
      });

      expect(result.valid).toBe(false);
      expect(result.message).toBe('Coupon expiré');
    });

    it('should return valid:false when max uses is reached', async () => {
      mockPrisma.coupon.findFirst.mockResolvedValue({
        ...validCoupon,
        usedCount: 100,
        maxUses: 100,
      });

      const result = await service.validate({
        code: 'SAVE10',
        restaurantId: 'r1',
        orderTotal: 50,
      });

      expect(result.valid).toBe(false);
      expect(result.message).toBe('Coupon épuisé');
    });

    it('should return valid:false when order total is below minimum', async () => {
      mockPrisma.coupon.findFirst.mockResolvedValue(validCoupon); // minOrderValue: 20

      const result = await service.validate({
        code: 'SAVE10',
        restaurantId: 'r1',
        orderTotal: 15,
      });

      expect(result.valid).toBe(false);
      expect(result.message).toContain('20');
    });

    it('should NOT increment usedCount when coupon is invalid', async () => {
      mockPrisma.coupon.findFirst.mockResolvedValue({ ...validCoupon, active: false });

      await service.validate({ code: 'SAVE10', restaurantId: 'r1', orderTotal: 50 });

      expect(mockPrisma.coupon.update).not.toHaveBeenCalled();
    });

    it('should look up coupon by uppercase code regardless of input case', async () => {
      mockPrisma.coupon.findFirst.mockResolvedValue(validCoupon);
      mockPrisma.coupon.update.mockResolvedValue({});

      await service.validate({ code: 'save10', restaurantId: 'r1', orderTotal: 50 });

      expect(mockPrisma.coupon.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ code: 'SAVE10' }),
        }),
      );
    });

    it('should scope lookup to the given restaurantId', async () => {
      mockPrisma.coupon.findFirst.mockResolvedValue(null);

      await service.validate({ code: 'SAVE10', restaurantId: 'r99', orderTotal: 50 });

      expect(mockPrisma.coupon.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ restaurantId: 'r99' }),
        }),
      );
    });
  });

  // ---------------------------------------------------------------------------
  // findOne()
  // ---------------------------------------------------------------------------
  describe('findOne', () => {
    it('should return a coupon when found', async () => {
      const coupon = { id: 'c1', code: 'X' };
      mockPrisma.coupon.findUnique.mockResolvedValue(coupon);

      const result = await service.findOne('c1');

      expect(result).toEqual(coupon);
    });

    it('should throw NotFoundException when coupon does not exist', async () => {
      mockPrisma.coupon.findUnique.mockResolvedValue(null);

      await expect(service.findOne('unknown')).rejects.toThrow('Coupon #unknown not found');
    });
  });
});
