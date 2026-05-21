import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { RestaurantsService } from './restaurants.service';
import { PrismaService } from '../../database/prisma.service';

const mockPrisma = {
  restaurant: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
};

// Minimal restaurant fixture shared across tests
const baseRestaurant = {
  id: 'r1',
  name: 'Burger Palace',
  description: 'Best burgers',
  street: '1 Main St',
  city: 'Paris',
  postalCode: '75001',
  phone: '+33100000000',
  email: 'info@burgers.com',
  logo: null,
  latitude: 48.8566,
  longitude: 2.3522,
  isOpen: true,
  rating: 4.5,
  settings: { prepTime: 15, deliveryFee: 2.5, minOrderAmount: 10, cuisine: 'American', tags: ['burgers'], isFeatured: true },
  ownerId: 'owner1',
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('RestaurantsService', () => {
  let service: RestaurantsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RestaurantsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<RestaurantsService>(RestaurantsService);
    jest.clearAllMocks();
  });

  // ---------------------------------------------------------------------------
  // findById()
  // ---------------------------------------------------------------------------
  describe('findById', () => {
    it('should throw NotFoundException when restaurant does not exist', async () => {
      mockPrisma.restaurant.findUnique.mockResolvedValue(null);

      await expect(service.findById('ghost')).rejects.toThrow(NotFoundException);
    });

    it('should return enriched restaurant data when found', async () => {
      mockPrisma.restaurant.findUnique.mockResolvedValue(baseRestaurant);

      const result = await service.findById('r1') as any;

      // Core fields present
      expect(result.id).toBe('r1');
      expect(result.name).toBe('Burger Palace');

      // Enriched fields derived from settings
      expect(result.deliveryFee).toBe(2.5);
      expect(result.minOrder).toBe(10);
      expect(result.cuisine).toBe('American');
      expect(result.isFeatured).toBe(true);

      // deliveryTime is computed as "prepTime-(prepTime+10)min"
      expect(result.deliveryTime).toBe('15-25min');

      // address is assembled from street/city/postalCode
      expect(result.address).toBe('1 Main St, Paris, 75001');
    });
  });

  // ---------------------------------------------------------------------------
  // findAll()
  // ---------------------------------------------------------------------------
  describe('findAll', () => {
    it('should return a list of enriched restaurants', async () => {
      mockPrisma.restaurant.findMany.mockResolvedValue([baseRestaurant]);

      const result = (await service.findAll()) as any[];

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('r1');
    });

    it('should support pagination via page and limit options', async () => {
      mockPrisma.restaurant.findMany.mockResolvedValue([]);

      await service.findAll({ page: 3, limit: 10 });

      expect(mockPrisma.restaurant.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 20, take: 10 }),
      );
    });

    it('should filter by cuisine in memory after fetching', async () => {
      const italian = { ...baseRestaurant, id: 'r2', settings: { ...baseRestaurant.settings, cuisine: 'Italian' } };
      mockPrisma.restaurant.findMany.mockResolvedValue([baseRestaurant, italian]);

      const result = (await service.findAll({ cuisine: 'Italian' })) as any[];

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('r2');
    });
  });

  // ---------------------------------------------------------------------------
  // create()
  // ---------------------------------------------------------------------------
  describe('create', () => {
    it('should call prisma.restaurant.create with provided data', async () => {
      const created = { ...baseRestaurant, id: 'r_new' };
      mockPrisma.restaurant.create.mockResolvedValue(created);

      const dto = {
        name: 'Burger Palace',
        description: 'Best burgers',
        address: '1 Main St',
        latitude: 48.8566,
        longitude: 2.3522,
        phone: '+33100000000',
        logoUrl: null,
        ownerId: 'owner1',
      } as any;

      const result = await service.create(dto);

      expect(result).toEqual(created);
      expect(mockPrisma.restaurant.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ name: 'Burger Palace', ownerId: 'owner1' }),
        }),
      );
    });
  });

  // ---------------------------------------------------------------------------
  // update()
  // ---------------------------------------------------------------------------
  describe('update', () => {
    it('should throw NotFoundException when restaurant does not exist', async () => {
      mockPrisma.restaurant.findUnique.mockResolvedValue(null);

      await expect(service.update('ghost', { name: 'New Name' })).rejects.toThrow(NotFoundException);
    });

    it('should return updated restaurant when found', async () => {
      const updated = { ...baseRestaurant, name: 'Updated Burgers' };
      mockPrisma.restaurant.findUnique.mockResolvedValue(baseRestaurant);
      mockPrisma.restaurant.update.mockResolvedValue(updated);

      const result = await service.update('r1', { name: 'Updated Burgers' });

      expect(result.name).toBe('Updated Burgers');
      expect(mockPrisma.restaurant.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'r1' } }),
      );
    });
  });

  // ---------------------------------------------------------------------------
  // remove()
  // ---------------------------------------------------------------------------
  describe('remove', () => {
    it('should throw NotFoundException when restaurant does not exist', async () => {
      mockPrisma.restaurant.findUnique.mockResolvedValue(null);

      await expect(service.remove('ghost')).rejects.toThrow(NotFoundException);
    });

    it('should delete the restaurant when found', async () => {
      mockPrisma.restaurant.findUnique.mockResolvedValue(baseRestaurant);
      mockPrisma.restaurant.delete.mockResolvedValue(baseRestaurant);

      const result = await service.remove('r1');

      expect(result).toEqual(baseRestaurant);
      expect(mockPrisma.restaurant.delete).toHaveBeenCalledWith({ where: { id: 'r1' } });
    });
  });

  // ---------------------------------------------------------------------------
  // toggleOpen()
  // ---------------------------------------------------------------------------
  describe('toggleOpen', () => {
    it('should throw NotFoundException when restaurant does not exist', async () => {
      mockPrisma.restaurant.findUnique.mockResolvedValue(null);

      await expect(service.toggleOpen('ghost')).rejects.toThrow(NotFoundException);
    });

    it('should flip isOpen from true to false', async () => {
      const openRestaurant = { ...baseRestaurant, isOpen: true };
      const closedRestaurant = { ...baseRestaurant, isOpen: false };
      mockPrisma.restaurant.findUnique.mockResolvedValue(openRestaurant);
      mockPrisma.restaurant.update.mockResolvedValue(closedRestaurant);

      const result = await service.toggleOpen('r1');

      expect(result.isOpen).toBe(false);
      expect(mockPrisma.restaurant.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'r1' }, data: { isOpen: false } }),
      );
    });

    it('should flip isOpen from false to true', async () => {
      const closedRestaurant = { ...baseRestaurant, isOpen: false };
      const openRestaurant = { ...baseRestaurant, isOpen: true };
      mockPrisma.restaurant.findUnique.mockResolvedValue(closedRestaurant);
      mockPrisma.restaurant.update.mockResolvedValue(openRestaurant);

      const result = await service.toggleOpen('r1');

      expect(result.isOpen).toBe(true);
      expect(mockPrisma.restaurant.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'r1' }, data: { isOpen: true } }),
      );
    });
  });
});
