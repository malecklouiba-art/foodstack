import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { MenuService } from './menu.service';
import { PrismaService } from '../../database/prisma.service';

const mockPrisma = {
  menuCategory: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  menuItem: {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn(),
  },
};

describe('MenuService', () => {
  let service: MenuService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MenuService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<MenuService>(MenuService);
    jest.clearAllMocks();
  });

  // -------------------------------------------------------------------------
  // getMenu()
  // -------------------------------------------------------------------------
  describe('getMenu', () => {
    it('should return categories and flat items list', async () => {
      const cats = [
        { id: 'cat1', name: 'Burgers', items: [{ id: 'item1', name: 'Cheeseburger' }] },
        { id: 'cat2', name: 'Drinks', items: [{ id: 'item2', name: 'Cola' }] },
      ];
      mockPrisma.menuCategory.findMany.mockResolvedValue(cats);

      const result = await service.getMenu('rest_1');

      expect(result.categories).toHaveLength(2);
      expect(result.items).toHaveLength(2);
      expect(result.items.map((i: any) => i.id)).toEqual(['item1', 'item2']);
    });

    it('should return empty categories and items for a restaurant with no menu', async () => {
      mockPrisma.menuCategory.findMany.mockResolvedValue([]);

      const result = await service.getMenu('rest_empty');

      expect(result.categories).toHaveLength(0);
      expect(result.items).toHaveLength(0);
    });

    it('should filter by restaurantId', async () => {
      mockPrisma.menuCategory.findMany.mockResolvedValue([]);

      await service.getMenu('rest_filter');

      expect(mockPrisma.menuCategory.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { restaurantId: 'rest_filter' } }),
      );
    });
  });

  // -------------------------------------------------------------------------
  // createCategory()
  // -------------------------------------------------------------------------
  describe('createCategory', () => {
    it('should create and return a new category', async () => {
      const dto = { name: 'Burgers', restaurantId: 'rest_1', position: 0 };
      const created = { id: 'cat_new', ...dto };
      mockPrisma.menuCategory.create.mockResolvedValue(created);

      const result = await service.createCategory(dto as any);

      expect(result).toEqual(created);
      expect(mockPrisma.menuCategory.create).toHaveBeenCalledWith({ data: dto });
    });
  });

  // -------------------------------------------------------------------------
  // updateCategory()
  // -------------------------------------------------------------------------
  describe('updateCategory', () => {
    it('should throw NotFoundException when category does not exist', async () => {
      mockPrisma.menuCategory.findUnique.mockResolvedValue(null);

      await expect(service.updateCategory('ghost', { name: 'New' })).rejects.toThrow(NotFoundException);
    });

    it('should update and return the category', async () => {
      mockPrisma.menuCategory.findUnique.mockResolvedValue({ id: 'cat1', name: 'Old' });
      mockPrisma.menuCategory.update.mockResolvedValue({ id: 'cat1', name: 'New' });

      const result = await service.updateCategory('cat1', { name: 'New' });

      expect(result.name).toBe('New');
    });
  });

  // -------------------------------------------------------------------------
  // deleteCategory()
  // -------------------------------------------------------------------------
  describe('deleteCategory', () => {
    it('should throw NotFoundException when category does not exist', async () => {
      mockPrisma.menuCategory.findUnique.mockResolvedValue(null);

      await expect(service.deleteCategory('ghost')).rejects.toThrow(NotFoundException);
    });

    it('should delete all items in the category before deleting the category', async () => {
      mockPrisma.menuCategory.findUnique.mockResolvedValue({ id: 'cat1' });
      mockPrisma.menuItem.deleteMany.mockResolvedValue({ count: 3 });
      mockPrisma.menuCategory.delete.mockResolvedValue({ id: 'cat1' });

      await service.deleteCategory('cat1');

      expect(mockPrisma.menuItem.deleteMany).toHaveBeenCalledWith({ where: { categoryId: 'cat1' } });
      expect(mockPrisma.menuCategory.delete).toHaveBeenCalledWith({ where: { id: 'cat1' } });
    });
  });

  // -------------------------------------------------------------------------
  // updateItem()
  // -------------------------------------------------------------------------
  describe('updateItem', () => {
    it('should throw NotFoundException when item does not exist', async () => {
      mockPrisma.menuItem.findUnique.mockResolvedValue(null);

      await expect(service.updateItem('ghost', { name: 'New' })).rejects.toThrow(NotFoundException);
    });

    it('should update and return the item', async () => {
      mockPrisma.menuItem.findUnique.mockResolvedValue({ id: 'item1', name: 'Old', isActive: true });
      mockPrisma.menuItem.update.mockResolvedValue({ id: 'item1', name: 'Updated', isActive: true });

      const result = await service.updateItem('item1', { name: 'Updated' });

      expect(result.name).toBe('Updated');
    });
  });

  // -------------------------------------------------------------------------
  // deleteItem()
  // -------------------------------------------------------------------------
  describe('deleteItem', () => {
    it('should throw NotFoundException when item does not exist', async () => {
      mockPrisma.menuItem.findUnique.mockResolvedValue(null);

      await expect(service.deleteItem('ghost')).rejects.toThrow(NotFoundException);
    });

    it('should delete the item when it exists', async () => {
      mockPrisma.menuItem.findUnique.mockResolvedValue({ id: 'item1' });
      mockPrisma.menuItem.delete.mockResolvedValue({ id: 'item1' });

      await service.deleteItem('item1');

      expect(mockPrisma.menuItem.delete).toHaveBeenCalledWith({ where: { id: 'item1' } });
    });
  });

  // -------------------------------------------------------------------------
  // toggleItemAvailability()
  // -------------------------------------------------------------------------
  describe('toggleItemAvailability', () => {
    it('should throw NotFoundException when item does not exist', async () => {
      mockPrisma.menuItem.findUnique.mockResolvedValue(null);

      await expect(service.toggleItemAvailability('ghost')).rejects.toThrow(NotFoundException);
    });

    it('should set isActive to false when item is currently active', async () => {
      mockPrisma.menuItem.findUnique.mockResolvedValue({ id: 'item1', isActive: true });
      mockPrisma.menuItem.update.mockResolvedValue({ id: 'item1', isActive: false });

      await service.toggleItemAvailability('item1');

      expect(mockPrisma.menuItem.update).toHaveBeenCalledWith({
        where: { id: 'item1' },
        data: { isActive: false },
      });
    });

    it('should set isActive to true when item is currently inactive', async () => {
      mockPrisma.menuItem.findUnique.mockResolvedValue({ id: 'item1', isActive: false });
      mockPrisma.menuItem.update.mockResolvedValue({ id: 'item1', isActive: true });

      await service.toggleItemAvailability('item1');

      expect(mockPrisma.menuItem.update).toHaveBeenCalledWith({
        where: { id: 'item1' },
        data: { isActive: true },
      });
    });
  });
});
