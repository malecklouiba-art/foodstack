import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async findAll() {
    // TODO: Add pagination, filtering by role, sorting
    return this.prisma.user.findMany({
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        createdAt: true,
      },
    });
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        avatar: true,
        role: true,
        loyaltyPoints: true,
        loyaltyTier: true,
        twoFactorEnabled: true,
        emailVerified: true,
        createdAt: true,
        _count: { select: { orders: true } },
      },
    });
    if (!user) throw new NotFoundException(`User #${userId} not found`);
    return user;
  }

  async getAddresses(userId: string) {
    return this.prisma.savedAddress.findMany({
      where: { userId },
      orderBy: [{ isDefault: 'desc' }, { id: 'asc' }],
    });
  }

  async addAddress(
    userId: string,
    data: { label: string; street: string; city: string; postalCode: string; isDefault?: boolean },
  ) {
    if (data.isDefault) {
      await this.prisma.savedAddress.updateMany({ where: { userId }, data: { isDefault: false } });
    }
    return this.prisma.savedAddress.create({ data: { userId, ...data, isDefault: data.isDefault ?? false } });
  }

  async updateAddress(
    userId: string,
    addressId: string,
    data: { label?: string; street?: string; city?: string; postalCode?: string; isDefault?: boolean; deleted?: boolean },
  ) {
    const addr = await this.prisma.savedAddress.findUnique({ where: { id: addressId } });
    if (!addr) throw new NotFoundException(`Address #${addressId} not found`);
    if (addr.userId !== userId) throw new ForbiddenException('Not your address');

    if (data.deleted) {
      await this.prisma.savedAddress.delete({ where: { id: addressId } });
      return { ok: true };
    }

    if (data.isDefault) {
      await this.prisma.savedAddress.updateMany({ where: { userId }, data: { isDefault: false } });
    }

    const { deleted: _d, ...updateData } = data;
    return this.prisma.savedAddress.update({ where: { id: addressId }, data: updateData });
  }

  async deleteAddress(userId: string, addressId: string) {
    const addr = await this.prisma.savedAddress.findUnique({ where: { id: addressId } });
    if (!addr) throw new NotFoundException(`Address #${addressId} not found`);
    if (addr.userId !== userId) throw new ForbiddenException('Not your address');
    await this.prisma.savedAddress.delete({ where: { id: addressId } });
    return { ok: true };
  }

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        twoFactorSecret: true,
        twoFactorEnabled: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    if (!user) throw new NotFoundException(`User #${id} not found`);
    return user;
  }

  async updateUser(id: string, data: Partial<{ twoFactorSecret: string | null; twoFactorEnabled: boolean }>) {
    return this.prisma.user.update({ where: { id }, data });
  }

  async create(dto: CreateUserDto, passwordHash: string) {
    return this.prisma.user.create({
      data: {
        email: dto.email,
        firstName: dto.firstName,
        lastName: dto.lastName,
        passwordHash,
        phone: dto.phone,
      },
    });
  }

  async update(id: string, dto: UpdateUserDto) {
    await this.findById(id);
    return this.prisma.user.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string) {
    await this.findById(id);
    // TODO: Soft delete instead of hard delete
    const deleted = await this.prisma.user.delete({ where: { id } });

    // Audit log — fire-and-forget
    this.audit.log({
      action: 'user.deleted',
      entityType: 'User',
      entityId: id,
    }).catch(() => { /* audit failures must never surface */ });

    return deleted;
  }
}
