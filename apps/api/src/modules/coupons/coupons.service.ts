import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateCouponDto } from './dto/create-coupon.dto';
import { ApplyCouponDto } from './dto/apply-coupon.dto';

@Injectable()
export class CouponsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateCouponDto) {
    return this.prisma.coupon.create({
      data: {
        code: dto.code.toUpperCase(),
        discountType: dto.discountType,
        discountValue: dto.discountValue,
        minOrderAmount: dto.minOrderAmount,
        maxUses: dto.maxUses,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : undefined,
        restaurantId: dto.restaurantId,
        active: dto.active ?? true,
      },
    });
  }

  async findAll(restaurantId?: string) {
    return this.prisma.coupon.findMany({
      where: restaurantId ? { restaurantId } : undefined,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const coupon = await this.prisma.coupon.findUnique({ where: { id } });
    if (!coupon) throw new NotFoundException(`Coupon #${id} not found`);
    return coupon;
  }

  async applyCoupon(dto: ApplyCouponDto): Promise<{ discount: number; finalTotal: number; couponId: string }> {
    const coupon = await this.prisma.coupon.findUnique({ where: { code: dto.code.toUpperCase() } });

    if (!coupon) {
      throw new BadRequestException('Coupon code not found');
    }
    if (!coupon.active) {
      throw new BadRequestException('This coupon is no longer active');
    }
    if (coupon.expiresAt && coupon.expiresAt < new Date()) {
      throw new BadRequestException('This coupon has expired');
    }
    if (coupon.maxUses != null && coupon.usedCount >= coupon.maxUses) {
      throw new BadRequestException('This coupon has reached its maximum number of uses');
    }
    if (coupon.restaurantId && dto.restaurantId && coupon.restaurantId !== dto.restaurantId) {
      throw new BadRequestException('This coupon is not valid for the selected restaurant');
    }
    if (coupon.minOrderAmount != null && dto.orderTotal < coupon.minOrderAmount) {
      throw new BadRequestException(
        `A minimum order amount of ${coupon.minOrderAmount} is required for this coupon`,
      );
    }

    let discount: number;
    if (coupon.discountType === 'PERCENT') {
      discount = Math.min((dto.orderTotal * coupon.discountValue) / 100, dto.orderTotal);
    } else {
      discount = Math.min(coupon.discountValue, dto.orderTotal);
    }

    const finalTotal = Math.max(dto.orderTotal - discount, 0);

    return { discount, finalTotal, couponId: coupon.id };
  }

  async redeemCoupon(couponId: string) {
    return this.prisma.coupon.update({
      where: { id: couponId },
      data: { usedCount: { increment: 1 } },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.coupon.delete({ where: { id } });
  }
}
