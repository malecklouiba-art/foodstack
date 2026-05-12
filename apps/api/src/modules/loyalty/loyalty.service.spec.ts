import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { LoyaltyService } from './loyalty.service';
import { PrismaService } from '../../database/prisma.service';

// ---------------------------------------------------------------------------
// Mock PrismaService
// ---------------------------------------------------------------------------
const mockPrismaService = {
  user: {
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  loyaltyTransaction: {
    findMany: jest.fn(),
    create: jest.fn(),
  },
  $transaction: jest.fn(),
  restaurantSettings: {
    findUnique: jest.fn(),
  },
};

describe('LoyaltyService', () => {
  let service: LoyaltyService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LoyaltyService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<LoyaltyService>(LoyaltyService);
    jest.clearAllMocks();
  });

  // -------------------------------------------------------------------------
  // earnPoints
  // -------------------------------------------------------------------------
  describe('earnPoints', () => {
    const userId = 'user-1';
    const orderId = 'order-1';
    const restaurantId = 'rest-1';

    beforeEach(() => {
      // restaurantSettings returns null → DEFAULT_POINTS_PER_EURO (10) used
      mockPrismaService.restaurantSettings.findUnique.mockReturnValue({
        catch: jest.fn().mockResolvedValue(null),
      });
      mockPrismaService.$transaction.mockResolvedValue([null, null]);
    });

    it('calculates points correctly using default rate (10 pts/€)', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: userId,
        loyaltyPoints: 0,
      });

      const result = await service.earnPoints(userId, orderId, 25.5, restaurantId);

      // Math.floor(25.5 * 10) = 255
      expect(result.points).toBe(255);
      expect(result.newTotal).toBe(255);
    });

    it('uses custom pointsPerEuro from restaurantSettings', async () => {
      mockPrismaService.restaurantSettings.findUnique.mockReturnValue({
        catch: jest.fn().mockResolvedValue({ pointsPerEuro: 5 }),
      });
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: userId,
        loyaltyPoints: 0,
      });

      const result = await service.earnPoints(userId, orderId, 20, restaurantId);

      // Math.floor(20 * 5) = 100
      expect(result.points).toBe(100);
    });

    it('creates a LoyaltyTransaction via $transaction', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: userId,
        loyaltyPoints: 100,
      });

      await service.earnPoints(userId, orderId, 10, restaurantId);

      expect(mockPrismaService.$transaction).toHaveBeenCalledTimes(1);
    });

    it('increments loyaltyPoints and updates tier', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: userId,
        loyaltyPoints: 490, // just below silver (500)
      });

      const result = await service.earnPoints(userId, orderId, 2, restaurantId); // +20 → 510

      expect(result.newTotal).toBe(510);
      expect(result.tier).toBe('silver');
    });

    it('returns correct { points, newTotal, tier }', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: userId,
        loyaltyPoints: 950, // just below gold (1000)
      });

      const result = await service.earnPoints(userId, orderId, 6, restaurantId); // +60 → 1010

      expect(result).toEqual({ points: 60, newTotal: 1010, tier: 'gold' });
    });

    it('throws NotFoundException when user does not exist', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(
        service.earnPoints(userId, orderId, 10, restaurantId),
      ).rejects.toThrow(NotFoundException);
    });

    it('assigns platinum tier when newTotal >= 2500', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: userId,
        loyaltyPoints: 2400,
      });

      const result = await service.earnPoints(userId, orderId, 10, restaurantId); // +100 → 2500

      expect(result.tier).toBe('platinum');
    });
  });

  // -------------------------------------------------------------------------
  // redeemPoints
  // -------------------------------------------------------------------------
  describe('redeemPoints', () => {
    const userId = 'user-1';

    beforeEach(() => {
      mockPrismaService.$transaction.mockResolvedValue([null, null]);
    });

    it('happy path: deducts points and returns correct newTotal', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: userId,
        loyaltyPoints: 300,
      });

      const result = await service.redeemPoints(userId, 100);

      expect(result.pointsRedeemed).toBe(100);
      expect(result.newTotal).toBe(200);
    });

    it('throws BadRequestException when user has insufficient points', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: userId,
        loyaltyPoints: 50,
      });

      await expect(service.redeemPoints(userId, 100)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('throws NotFoundException when user does not exist', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.redeemPoints(userId, 50)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('calls $transaction to decrement points and create transaction', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: userId,
        loyaltyPoints: 200,
      });

      await service.redeemPoints(userId, 50, 'order-99');

      expect(mockPrismaService.$transaction).toHaveBeenCalledTimes(1);
    });

    it('allows redeeming exactly the full balance', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: userId,
        loyaltyPoints: 100,
      });

      const result = await service.redeemPoints(userId, 100);

      expect(result.newTotal).toBe(0);
    });
  });

  // -------------------------------------------------------------------------
  // getBalance
  // -------------------------------------------------------------------------
  describe('getBalance', () => {
    const userId = 'user-1';

    it('returns { points, tier, nextTier, pointsToNextTier } for bronze user', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        loyaltyPoints: 100,
        loyaltyTier: 'bronze',
      });

      const result = await service.getBalance(userId);

      expect(result).toEqual({
        points: 100,
        tier: 'bronze',
        nextTier: 'silver',
        pointsToNextTier: 400, // silver threshold 500 - 100
      });
    });

    it('returns correct nextTier and pointsToNextTier for silver user', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        loyaltyPoints: 750,
        loyaltyTier: 'silver',
      });

      const result = await service.getBalance(userId);

      expect(result.nextTier).toBe('gold');
      expect(result.pointsToNextTier).toBe(250); // gold 1000 - 750
    });

    it('returns nextTier null for platinum user', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        loyaltyPoints: 3000,
        loyaltyTier: 'platinum',
      });

      const result = await service.getBalance(userId);

      expect(result.nextTier).toBeNull();
      expect(result.pointsToNextTier).toBe(0);
    });

    it('throws NotFoundException when user does not exist', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.getBalance(userId)).rejects.toThrow(NotFoundException);
    });
  });

  // -------------------------------------------------------------------------
  // getHistory
  // -------------------------------------------------------------------------
  describe('getHistory', () => {
    const userId = 'user-1';

    it('calls findMany with correct where, orderBy and take', async () => {
      const transactions = [{ id: 'tx-1', points: 100 }];
      mockPrismaService.loyaltyTransaction.findMany.mockResolvedValue(transactions);

      const result = await service.getHistory(userId);

      expect(mockPrismaService.loyaltyTransaction.findMany).toHaveBeenCalledWith({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 50,
      });
      expect(result).toEqual(transactions);
    });

    it('returns an empty array when there are no transactions', async () => {
      mockPrismaService.loyaltyTransaction.findMany.mockResolvedValue([]);

      const result = await service.getHistory(userId);

      expect(result).toEqual([]);
    });
  });
});
