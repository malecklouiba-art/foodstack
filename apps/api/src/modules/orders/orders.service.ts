import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto, OrderStatus } from './dto/update-order-status.dto';
import { OrderFiltersDto } from './dto/order-filters.dto';

@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService) {}

  async createOrder(dto: CreateOrderDto) {
    // TODO: Validate menu items belong to the given restaurant
    // TODO: Calculate total price from item prices * quantities
    // TODO: Create order with nested order items in a transaction
    return this.prisma.order.create({
      data: {
        restaurantId: dto.restaurantId,
        customerId: dto.customerId,
        deliveryAddress: dto.deliveryAddress,
        deliveryNotes: dto.deliveryNotes,
        status: OrderStatus.PENDING,
        items: {
          create: dto.items.map((item) => ({
            menuItemId: item.menuItemId,
            quantity: item.quantity,
            notes: item.notes,
            // TODO: Fetch and store unitPrice from menuItem.price
          })),
        },
      },
      include: { items: true },
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
    // TODO: Apply status and date range filters
    return this.prisma.order.findMany({
      where: {
        restaurantId,
        ...(filters.status && { status: filters.status }),
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
    await this.findById(id);
    // TODO: Validate status transition (e.g., DELIVERED -> PENDING is invalid)
    return this.prisma.order.update({
      where: { id },
      data: { status: dto.status },
    });
  }

  async cancelOrder(id: string, reason: string) {
    const order = await this.findById(id);
    if (order.status === OrderStatus.DELIVERED) {
      throw new BadRequestException('Cannot cancel a delivered order');
    }
    return this.prisma.order.update({
      where: { id },
      data: {
        status: OrderStatus.CANCELLED,
        cancellationReason: reason,
      },
    });
  }

  async assignDriver(orderId: string, driverId: string) {
    await this.findById(orderId);
    // TODO: Validate driver exists and is available
    return this.prisma.order.update({
      where: { id: orderId },
      data: { driverId },
    });
  }
}
