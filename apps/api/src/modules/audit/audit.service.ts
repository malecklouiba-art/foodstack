import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

interface LogActionParams {
  userId?: string;
  action: string;       // ex: 'order.created', 'payment.processed', 'user.deleted'
  entityType?: string;  // ex: 'Order', 'User', 'Restaurant'
  entityId?: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
}

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  async log(params: LogActionParams): Promise<void> {
    // Fire-and-forget : ne pas await en production pour éviter de bloquer
    // mais ici on attend pour la testabilité
    await this.prisma.auditLog.create({
      data: {
        userId: params.userId,
        action: params.action,
        entityType: params.entityType,
        entityId: params.entityId,
        metadata: params.metadata as object,
        ipAddress: params.ipAddress,
      },
    }).catch((err) => {
      // Ne jamais planter le flux principal si le log échoue
      console.error('[AuditService] Failed to write audit log:', err);
    });
  }

  async query(filters: {
    userId?: string;
    action?: string;
    entityType?: string;
    page?: number;
    limit?: number;
  }) {
    const page = filters.page ?? 1;
    const limit = Math.min(filters.limit ?? 50, 200);
    const skip = (page - 1) * limit;

    const where = {
      ...(filters.userId && { userId: filters.userId }),
      ...(filters.action && { action: { contains: filters.action, mode: 'insensitive' as const } }),
      ...(filters.entityType && { entityType: filters.entityType }),
    };

    const [data, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where, orderBy: { createdAt: 'desc' }, skip, take: limit,
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return { data, total, page, limit };
  }
}
