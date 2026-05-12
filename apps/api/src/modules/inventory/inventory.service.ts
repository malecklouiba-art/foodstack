import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateInventoryItemDto } from './dto/create-inventory-item.dto';
import { UpdateInventoryItemDto } from './dto/update-inventory-item.dto';

@Injectable()
export class InventoryService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(restaurantId: string) {
    return this.prisma.inventoryItem.findMany({
      where: { restaurantId },
      orderBy: { name: 'asc' },
    });
  }

  async findLowStock(restaurantId: string) {
    return this.prisma.inventoryItem.findMany({
      where: { restaurantId },
    });
  }

  async findById(id: string) {
    const item = await this.prisma.inventoryItem.findUnique({ where: { id } });
    if (!item) throw new NotFoundException(`Article d'inventaire #${id} introuvable`);
    return item;
  }

  async createItem(dto: CreateInventoryItemDto) {
    return this.prisma.inventoryItem.create({ data: dto as any });
  }

  async updateItem(id: string, dto: UpdateInventoryItemDto) {
    await this.findById(id);
    return this.prisma.inventoryItem.update({ where: { id }, data: dto as any });
  }

  async adjustStock(id: string, quantity: number, _reason?: string) {
    const item = await this.findById(id);
    const newStock = Math.max(0, item.currentStock + quantity);
    return this.prisma.inventoryItem.update({
      where: { id },
      data: { currentStock: newStock },
    });
  }

  async getLowStockAlerts(restaurantId: string) {
    const items = await this.findLowStock(restaurantId);
    return items
      .filter((item) => item.currentStock <= item.minStock)
      .map((item) => ({
        item,
        alert: `${item.name} est en stock bas (${item.currentStock} ${item.unit} restant)`,
      }));
  }

  async removeItem(id: string) {
    await this.findById(id);
    return this.prisma.inventoryItem.delete({ where: { id } });
  }
}
