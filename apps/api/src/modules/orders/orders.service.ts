import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { OrderFiltersDto } from './dto/order-filters.dto';
import { EventsGateway } from '../events/events.gateway';
import { NotificationsService } from '../notifications/notifications.service';
import { SmsService } from '../notifications/sms.service';
import { LoyaltyService } from '../loyalty/loyalty.service';
import { CouponsService } from '../coupons/coupons.service';

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly events: EventsGateway,
    private readonly notifications: NotificationsService,
    private readonly sms: SmsService,
    private readonly loyaltyService: LoyaltyService,
    private readonly couponsService: CouponsService,
  ) {}

  async createOrder(dto: CreateOrderDto) {
    // Compute a placeholder subtotal (price resolution happens elsewhere)
    const subtotal = 0;

    let couponDiscount = 0;
    let couponId: string | undefined;

    if (dto.couponCode) {
      const couponResult = await this.couponsService.applyCoupon({
        code: dto.couponCode,
        restaurantId: dto.restaurantId,
        orderTotal: subtotal,
      });
      couponDiscount = couponResult.discount;
      couponId = couponResult.couponId;
    }

    const order = await this.prisma.order.create({
      data: {
        restaurantId: dto.restaurantId,
        customerId: dto.customerId,
        deliveryAddress: dto.deliveryAddress ? { address: dto.deliveryAddress } : undefined,
        notes: dto.deliveryNotes,
        orderNumber: `ORD-${Date.now()}`,
        subtotal,
        discount: couponDiscount,
        total: Math.max(subtotal - couponDiscount, 0),
        status: 'pending',
        items: {
          create: dto.items.map((item) => ({
            menuItemId: item.menuItemId,
            quantity: item.quantity,
            notes: item.notes,
            name: '',
            price: 0,
            subtotal: 0,
          })),
        },
      } as any,
      include: {
        items: true,
        customer: { select: { email: true, firstName: true } },
        restaurant: { select: { name: true } },
      },
    });

    if (couponId) {
      void this.couponsService.redeemCoupon(couponId).catch((err: Error) => {
        this.logger.error(`Failed to redeem coupon ${couponId}: ${err.message}`);
      });
    }

    this.events.emitNewOrder(order.restaurantId, order as unknown as Record<string, unknown>);

    const orderAny = order as any;
    const restaurantName = orderAny.restaurant?.name ?? 'Unknown Restaurant';

    if (orderAny.customer?.email) {
      void this.notifications.sendOrderConfirmation(orderAny.customer.email, {
        orderNumber: order.orderNumber,
        total: order.total,
        restaurantName,
        items: orderAny.items.map((item: any) => ({
          name: item.name || 'Item',
          qty: item.quantity,
          price: item.price,
        })),
      }).catch((err) => {
        this.logger.error(`Order confirmation email failed: ${(err as Error).message}`);
      });
    }

    if (orderAny.customer?.phone) {
      void this.sms.sendOrderConfirmation(
        orderAny.customer.phone,
        order.orderNumber,
        restaurantName,
        order.total,
      ).catch((err: Error) => {
        this.logger.error(`Order confirmation SMS failed: ${err.message}`);
      });
    }

    return order;
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

  async updateStatus(id: string, dto: UpdateOrderStatusDto) {
    const order = await this.findById(id);
    const updated = await this.prisma.order.update({
      where: { id },
      data: { status: dto.status as any },
    });
    this.events.emitOrderStatusUpdate({
      orderId: id,
      restaurantId: order.restaurantId,
      status: dto.status,
      updatedAt: updated.updatedAt.toISOString(),
    });

    if (dto.status === 'delivered' && order.customerId) {
      this.loyaltyService
        .earnPoints(order.customerId, id, order.total, order.restaurantId)
        .catch((err: Error) => {
          this.logger.error(`Failed to award loyalty points for order ${id}: ${err.message}`);
        });
    }

    const orderWithCustomer = await this.prisma.order.findUnique({
      where: { id },
      include: { customer: { select: { phone: true } } },
    });
    const phone = (orderWithCustomer as any)?.customer?.phone;
    if (phone) {
      void this.sms.sendOrderStatusUpdate(phone, order.orderNumber, dto.status).catch((err: Error) => {
        this.logger.error(`Order status SMS failed: ${err.message}`);
      });
    }

    return updated;
  }

  async cancelOrder(id: string, reason: string) {
    const order = await this.findById(id);
    if (order.status === 'delivered') {
      throw new BadRequestException('Impossible d\'annuler une commande déjà livrée');
    }
    return this.prisma.order.update({
      where: { id },
      data: {
        status: 'cancelled',
        cancelReason: reason,
      },
    });
  }

  async assignDriver(orderId: string, driverId: string) {
    await this.findById(orderId);
    return this.prisma.order.update({
      where: { id: orderId },
      data: { driverId },
    });
  }
}
