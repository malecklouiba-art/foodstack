import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateTableDto } from './dto/create-table.dto';
import { UpdateTableDto } from './dto/update-table.dto';

@Injectable()
export class TablesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(restaurantId: string) {
    return this.prisma.restaurantTable.findMany({
      where: { restaurantId },
      orderBy: { number: 'asc' },
    });
  }

  async findOne(id: string) {
    const table = await this.prisma.restaurantTable.findUnique({ where: { id } });
    if (!table) throw new NotFoundException(`Table #${id} not found`);
    return table;
  }

  async create(restaurantId: string, dto: CreateTableDto) {
    return this.prisma.restaurantTable.create({
      data: {
        restaurantId,
        number: dto.number,
        capacity: dto.capacity,
        section: dto.section ?? 'Salle principale',
        status: dto.status ?? 'free',
        qrCode: dto.qrCode,
      },
    });
  }

  async update(id: string, dto: UpdateTableDto) {
    await this.findOne(id);
    return this.prisma.restaurantTable.update({
      where: { id },
      data: {
        ...(dto.number !== undefined && { number: dto.number }),
        ...(dto.capacity !== undefined && { capacity: dto.capacity }),
        ...(dto.section !== undefined && { section: dto.section }),
        ...(dto.status !== undefined && { status: dto.status }),
        ...(dto.qrCode !== undefined && { qrCode: dto.qrCode }),
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.restaurantTable.delete({ where: { id } });
  }

  async updateStatus(id: string, status: string) {
    await this.findOne(id);
    return this.prisma.restaurantTable.update({
      where: { id },
      data: { status },
    });
  }
}
