import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateInventoryItemDto } from './dto/create-inventory-item.dto';
import { UpdateInventoryItemDto } from './dto/update-inventory-item.dto';

@Injectable()
export class InventoryService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(restaurantId: string) {
    // TODO: Add pagination and search by name
    return this.prisma.inventoryItem.findMany({
      where: { restaurantId },
      orderBy: { name: 'asc' },
    });
  }

  async findLowStock(restaurantId: string) {
    // TODO: Return items where quantity <= lowStockThreshold
    return this.prisma.inventoryItem.findMany({
      where: {
        restaurantId,
        // TODO: Prisma raw query or computed field for quantity <= lowStockThreshold
      },
    });
  }

  async findById(id: string) {
    const item = await this.prisma.inventoryItem.findUnique({ where: { id } });
    if (!item) throw new NotFoundException(`Inventory item #${id} not found`);
    return item;
  }

  async createItem(dto: CreateInventoryItemDto) {
    return this.prisma.inventoryItem.create({ data: dto });
  }

  async updateItem(id: string, dto: UpdateInventoryItemDto) {
    await this.findById(id);
    return this.prisma.inventoryItem.update({ where: { id }, data: dto });
  }

  async adjustStock(id: string, quantity: number, reason?: string) {
    const item = await this.findById(id);
    // TODO: Record adjustment in an InventoryAdjustment audit table
    const newQuantity = item.quantity + quantity;
    return this.prisma.inventoryItem.update({
      where: { id },
      data: { quantity: newQuantity < 0 ? 0 : newQuantity },
    });
  }

  async getLowStockAlerts(restaurantId: string) {
    // TODO: Return structured alerts with item details and suggested reorder quantities
    const items = await this.findLowStock(restaurantId);
    return items.map((item) => ({
      item,
      alert: `${item.name} is running low (${item.quantity} ${item.unit ?? 'units'} remaining)`,
    }));
  }

  async removeItem(id: string) {
    await this.findById(id);
    // TODO: Soft delete — set deletedAt instead of hard delete
    return this.prisma.inventoryItem.delete({ where: { id } });
  }
}
