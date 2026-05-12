import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateRestaurantDto } from './dto/create-restaurant.dto';
import { UpdateRestaurantDto } from './dto/update-restaurant.dto';

@Injectable()
export class RestaurantsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    // TODO: Add pagination, filtering by cuisine, isOpen, rating sort
    return this.prisma.restaurant.findMany();
  }

  async findById(id: string) {
    const restaurant = await this.prisma.restaurant.findUnique({ where: { id } });
    if (!restaurant) throw new NotFoundException(`Restaurant #${id} not found`);
    return restaurant;
  }

  async findNearby(lat: number, lng: number, radius: number) {
    // TODO: Implement geospatial query using PostGIS or Haversine formula
    // Example raw query:
    // SELECT *, (6371 * acos(cos(radians(?)) * cos(radians(latitude)) *
    //   cos(radians(longitude) - radians(?)) + sin(radians(?)) *
    //   sin(radians(latitude)))) AS distance FROM restaurants
    //   HAVING distance < ? ORDER BY distance
    return this.prisma.restaurant.findMany();
  }

  async create(dto: CreateRestaurantDto) {
    return this.prisma.restaurant.create({ data: dto as any });
  }

  async update(id: string, dto: UpdateRestaurantDto) {
    await this.findById(id);
    return this.prisma.restaurant.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.findById(id);
    // TODO: Soft delete — set deletedAt instead of hard delete
    return this.prisma.restaurant.delete({ where: { id } });
  }

  async toggleOpen(id: string) {
    const restaurant = await this.findById(id);
    return this.prisma.restaurant.update({
      where: { id },
      data: { isOpen: !restaurant.isOpen },
    });
  }
}
