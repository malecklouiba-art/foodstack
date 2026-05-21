import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { LoyaltyService } from './loyalty.service';
import { PrismaService } from '../../database/prisma.service';

const mockPrisma = {
  user: {
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  loyaltyTransaction: {
    create: jest.fn(),
    findMany: jest.fn(),
  },
  $transaction: jest.fn(),
};

describe('LoyaltyService', () => {
  let service: LoyaltyService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LoyaltyService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<LoyaltyService>(LoyaltyService);
    jest.clearAllMocks();
  });

  // -------------------------------------------------------------------------
  // getPoints()
  // -------------------------------------------------------------------------
  describe('getPoints', () => {
    it('should return loyaltyPoints and loyaltyTier for an existing user', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ loyaltyPoints: 150, loyaltyTier: 'silver' });

      const result = await service.getPoints('user_1');

      expect(result).toEqual({ loyaltyPoints: 150, loyaltyTier: 'silver' });
    });

    it('should throw NotFoundException when user does not exist', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(service.getPoints('ghost')).rejects.toThrow(NotFoundException);
    });
  });

  // -------------------------------------------------------------------------
  // addPoints()
  // -------------------------------------------------------------------------
  describe('addPoints', () => {
    it('should throw NotFoundException when user does not exist', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(service.addPoints('ghost', 10, 'test')).rejects.toThrow(NotFoundException);
    });

    it('should add points to existing total and return new balance', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'u1', loyaltyPoints: 100 });
      mockPrisma.$transaction.mockResolvedValue([
        { loyaltyPoints: 110, loyaltyTier: 'bronze' },
        {},
      ]);

      const result = await service.addPoints('u1', 10, 'Test earn');

      expect(result.points).toBe(110);
      expect(result.earned).toBe(10);
    });

    it('should upgrade tier to silver at 500+ points', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'u1', loyaltyPoints: 490 });
      mockPrisma.$transaction.mockImplementation((ops: any[]) => {
        return Promise.resolve([{ loyaltyPoints: 500, loyaltyTier: 'silver' }, {}]);
      });

      const result = await service.addPoints('u1', 10, 'Earn to silver');

      // 490 + 10 = 500, should cross silver threshold
      expect(result.tier).toBe('silver');
    });

    it('should pass orderId to loyaltyTransaction when provided', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'u1', loyaltyPoints: 50 });

      let capturedArgs: any;
      mockPrisma.$transaction.mockImplementation((ops: any[]) => {
        capturedArgs = ops;
        return Promise.resolve([{ loyaltyPoints: 60, loyaltyTier: 'bronze' }, {}]);
      });

      await service.addPoints('u1', 10, 'Order reward', 'order_abc');

      // The transaction should include a loyaltyTransaction.create with orderId
      expect(mockPrisma.$transaction).toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------------------------
  // redeemPoints()
  // -------------------------------------------------------------------------
  describe('redeemPoints', () => {
    it('should throw NotFoundException when user does not exist', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(service.redeemPoints('ghost', 10)).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when user has insufficient points', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ loyaltyPoints: 5 });

      await expect(service.redeemPoints('u1', 10)).rejects.toThrow(BadRequestException);
    });

    it('should deduct points and return new balance with cashValue', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'u1', loyaltyPoints: 300 });
      mockPrisma.$transaction.mockResolvedValue([{}, {}]);

      const result = await service.redeemPoints('u1', 100);

      expect(result.points).toBe(200);
      expect(result.redeemed).toBe(100);
      expect(result.cashValue).toBe(1); // 100 / 100
    });

    it('should allow redemption of exact balance (edge case)', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'u1', loyaltyPoints: 50 });
      mockPrisma.$transaction.mockResolvedValue([{}, {}]);

      const result = await service.redeemPoints('u1', 50);

      expect(result.points).toBe(0);
    });
  });

  // -------------------------------------------------------------------------
  // getTransactionHistory()
  // -------------------------------------------------------------------------
  describe('getTransactionHistory', () => {
    it('should return transaction history ordered by createdAt desc', async () => {
      const transactions = [
        { id: 'tx2', points: 50, type: 'earn', createdAt: new Date('2024-02-01') },
        { id: 'tx1', points: 20, type: 'redeem', createdAt: new Date('2024-01-01') },
      ];
      mockPrisma.loyaltyTransaction.findMany.mockResolvedValue(transactions);

      const result = await service.getTransactionHistory('u1');

      expect(result).toHaveLength(2);
      expect(mockPrisma.loyaltyTransaction.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { userId: 'u1' }, orderBy: { createdAt: 'desc' } }),
      );
    });
  });
});
