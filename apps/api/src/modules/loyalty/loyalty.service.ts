import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { LOYALTY_TIERS, LoyaltyTier } from '@foodstack/shared';

@Injectable()
export class LoyaltyService {
  constructor(private prisma: PrismaService) {}

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

    const newPoints = user.loyaltyPoints + points;
    const tier = this.getTierForPoints(newPoints);

    const [updated] = await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: userId },
        data: { loyaltyPoints: newPoints, loyaltyTier: tier },
      }),
      this.prisma.loyaltyTransaction.create({
        data: { userId, points, type: 'earn', reason, orderId },
      }),
    ]);

    return { points: newPoints, tier, earned: points };
  }

  async redeemPoints(userId: string, points: number) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('Utilisateur non trouvé');
    if (user.loyaltyPoints < points) throw new BadRequestException('Points insuffisants');

    const newPoints = user.loyaltyPoints - points;
    const tier = this.getTierForPoints(newPoints);

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: userId },
        data: { loyaltyPoints: newPoints, loyaltyTier: tier },
      }),
      this.prisma.loyaltyTransaction.create({
        data: { userId, points: -points, type: 'redeem', reason: 'Points used at checkout' },
      }),
    ]);

    return { points: newPoints, tier, redeemed: points, cashValue: points / 100 };
  }

  async getTransactionHistory(userId: string) {
    return this.prisma.loyaltyTransaction.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  private getTierForPoints(points: number): LoyaltyTier {
    if (points >= LOYALTY_TIERS.platinum.minPoints) return 'platinum';
    if (points >= LOYALTY_TIERS.gold.minPoints) return 'gold';
    if (points >= LOYALTY_TIERS.silver.minPoints) return 'silver';
    return 'bronze';
  }
}
