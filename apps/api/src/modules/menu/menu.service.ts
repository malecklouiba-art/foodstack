import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { CreateMenuItemDto } from './dto/create-menu-item.dto';
import { UpdateMenuItemDto } from './dto/update-menu-item.dto';

@Injectable()
export class MenuService {
  constructor(private readonly prisma: PrismaService) {}

  async getMenu(restaurantId: string) {
    const cats = await this.prisma.menuCategory.findMany({
      where: { restaurantId },
      include: { items: { orderBy: { position: 'asc' } } },
      orderBy: { position: 'asc' },
    });
    // Return both the flat structure (categories + items) AND the nested array
    // so both web dashboard and mobile apps can consume this endpoint.
    const items = cats.flatMap((c) => c.items);
    return { categories: cats, items };
  }

  async createCategory(dto: CreateCategoryDto) {
    return this.prisma.menuCategory.create({ data: dto });
  }

  async updateCategory(id: string, dto: UpdateCategoryDto) {
    const category = await this.prisma.menuCategory.findUnique({ where: { id } });
    if (!category) throw new NotFoundException(`Category #${id} not found`);
    return this.prisma.menuCategory.update({ where: { id }, data: dto });
  }

  async deleteCategory(id: string) {
    const category = await this.prisma.menuCategory.findUnique({ where: { id } });
    if (!category) throw new NotFoundException(`Category #${id} not found`);
    await this.prisma.menuItem.deleteMany({ where: { categoryId: id } });
    return this.prisma.menuCategory.delete({ where: { id } });
  }

  async createItem(dto: CreateMenuItemDto) {
    return this.prisma.menuItem.create({ data: { description: '', ...dto as any } });
  }

  async updateItem(id: string, dto: UpdateMenuItemDto) {
    const item = await this.prisma.menuItem.findUnique({ where: { id } });
    if (!item) throw new NotFoundException(`Menu item #${id} not found`);
    return this.prisma.menuItem.update({ where: { id }, data: dto });
  }

  async deleteItem(id: string) {
    const item = await this.prisma.menuItem.findUnique({ where: { id } });
    if (!item) throw new NotFoundException(`Menu item #${id} not found`);
    return this.prisma.menuItem.delete({ where: { id } });
  }

  async toggleItemAvailability(id: string) {
    const item = await this.prisma.menuItem.findUnique({ where: { id } });
    if (!item) throw new NotFoundException(`Menu item #${id} not found`);
    return this.prisma.menuItem.update({
      where: { id },
      data: { isActive: !item.isActive },
    });
  }
}
