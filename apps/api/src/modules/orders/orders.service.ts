import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { RealtimeGateway } from '../realtime/realtime.gateway';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { OrderFiltersDto } from './dto/order-filters.dto';

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly realtime: RealtimeGateway,
  ) {}

  async createOrder(dto: CreateOrderDto) {
    const order = await this.prisma.order.create({
      data: {
        restaurantId: dto.restaurantId,
        customerId: dto.customerId,
        deliveryAddress: dto.deliveryAddress ? { address: dto.deliveryAddress } : undefined,
        notes: dto.deliveryNotes,
        orderNumber: `ORD-${Date.now()}`,
        subtotal: 0,
        total: 0,
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
      include: { items: true },
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
