import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateCouponDto } from './dto/create-coupon.dto';
import { UpdateCouponDto } from './dto/update-coupon.dto';
import { ValidateCouponDto } from './dto/validate-coupon.dto';

@Injectable()
export class CouponsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateCouponDto) {
    return this.prisma.coupon.create({
      data: {
        code: dto.code.toUpperCase(),
        description: dto.description,
        discountType: dto.discountType,
        discountValue: dto.discountValue,
        minOrderValue: dto.minOrderValue ?? 0,
        maxUses: dto.maxUses,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
        restaurantId: dto.restaurantId,
      },
    });
  }

  async findAll(restaurantId: string) {
    return this.prisma.coupon.findMany({
      where: { restaurantId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const coupon = await this.prisma.coupon.findUnique({ where: { id } });
    if (!coupon) throw new NotFoundException(`Coupon #${id} not found`);
    return coupon;
  }

  async update(id: string, dto: UpdateCouponDto) {
    await this.findOne(id);
    const data: Record<string, unknown> = {};
    if (dto.code !== undefined) data['code'] = dto.code.toUpperCase();
    if (dto.description !== undefined) data['description'] = dto.description;
    if (dto.discountType !== undefined) data['discountType'] = dto.discountType;
    if (dto.discountValue !== undefined) data['discountValue'] = dto.discountValue;
    if (dto.minOrderValue !== undefined) data['minOrderValue'] = dto.minOrderValue;
    if (dto.maxUses !== undefined) data['maxUses'] = dto.maxUses;
    if (dto.expiresAt !== undefined) data['expiresAt'] = dto.expiresAt ? new Date(dto.expiresAt) : null;
    if (dto.active !== undefined) data['active'] = dto.active;
    return this.prisma.coupon.update({ where: { id }, data });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.coupon.delete({ where: { id } });
  }

  async validate(dto: ValidateCouponDto) {
    const coupon = await this.prisma.coupon.findFirst({
      where: {
        code: dto.code.toUpperCase(),
        restaurantId: dto.restaurantId,
      },
    });

    if (!coupon) {
      return { valid: false, reason: 'Coupon introuvable', discount: 0, finalTotal: dto.orderTotal, coupon: null };
    }

    if (!coupon.active) {
      return { valid: false, reason: 'Coupon inactif', discount: 0, finalTotal: dto.orderTotal, coupon };
    }

    if (coupon.expiresAt && coupon.expiresAt < new Date()) {
      return { valid: false, reason: 'Coupon expiré', discount: 0, finalTotal: dto.orderTotal, coupon };
    }

    if (coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses) {
      return { valid: false, reason: 'Coupon épuisé', discount: 0, finalTotal: dto.orderTotal, coupon };
    }

    if (dto.orderTotal < coupon.minOrderValue) {
      return {
        valid: false,
        reason: `Commande minimale de ${coupon.minOrderValue}€ requise`,
        discount: 0,
        finalTotal: dto.orderTotal,
        coupon,
      };
    }

    let discount = 0;
    if (coupon.discountType === 'percent') {
      discount = (dto.orderTotal * coupon.discountValue) / 100;
    } else {
      discount = Math.min(coupon.discountValue, dto.orderTotal);
    }
    const finalTotal = Math.max(0, dto.orderTotal - discount);

    // Increment usedCount (treat validate as apply)
    await this.prisma.coupon.update({
      where: { id: coupon.id },
      data: { usedCount: { increment: 1 } },
    });

    return { valid: true, discount, finalTotal, coupon };
  }
}
