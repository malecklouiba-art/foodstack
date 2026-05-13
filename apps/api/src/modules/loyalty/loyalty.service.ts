import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { LOYALTY_TIERS, LoyaltyTier } from '@foodstack/shared';

const DEFAULT_POINTS_PER_EURO = 10;

@Injectable()
export class LoyaltyService {
  constructor(private prisma: PrismaService) {}

  // ---------------------------------------------------------------------------
  // Core: earn points when an order is delivered
  // ---------------------------------------------------------------------------
  async earnPoints(
    userId: string,
    orderId: string,
    orderTotal: number,
    restaurantId: string,
  ) {
    // Fetch restaurant settings for custom pointsPerEuro rate
    const settings = await (this.prisma as any).restaurantSettings
      ?.findUnique?.({ where: { restaurantId } })
      .catch(() => null) as { pointsPerEuro?: number } | null;

    const pointsPerEuro: number =
      (settings as any)?.pointsPerEuro ?? DEFAULT_POINTS_PER_EURO;

    const points = Math.floor(orderTotal * pointsPerEuro);

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('Utilisateur non trouvé');

    const newTotal = user.loyaltyPoints + points;
    const tier = this.getTierForPoints(newTotal);

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: userId },
        data: {
          loyaltyPoints: { increment: points },
          loyaltyTier: tier,
        },
      }),
      this.prisma.loyaltyTransaction.create({
        data: {
          userId,
          orderId,
          points,
          type: 'earned',
          reason: `Commande #${orderId}`,
        },
      }),
    ]);

    return { points, newTotal, tier };
  }

  // ---------------------------------------------------------------------------
  // Core: redeem points at checkout
  // ---------------------------------------------------------------------------
  async redeemPoints(userId: string, points: number, orderId?: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('Utilisateur non trouvé');
    if (user.loyaltyPoints < points) {
      throw new BadRequestException('Points insuffisants');
    }

    const newTotal = user.loyaltyPoints - points;
    const tier = this.getTierForPoints(newTotal);

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: userId },
        data: {
          loyaltyPoints: { decrement: points },
          loyaltyTier: tier,
        },
      }),
      this.prisma.loyaltyTransaction.create({
        data: {
          userId,
          orderId: orderId ?? null,
          points: -points,
          type: 'redeemed',
          reason: 'Échange de points',
        },
      }),
    ]);

    return { pointsRedeemed: points, newTotal };
  }

  // ---------------------------------------------------------------------------
  // History & balance
  // ---------------------------------------------------------------------------
  async getHistory(userId: string) {
    return this.prisma.loyaltyTransaction.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async getBalance(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { loyaltyPoints: true, loyaltyTier: true },
    });
    if (!user) throw new NotFoundException('Utilisateur non trouvé');

    const { nextTier, pointsToNextTier } = this.getNextTierInfo(
      user.loyaltyPoints,
      user.loyaltyTier as LoyaltyTier,
    );

    return {
      points: user.loyaltyPoints,
      tier: user.loyaltyTier,
      nextTier,
      pointsToNextTier,
    };
  }

  // ---------------------------------------------------------------------------
  // Legacy methods kept for controller compatibility
  // ---------------------------------------------------------------------------
  async getPoints(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { loyaltyPoints: true, loyaltyTier: true },
    });
    if (!user) throw new NotFoundException('Utilisateur non trouvé');
    return user;
  }

  async addPoints(userId: string, points: number, reason: string, orderId?: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('Utilisateur non trouvé');

    const newTotal = user.loyaltyPoints + points;
    const tier = this.getTierForPoints(newTotal);

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: userId },
        data: {
          loyaltyPoints: { increment: points },
          loyaltyTier: tier,
        },
      }),
      this.prisma.loyaltyTransaction.create({
        data: { userId, points, type: 'earned', reason, orderId },
      }),
    ]);

    return { points: newTotal, tier, earned: points };
  }

  async getTransactionHistory(userId: string) {
    return this.getHistory(userId);
  }

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------
  private getTierForPoints(points: number): LoyaltyTier {
    if (points >= LOYALTY_TIERS.platinum.minPoints) return 'platinum';
    if (points >= LOYALTY_TIERS.gold.minPoints) return 'gold';
    if (points >= LOYALTY_TIERS.silver.minPoints) return 'silver';
    return 'bronze';
  }

  private getNextTierInfo(
    points: number,
    currentTier: LoyaltyTier,
  ): { nextTier: LoyaltyTier | null; pointsToNextTier: number } {
    const order: LoyaltyTier[] = ['bronze', 'silver', 'gold', 'platinum'];
    const idx = order.indexOf(currentTier);
    if (idx === -1 || idx === order.length - 1) {
      return { nextTier: null, pointsToNextTier: 0 };
    }
    const nextTier = order[idx + 1];
    const pointsToNextTier = LOYALTY_TIERS[nextTier].minPoints - points;
    return { nextTier, pointsToNextTier: Math.max(0, pointsToNextTier) };
  }
}
