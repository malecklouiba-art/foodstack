import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { RealtimeGateway } from '../realtime/realtime.gateway';
import { NotificationsService } from '../notifications/notifications.service';
import { PushService } from '../notifications/push.service';
import { LoyaltyService } from '../loyalty/loyalty.service';
import { AuditService } from '../audit/audit.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { OrderFiltersDto } from './dto/order-filters.dto';
import { ReviewOrderDto } from './dto/review-order.dto';

const STATUS_LABELS: Record<string, string> = {
  pending: 'En attente',
  confirmed: 'Confirmée',
  preparing: 'En préparation',
  ready: 'Prête',
  delivering: 'En livraison',
  delivered: 'Livrée',
  cancelled: 'Annulée',
  refunded: 'Remboursée',
};

/**
 * Allowed forward transitions for order status.
 * Any status → 'cancelled' is always permitted (handled separately).
 */
const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['preparing', 'cancelled'],
  preparing: ['ready', 'cancelled'],
  ready: ['delivering', 'cancelled'],
  delivering: ['delivered', 'cancelled'],
  delivered: [],
  cancelled: [],
  refunded: [],
};

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly realtime: RealtimeGateway,
    private readonly notifications: NotificationsService,
    private readonly push: PushService,
    private readonly loyalty: LoyaltyService,
    private readonly audit: AuditService,
  ) {}

  async createOrder(dto: CreateOrderDto) {
    // Fetch menu items to get real prices and names
    const menuItemIds = dto.items.map((i) => i.menuItemId);
    const menuItems = await this.prisma.menuItem.findMany({
      where: { id: { in: menuItemIds } },
      select: { id: true, name: true, price: true },
    });
    const menuMap = new Map(menuItems.map((m) => [m.id, m]));

    const DELIVERY_FEE = 2.90;
    const TAX_RATE = 0.10;

    const orderItemsData = dto.items.map((item) => {
      const menuItem = menuMap.get(item.menuItemId);
      const price = menuItem?.price ?? 0;
      return {
        menuItemId: item.menuItemId,
        quantity: item.quantity,
        notes: item.notes,
        name: menuItem?.name ?? '',
        price,
        subtotal: price * item.quantity,
      };
    });

    const subtotal = orderItemsData.reduce((sum, i) => sum + i.subtotal, 0);
    const tax = Math.round(subtotal * TAX_RATE * 100) / 100;
    const total = Math.round((subtotal + DELIVERY_FEE + tax) * 100) / 100;

    const order = await this.prisma.order.create({
      data: {
        restaurantId: dto.restaurantId,
        customerId: dto.customerId,
        deliveryAddress: dto.deliveryAddress ? { address: dto.deliveryAddress } : undefined,
        notes: dto.deliveryNotes,
        orderNumber: `ORD-${Date.now()}`,
        subtotal,
        deliveryFee: DELIVERY_FEE,
        tax,
        total,
        status: 'pending',
        items: {
          create: orderItemsData,
        },
      } as any,
      include: { items: true, customer: true },
    });

    this.realtime.emitOrderCreated({
      orderId: order.id,
      orderNumber: order.orderNumber,
      restaurantId: order.restaurantId,
      status: order.status,
      customerId: order.customerId,
      total: order.total,
      itemCount: (order.items as unknown[]).length,
    });

    // Send order confirmation email — fire-and-forget, never block order creation
    const customerEmail = (order as any).customer?.email as string | undefined;
    if (customerEmail) {
      const orderItems = (order.items as Array<{ name: string; quantity: number; price: number }>).map(
        (item) => ({
          name: item.name || 'Article',
          quantity: item.quantity,
          price: item.price,
        }),
      );
      this.notifications
        .sendOrderConfirmation(customerEmail, {
          orderNumber: order.orderNumber,
          items: orderItems,
          total: order.total,
          estimatedTime: 30,
        })
        .catch((err: unknown) => {
          this.logger.error(`Failed to send order confirmation email for ${order.orderNumber}`, err);
        });
    }

    // Audit log — fire-and-forget, never block order creation
    this.audit.log({
      userId: order.customerId,
      action: 'order.created',
      entityType: 'Order',
      entityId: order.id,
    }).catch(() => { /* audit failures must never surface */ });

    // Strip the customer relation before returning to avoid leaking data
    const { customer: _customer, ...orderWithoutCustomer } = order as any;
    return orderWithoutCustomer;
  }

  async findAll() {
    return this.prisma.order.findMany({
      include: { items: true },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
  }

  async findById(id: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: { items: true },
    });
    if (!order) throw new NotFoundException(`Order #${id} not found`);
    return order;
  }

  async findByRestaurant(restaurantId: string, filters: OrderFiltersDto) {
    return this.prisma.order.findMany({
      where: {
        restaurantId,
        ...(filters.status && { status: filters.status as any }),
        ...(filters.from || filters.to
          ? {
              createdAt: {
                ...(filters.from && { gte: new Date(filters.from) }),
                ...(filters.to && { lte: new Date(filters.to) }),
              },
            }
          : {}),
      },
      include: { items: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByCustomer(customerId: string) {
    return this.prisma.order.findMany({
      where: { customerId },
      include: { items: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByDriver(driverId: string) {
    return this.prisma.order.findMany({
      where: { driverId },
      include: { items: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateStatus(id: string, dto: UpdateOrderStatusDto) {
    const order = await this.findById(id);

    const allowed = ALLOWED_TRANSITIONS[order.status] ?? [];
    if (!allowed.includes(dto.status)) {
      throw new BadRequestException(
        `Invalid status transition: ${order.status} → ${dto.status}`,
      );
    }

    const updated = await this.prisma.order.update({
      where: { id },
      data: { status: dto.status as any },
      include: { items: true },
    });

    const payload = {
      orderId: updated.id,
      orderNumber: updated.orderNumber,
      restaurantId: updated.restaurantId,
      status: updated.status,
      customerId: updated.customerId ?? undefined,
      total: updated.total,
      itemCount: (updated.items as unknown[]).length,
    };

    this.realtime.emitOrderStatusUpdated(payload);

    if (updated.status === 'ready') {
      this.realtime.emitOrderReady(payload);
    }

    // Send status update email + Expo push to customer — fire-and-forget
    if (updated.customerId) {
      const statusLabel = STATUS_LABELS[updated.status] ?? updated.status;

      this.prisma.user
        .findUnique({ where: { id: updated.customerId }, select: { email: true } })
        .then((user) => {
          if (!user?.email) return;
          return this.notifications.sendOrderStatusUpdate(user.email, {
            orderNumber: updated.orderNumber,
            status: updated.status,
            statusLabel,
          });
        })
        .catch((err: unknown) => {
          this.logger.error(`Failed to send status update email for order ${id}`, err);
        });

      // Mobile push notification
      this.push.sendExpoNotification(
        updated.customerId,
        `Commande ${updated.orderNumber}`,
        statusLabel,
        { orderId: updated.id, status: updated.status },
      ).catch((err: unknown) => {
        this.logger.warn(`Expo push failed for order ${id}`, err);
      });

      // Award loyalty points on delivery: 1 pt per euro
      if (updated.status === 'delivered' && updated.total) {
        const points = Math.floor(updated.total);
        this.loyalty.addPoints(
          updated.customerId,
          points,
          `Commande ${updated.orderNumber} livrée`,
          updated.id,
        ).catch((err: unknown) => {
          this.logger.warn(`Failed to award loyalty points for order ${id}`, err);
        });
      }
    }

    return updated;
  }

  async cancelOrder(id: string, reason: string) {
    const order = await this.findById(id);
    if (order.status === 'delivered') {
      throw new BadRequestException('Impossible d\'annuler une commande déjà livrée');
    }
    const cancelled = await this.prisma.order.update({
      where: { id },
      data: {
        status: 'cancelled',
        cancelReason: reason,
      },
    });

    // Audit log — fire-and-forget
    this.audit.log({
      action: 'order.cancelled',
      entityType: 'Order',
      entityId: id,
    }).catch(() => { /* audit failures must never surface */ });

    return cancelled;
  }

  async assignDriver(orderId: string, driverId: string) {
    await this.findById(orderId);
    return this.prisma.order.update({
      where: { id: orderId },
      data: { driverId },
    });
  }

  async reviewOrder(orderId: string, dto: ReviewOrderDto, userId: string) {
    const order = await this.findById(orderId);

    if (order.status !== 'delivered') {
      throw new BadRequestException('Reviews can only be submitted for delivered orders');
    }

    // Upsert the review linked to this order
    await this.prisma.review.upsert({
      where: { orderId },
      create: {
        orderId,
        restaurantId: order.restaurantId,
        userId,
        rating: dto.rating,
        comment: dto.comment,
      },
      update: {
        rating: dto.rating,
        comment: dto.comment,
      },
    });

    return { ok: true };
  }
}
