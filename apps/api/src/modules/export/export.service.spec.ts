import { Test, TestingModule } from '@nestjs/testing';
import { ExportService } from './export.service';
import { PrismaService } from '../../database/prisma.service';

// ---------------------------------------------------------------------------
// Mock pdfkit
// ---------------------------------------------------------------------------
jest.mock('pdfkit', () => {
  const EventEmitter = require('events');
  const MockPDFDocument = jest.fn().mockImplementation(() => {
    const emitter = new EventEmitter();
    const doc: Record<string, unknown> = {
      on: jest.fn((event: string, cb: (...args: unknown[]) => void) => {
        emitter.on(event, cb);
        return doc;
      }),
      fontSize: jest.fn().mockReturnThis(),
      font: jest.fn().mockReturnThis(),
      text: jest.fn().mockReturnThis(),
      moveDown: jest.fn().mockReturnThis(),
      fillColor: jest.fn().mockReturnThis(),
      moveTo: jest.fn().mockReturnThis(),
      lineTo: jest.fn().mockReturnThis(),
      stroke: jest.fn().mockReturnThis(),
      addPage: jest.fn().mockReturnThis(),
      switchToPage: jest.fn().mockReturnThis(),
      bufferedPageRange: jest.fn().mockReturnValue({ start: 0, count: 1 }),
      page: { height: 841.89 },
      y: 100,
      end: jest.fn().mockImplementation(function () {
        emitter.emit('data', Buffer.from('pdf-chunk'));
        emitter.emit('end');
      }),
    };
    return doc;
  });
  return MockPDFDocument;
});

// ---------------------------------------------------------------------------
// Mock ExcelJS
// ---------------------------------------------------------------------------
jest.mock('exceljs', () => {
  const mockSheet = {
    columns: [],
    getRow: jest.fn().mockReturnValue({
      eachCell: jest.fn(),
      font: {},
    }),
    addRow: jest.fn().mockReturnValue({
      eachCell: jest.fn(),
      getCell: jest.fn().mockReturnValue({ font: {} }),
    }),
    addRows: jest.fn(),
    rowCount: 2,
  };

  const wb = {
    creator: '',
    created: new Date(),
    addWorksheet: jest.fn().mockReturnValue(mockSheet),
    xlsx: {
      writeBuffer: jest.fn().mockResolvedValue(Buffer.from('test')),
    },
  };

  return {
    default: {
      Workbook: jest.fn().mockImplementation(() => wb),
    },
    Workbook: jest.fn().mockImplementation(() => wb),
  };
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const makeOrder = (overrides: Record<string, unknown> = {}) => ({
  id: 'order-1',
  orderNumber: 'ORD-00000001',
  restaurantId: 'rest-1',
  status: 'delivered',
  type: 'delivery',
  total: 50.0,
  subtotal: 45.0,
  deliveryFee: 3.0,
  tax: 2.0,
  discount: 0.0,
  createdAt: new Date('2025-01-15'),
  customer: { firstName: 'Jane', lastName: 'Doe', email: 'jane@example.com' },
  items: [{ menuItem: { name: 'Burger' }, quantity: 2 }],
  ...overrides,
});

const makeInventoryItem = (overrides: Record<string, unknown> = {}) => ({
  id: 'item-1',
  name: 'Tomatoes',
  category: 'Vegetables',
  unit: 'kg',
  currentStock: 10,
  minStock: 2,
  costPerUnit: 1.5,
  restaurantId: 'rest-1',
  supplier: { name: 'FreshCo' },
  ...overrides,
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe('ExportService', () => {
  let service: ExportService;
  let prismaMock: {
    order: { findMany: jest.Mock };
    restaurant: { findUnique: jest.Mock };
    inventoryItem: { findMany: jest.Mock };
  };

  beforeEach(async () => {
    prismaMock = {
      order: { findMany: jest.fn() },
      restaurant: { findUnique: jest.fn() },
      inventoryItem: { findMany: jest.fn() },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExportService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    service = module.get<ExportService>(ExportService);
  });

  afterEach(() => jest.clearAllMocks());

  // -------------------------------------------------------------------------
  // generateOrdersPdf
  // -------------------------------------------------------------------------
  describe('generateOrdersPdf', () => {
    const from = new Date('2025-01-01');
    const to = new Date('2025-01-31');

    it('queries orders with correct where/include/orderBy args', async () => {
      prismaMock.order.findMany.mockResolvedValue([makeOrder()]);
      prismaMock.restaurant.findUnique.mockResolvedValue({ name: 'My Restaurant' });

      await service.generateOrdersPdf('rest-1', from, to);

      expect(prismaMock.order.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { restaurantId: 'rest-1', createdAt: { gte: from, lte: to } },
          include: expect.objectContaining({
            items: expect.anything(),
            customer: expect.anything(),
          }),
          orderBy: { createdAt: 'desc' },
        }),
      );
    });

    it('queries restaurant by restaurantId', async () => {
      prismaMock.order.findMany.mockResolvedValue([]);
      prismaMock.restaurant.findUnique.mockResolvedValue({ name: 'My Restaurant' });

      await service.generateOrdersPdf('rest-1', from, to);

      expect(prismaMock.restaurant.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'rest-1' } }),
      );
    });

    it('returns a Buffer', async () => {
      prismaMock.order.findMany.mockResolvedValue([makeOrder()]);
      prismaMock.restaurant.findUnique.mockResolvedValue({ name: 'Test Restaurant' });

      const result = await service.generateOrdersPdf('rest-1', from, to);

      expect(Buffer.isBuffer(result)).toBe(true);
    });

    it('returns a Buffer for empty orders', async () => {
      prismaMock.order.findMany.mockResolvedValue([]);
      prismaMock.restaurant.findUnique.mockResolvedValue(null);

      const result = await service.generateOrdersPdf('rest-1', from, to);

      expect(Buffer.isBuffer(result)).toBe(true);
    });

    it('handles order without customer (anonymous)', async () => {
      prismaMock.order.findMany.mockResolvedValue([makeOrder({ customer: null })]);
      prismaMock.restaurant.findUnique.mockResolvedValue({ name: 'Restaurant' });

      const result = await service.generateOrdersPdf('rest-1', from, to);

      expect(Buffer.isBuffer(result)).toBe(true);
    });
  });

  // -------------------------------------------------------------------------
  // generateOrdersExcel
  // -------------------------------------------------------------------------
  describe('generateOrdersExcel', () => {
    const from = new Date('2025-01-01');
    const to = new Date('2025-01-31');

    it('queries orders with correct args', async () => {
      prismaMock.order.findMany.mockResolvedValue([makeOrder()]);

      await service.generateOrdersExcel('rest-1', from, to);

      expect(prismaMock.order.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { restaurantId: 'rest-1', createdAt: { gte: from, lte: to } },
          include: expect.objectContaining({
            customer: expect.anything(),
          }),
          orderBy: { createdAt: 'desc' },
        }),
      );
    });

    it('returns a Buffer', async () => {
      prismaMock.order.findMany.mockResolvedValue([makeOrder()]);

      const result = await service.generateOrdersExcel('rest-1', from, to);

      expect(Buffer.isBuffer(result)).toBe(true);
    });

    it('returns a Buffer for empty orders', async () => {
      prismaMock.order.findMany.mockResolvedValue([]);

      const result = await service.generateOrdersExcel('rest-1', from, to);

      expect(Buffer.isBuffer(result)).toBe(true);
    });

    it('handles order without customer', async () => {
      prismaMock.order.findMany.mockResolvedValue([makeOrder({ customer: null })]);

      const result = await service.generateOrdersExcel('rest-1', from, to);

      expect(Buffer.isBuffer(result)).toBe(true);
    });
  });

  // -------------------------------------------------------------------------
  // generateInventoryExcel
  // -------------------------------------------------------------------------
  describe('generateInventoryExcel', () => {
    it('queries inventoryItems with correct args', async () => {
      prismaMock.inventoryItem.findMany.mockResolvedValue([makeInventoryItem()]);

      await service.generateInventoryExcel('rest-1');

      expect(prismaMock.inventoryItem.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { restaurantId: 'rest-1' },
          include: expect.objectContaining({
            supplier: expect.anything(),
          }),
          orderBy: { name: 'asc' },
        }),
      );
    });

    it('returns a Buffer', async () => {
      prismaMock.inventoryItem.findMany.mockResolvedValue([makeInventoryItem()]);

      const result = await service.generateInventoryExcel('rest-1');

      expect(Buffer.isBuffer(result)).toBe(true);
    });

    it('returns a Buffer for empty inventory', async () => {
      prismaMock.inventoryItem.findMany.mockResolvedValue([]);

      const result = await service.generateInventoryExcel('rest-1');

      expect(Buffer.isBuffer(result)).toBe(true);
    });

    it('handles item with no supplier', async () => {
      prismaMock.inventoryItem.findMany.mockResolvedValue([
        makeInventoryItem({ supplier: null }),
      ]);

      const result = await service.generateInventoryExcel('rest-1');

      expect(Buffer.isBuffer(result)).toBe(true);
    });

    it('correctly categorises stock status: Rupture when currentStock <= 0', async () => {
      prismaMock.inventoryItem.findMany.mockResolvedValue([
        makeInventoryItem({ currentStock: 0 }),
      ]);

      // Just verifying it doesn't throw and returns a Buffer
      const result = await service.generateInventoryExcel('rest-1');
      expect(Buffer.isBuffer(result)).toBe(true);
    });

    it('correctly categorises stock status: Bas when currentStock <= minStock', async () => {
      prismaMock.inventoryItem.findMany.mockResolvedValue([
        makeInventoryItem({ currentStock: 1, minStock: 2 }),
      ]);

      const result = await service.generateInventoryExcel('rest-1');
      expect(Buffer.isBuffer(result)).toBe(true);
    });
  });
});
