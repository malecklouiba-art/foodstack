import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { SuppliersService } from './suppliers.service';
import { PrismaService } from '../../database/prisma.service';

const mockSupplier = {
  id: 'sup-1',
  restaurantId: 'rest-1',
  name: 'Boucherie Martin',
  contact: 'Jacques',
  email: 'pro@martin.fr',
  phone: '01 23 45 67 89',
  website: null,
  address: '8 rue des Abattoirs',
  notes: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockPrisma = {
  supplier: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
};

describe('SuppliersService', () => {
  let service: SuppliersService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SuppliersService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();
    service = module.get<SuppliersService>(SuppliersService);
  });

  describe('findAll', () => {
    it('returns suppliers ordered by name for restaurant', async () => {
      mockPrisma.supplier.findMany.mockResolvedValue([mockSupplier]);
      const result = await service.findAll('rest-1');
      expect(mockPrisma.supplier.findMany).toHaveBeenCalledWith({
        where: { restaurantId: 'rest-1' },
        orderBy: { name: 'asc' },
      });
      expect(result).toEqual([mockSupplier]);
    });
  });

  describe('findOne', () => {
    it('returns supplier when found', async () => {
      mockPrisma.supplier.findUnique.mockResolvedValue(mockSupplier);
      const result = await service.findOne('sup-1');
      expect(result).toEqual(mockSupplier);
    });

    it('throws NotFoundException when not found', async () => {
      mockPrisma.supplier.findUnique.mockResolvedValue(null);
      await expect(service.findOne('missing')).rejects.toThrow(NotFoundException);
      await expect(service.findOne('missing')).rejects.toThrow('Supplier #missing not found');
    });
  });

  describe('create', () => {
    it('creates and returns new supplier', async () => {
      mockPrisma.supplier.create.mockResolvedValue(mockSupplier);
      const dto = { restaurantId: 'rest-1', name: 'Boucherie Martin', email: 'pro@martin.fr' };
      const result = await service.create(dto as any);
      expect(mockPrisma.supplier.create).toHaveBeenCalledWith({ data: dto });
      expect(result).toEqual(mockSupplier);
    });
  });

  describe('update', () => {
    it('updates supplier when exists', async () => {
      mockPrisma.supplier.findUnique.mockResolvedValue(mockSupplier);
      const updated = { ...mockSupplier, name: 'Boucherie Dupont' };
      mockPrisma.supplier.update.mockResolvedValue(updated);

      const result = await service.update('sup-1', { name: 'Boucherie Dupont' });

      expect(mockPrisma.supplier.update).toHaveBeenCalledWith({
        where: { id: 'sup-1' },
        data: { name: 'Boucherie Dupont' },
      });
      expect(result.name).toBe('Boucherie Dupont');
    });

    it('throws NotFoundException when supplier missing', async () => {
      mockPrisma.supplier.findUnique.mockResolvedValue(null);
      await expect(service.update('ghost', { name: 'X' })).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('deletes supplier when exists', async () => {
      mockPrisma.supplier.findUnique.mockResolvedValue(mockSupplier);
      mockPrisma.supplier.delete.mockResolvedValue(mockSupplier);

      const result = await service.remove('sup-1');

      expect(mockPrisma.supplier.delete).toHaveBeenCalledWith({ where: { id: 'sup-1' } });
      expect(result).toEqual(mockSupplier);
    });

    it('throws NotFoundException when supplier missing', async () => {
      mockPrisma.supplier.findUnique.mockResolvedValue(null);
      await expect(service.remove('ghost')).rejects.toThrow(NotFoundException);
      expect(mockPrisma.supplier.delete).not.toHaveBeenCalled();
    });
  });
});
