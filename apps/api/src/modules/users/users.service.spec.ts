import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { UsersService } from './users.service';
import { PrismaService } from '../../database/prisma.service';
import { AuditService } from '../audit/audit.service';

const mockPrisma = {
  user: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  favoriteRestaurant: {
    upsert: jest.fn(),
    deleteMany: jest.fn(),
    findMany: jest.fn(),
  },
  savedAddress: {
    create: jest.fn(),
    findMany: jest.fn(),
    updateMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  restaurant: {
    findMany: jest.fn(),
  },
  restaurantStaff: {
    findMany: jest.fn(),
  },
  order: {
    groupBy: jest.fn(),
  },
};

const mockAudit = {
  log: jest.fn(),
};

describe('UsersService', () => {
  let service: UsersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: AuditService, useValue: mockAudit },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    jest.clearAllMocks();
  });

  // ---------------------------------------------------------------------------
  // findById()
  // ---------------------------------------------------------------------------
  describe('findById', () => {
    it('should throw NotFoundException when user does not exist', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(service.findById('ghost')).rejects.toThrow(NotFoundException);
    });

    it('should return the user when found', async () => {
      const user = { id: 'u1', email: 'a@b.com', firstName: 'A', lastName: 'B', role: 'customer' };
      mockPrisma.user.findUnique.mockResolvedValue(user);

      const result = await service.findById('u1');

      expect(result).toEqual(user);
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'u1' } }),
      );
    });
  });

  // ---------------------------------------------------------------------------
  // findByEmail()
  // ---------------------------------------------------------------------------
  describe('findByEmail', () => {
    it('should return null when user is not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const result = await service.findByEmail('unknown@example.com');

      expect(result).toBeNull();
    });

    it('should return the user when found by email', async () => {
      const user = { id: 'u1', email: 'found@example.com' };
      mockPrisma.user.findUnique.mockResolvedValue(user);

      const result = await service.findByEmail('found@example.com');

      expect(result).toEqual(user);
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({ where: { email: 'found@example.com' } }),
      );
    });
  });

  // ---------------------------------------------------------------------------
  // getProfile()
  // ---------------------------------------------------------------------------
  describe('getProfile', () => {
    it('should throw NotFoundException when user does not exist', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(service.getProfile('ghost')).rejects.toThrow(NotFoundException);
    });

    it('should return user profile without passwordHash', async () => {
      const profile = {
        id: 'u1',
        email: 'a@b.com',
        firstName: 'A',
        lastName: 'B',
        phone: null,
        avatar: null,
        role: 'customer',
        loyaltyPoints: 0,
        loyaltyTier: 'bronze',
        twoFactorEnabled: false,
        emailVerified: false,
        createdAt: new Date(),
        _count: { orders: 3 },
      };
      mockPrisma.user.findUnique.mockResolvedValue(profile);

      const result = await service.getProfile('u1');

      expect(result).toEqual(profile);
      expect(result).not.toHaveProperty('passwordHash');
    });
  });

  // ---------------------------------------------------------------------------
  // create()
  // ---------------------------------------------------------------------------
  describe('create', () => {
    it('should call prisma.user.create with hashed password, correct name fields, and role', async () => {
      const createdUser = { id: 'u1', email: 'new@example.com' };
      mockPrisma.user.create.mockResolvedValue(createdUser);

      const dto = { email: 'new@example.com', firstName: 'John', lastName: 'Doe', password: 'raw', role: 'customer' };
      const hash = 'hashed_password';

      const result = await service.create(dto, hash);

      expect(result).toEqual(createdUser);
      expect(mockPrisma.user.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          email: 'new@example.com',
          firstName: 'John',
          lastName: 'Doe',
          passwordHash: hash,
          role: 'customer',
        }),
      });
    });
  });

  // ---------------------------------------------------------------------------
  // update()
  // ---------------------------------------------------------------------------
  describe('update', () => {
    it('should throw NotFoundException when user does not exist', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(service.update('ghost', { firstName: 'X' })).rejects.toThrow(NotFoundException);
    });

    it('should return updated user and the select must NOT include passwordHash', async () => {
      const existing = { id: 'u1', email: 'a@b.com', firstName: 'A', lastName: 'B', role: 'customer' };
      const updated = {
        id: 'u1', email: 'a@b.com', firstName: 'Z', lastName: 'B',
        phone: null, role: 'customer', avatar: null, isActive: true,
        loyaltyPoints: 0, loyaltyTier: 'bronze', updatedAt: new Date(),
      };
      mockPrisma.user.findUnique.mockResolvedValue(existing);
      mockPrisma.user.update.mockResolvedValue(updated);

      const result = await service.update('u1', { firstName: 'Z' });

      expect(result).toEqual(updated);
      // Security check: passwordHash must NOT appear in the select passed to prisma
      const updateCall = mockPrisma.user.update.mock.calls[0][0];
      expect(updateCall.select).not.toHaveProperty('passwordHash');
    });
  });

  // ---------------------------------------------------------------------------
  // remove()
  // ---------------------------------------------------------------------------
  describe('remove', () => {
    it('should throw NotFoundException when user does not exist', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(service.remove('ghost')).rejects.toThrow(NotFoundException);
    });

    it('should set isActive to false (soft delete)', async () => {
      const existing = { id: 'u1', email: 'a@b.com', firstName: 'A', lastName: 'B', isActive: true };
      const softDeleted = { ...existing, isActive: false };
      mockPrisma.user.findUnique.mockResolvedValue(existing);
      mockPrisma.user.update.mockResolvedValue(softDeleted);
      mockAudit.log.mockResolvedValue(undefined);

      const result = await service.remove('u1');

      expect(result.isActive).toBe(false);
      expect(mockPrisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'u1' }, data: { isActive: false } }),
      );
    });

    it('should fire an audit log after soft-deleting', async () => {
      const existing = { id: 'u1', email: 'a@b.com', firstName: 'A', isActive: true };
      mockPrisma.user.findUnique.mockResolvedValue(existing);
      mockPrisma.user.update.mockResolvedValue({ ...existing, isActive: false });
      mockAudit.log.mockResolvedValue(undefined);

      await service.remove('u1');

      // Give the fire-and-forget a tick to dispatch
      await Promise.resolve();

      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'user.deleted', entityType: 'User', entityId: 'u1' }),
      );
    });
  });

  // ---------------------------------------------------------------------------
  // addFavorite()
  // ---------------------------------------------------------------------------
  describe('addFavorite', () => {
    it('should call upsert with correct userId and restaurantId', async () => {
      mockPrisma.favoriteRestaurant.upsert.mockResolvedValue({});

      const result = await service.addFavorite('u1', 'r1');

      expect(result).toEqual({ ok: true });
      expect(mockPrisma.favoriteRestaurant.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId_restaurantId: { userId: 'u1', restaurantId: 'r1' } },
          create: { userId: 'u1', restaurantId: 'r1' },
        }),
      );
    });
  });

  // ---------------------------------------------------------------------------
  // removeFavorite()
  // ---------------------------------------------------------------------------
  describe('removeFavorite', () => {
    it('should call deleteMany with correct userId and restaurantId', async () => {
      mockPrisma.favoriteRestaurant.deleteMany.mockResolvedValue({ count: 1 });

      const result = await service.removeFavorite('u1', 'r1');

      expect(result).toEqual({ ok: true });
      expect(mockPrisma.favoriteRestaurant.deleteMany).toHaveBeenCalledWith({
        where: { userId: 'u1', restaurantId: 'r1' },
      });
    });
  });

  // ---------------------------------------------------------------------------
  // addAddress()
  // ---------------------------------------------------------------------------
  describe('addAddress', () => {
    it('should call savedAddress.create with the provided address data', async () => {
      const address = { id: 'a1', userId: 'u1', label: 'Home', street: '1 Main St', city: 'Paris', postalCode: '75001', isDefault: false };
      mockPrisma.savedAddress.create.mockResolvedValue(address);

      const result = await service.addAddress('u1', { label: 'Home', street: '1 Main St', city: 'Paris', postalCode: '75001' });

      expect(result).toEqual(address);
      expect(mockPrisma.savedAddress.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ userId: 'u1', label: 'Home', street: '1 Main St' }),
        }),
      );
    });

    it('should reset other addresses before creating when isDefault=true', async () => {
      const address = { id: 'a2', userId: 'u1', isDefault: true };
      mockPrisma.savedAddress.updateMany.mockResolvedValue({ count: 1 });
      mockPrisma.savedAddress.create.mockResolvedValue(address);

      await service.addAddress('u1', { label: 'Work', street: '2 Side St', city: 'Paris', postalCode: '75002', isDefault: true });

      expect(mockPrisma.savedAddress.updateMany).toHaveBeenCalledWith({
        where: { userId: 'u1' },
        data: { isDefault: false },
      });
      expect(mockPrisma.savedAddress.create).toHaveBeenCalled();
    });
  });
});
