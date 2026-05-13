import { Test, TestingModule } from '@nestjs/testing';
import { AnalyticsService } from './analytics.service';
import { PrismaService } from '../../database/prisma.service';

const mockPrisma = {
  order: { findMany: jest.fn(), groupBy: jest.fn() },
  orderItem: { groupBy: jest.fn() },
  menuItem: { findMany: jest.fn() },
  user: { count: jest.fn() },
  delivery: { findMany: jest.fn() },
};

describe('AnalyticsService', () => {
  let service: AnalyticsService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnalyticsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();
    service = module.get<AnalyticsService>(AnalyticsService);
  });

  // ─── getSalesSummary ───────────────────────────────────────────────────────

  describe('getSalesSummary', () => {
    const from = new Date('2026-05-01');
    const to = new Date('2026-05-07');

    it('returns correct revenue, count, avg for delivered orders', async () => {
      mockPrisma.order.findMany.mockResolvedValue([
        { total: 20, subtotal: 18, deliveryFee: 2, tax: 2, createdAt: new Date('2026-05-02') },
        { total: 30, subtotal: 27, deliveryFee: 3, tax: 3, createdAt: new Date('2026-05-03') },
      ]);

      const result = await service.getSalesSummary('rest-1', from, to);

      expect(result.revenue).toBe(50);
      expect(result.orderCount).toBe(2);
      expect(result.avgOrderValue).toBe(25);
    });

    it('returns zero avg when no orders', async () => {
      mockPrisma.order.findMany.mockResolvedValue([]);
      const result = await service.getSalesSummary('rest-1', from, to);
      expect(result.avgOrderValue).toBe(0);
      expect(result.orderCount).toBe(0);
    });
  });

  // ─── getRevenueTimeSeries ──────────────────────────────────────────────────

  describe('getRevenueTimeSeries', () => {
    it('fills missing days with zero', async () => {
      const from = new Date('2026-05-01T00:00:00Z');
      const to = new Date('2026-05-03T00:00:00Z');

      mockPrisma.order.findMany.mockResolvedValue([
        { total: 100, createdAt: new Date('2026-05-01T12:00:00Z') },
      ]);

      const result = await service.getRevenueTimeSeries('rest-1', from, to);

      expect(result).toHaveLength(3);
      expect(result[0].revenue).toBe(100);
      expect(result[0].orders).toBe(1);
      expect(result[1].revenue).toBe(0);
      expect(result[2].revenue).toBe(0);
    });

    it('aggregates multiple orders on same day', async () => {
      const from = new Date('2026-05-01T00:00:00Z');
      const to = new Date('2026-05-01T00:00:00Z');

      mockPrisma.order.findMany.mockResolvedValue([
        { total: 40, createdAt: new Date('2026-05-01T10:00:00Z') },
        { total: 60, createdAt: new Date('2026-05-01T18:00:00Z') },
      ]);

      const result = await service.getRevenueTimeSeries('rest-1', from, to);

      expect(result[0].revenue).toBe(100);
      expect(result[0].orders).toBe(2);
    });
  });

  // ─── getOrderTypeBreakdown ────────────────────────────────────────────────

  describe('getOrderTypeBreakdown', () => {
    it('returns types with correct percentages', async () => {
      const from = new Date('2026-05-01');
      const to = new Date('2026-05-07');

      mockPrisma.order.groupBy.mockResolvedValue([
        { type: 'delivery', _count: { id: 6 } },
        { type: 'pickup',   _count: { id: 4 } },
      ]);

      const result = await service.getOrderTypeBreakdown('rest-1', from, to);

      expect(result).toHaveLength(2);
      const delivery = result.find((r: { type: string }) => r.type === 'delivery');
      expect(delivery?.percent).toBe(60);
      const pickup = result.find((r: { type: string }) => r.type === 'pickup');
      expect(pickup?.percent).toBe(40);
    });

    it('returns empty array when no orders', async () => {
      mockPrisma.order.groupBy.mockResolvedValue([]);
      const result = await service.getOrderTypeBreakdown('rest-1', new Date(), new Date());
      expect(result).toEqual([]);
    });
  });

  // ─── getTopItems ───────────────────────────────────────────────────────────

  describe('getTopItems', () => {
    it('returns items merged with menu item names', async () => {
      mockPrisma.orderItem.groupBy.mockResolvedValue([
        { menuItemId: 'item-1', _sum: { quantity: 10, subtotal: 149 }, _count: { id: 8 } },
      ]);
      mockPrisma.menuItem.findMany.mockResolvedValue([
        { id: 'item-1', name: 'Classic Burger', price: 14.9 },
      ]);

      const result = await service.getTopItems('rest-1', 5);

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Classic Burger');
      expect(result[0].totalQuantity).toBe(10);
      expect(result[0].totalRevenue).toBe(149);
    });

    it('uses Unknown for items not in menu', async () => {
      mockPrisma.orderItem.groupBy.mockResolvedValue([
        { menuItemId: 'ghost-item', _sum: { quantity: 5, subtotal: 50 }, _count: { id: 3 } },
      ]);
      mockPrisma.menuItem.findMany.mockResolvedValue([]);

      const result = await service.getTopItems('rest-1', 5);

      expect(result[0].name).toBe('Unknown');
      expect(result[0].price).toBe(0);
    });
  });
});
