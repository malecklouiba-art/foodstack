import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateRestaurantDto } from './dto/create-restaurant.dto';
import { UpdateRestaurantDto } from './dto/update-restaurant.dto';

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

@Injectable()
export class RestaurantsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(options?: { isOpen?: boolean; cuisine?: string; page?: number; limit?: number }) {
    const page  = options?.page  ?? 1;
    const limit = options?.limit ?? 50;
    return this.prisma.restaurant.findMany({
      where: {
        ...(options?.isOpen !== undefined ? { isOpen: options.isOpen } : {}),
        ...(options?.cuisine ? { cuisineType: { contains: options.cuisine, mode: 'insensitive' as const } } : {}),
      },
      orderBy: { rating: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    });
  }

  async findById(id: string) {
    const restaurant = await this.prisma.restaurant.findUnique({ where: { id } });
    if (!restaurant) throw new NotFoundException(`Restaurant #${id} not found`);
    return restaurant;
  }

  async findNearby(lat: number, lng: number, radiusM: number) {
    const radiusKm = radiusM / 1000;
    const all = await this.prisma.restaurant.findMany({
      where: { isOpen: true },
    });

    return all
      .filter((r) => {
        if (r.latitude == null || r.longitude == null) return true;
        return haversineKm(lat, lng, r.latitude, r.longitude) <= radiusKm;
      })
      .sort((a, b) => {
        if (a.latitude == null || b.latitude == null) return 0;
        return (
          haversineKm(lat, lng, a.latitude, a.longitude) -
          haversineKm(lat, lng, b.latitude, b.longitude)
        );
      });
  }

  async create(dto: CreateRestaurantDto & { address?: string; phone?: string; email?: string; settings?: Record<string, unknown> }) {
    const raw = dto as any;
    const street = raw.street ?? raw.address ?? '';
    const city   = raw.city   ?? '';
    const postalCode = raw.postalCode ?? '';
    const phone  = raw.phone ?? '';
    const email  = raw.email ?? '';
    return this.prisma.restaurant.create({
      data: {
        name: dto.name,
        description: dto.description,
        street,
        city,
        postalCode,
        phone,
        email,
        latitude: dto.latitude ?? 0,
        longitude: dto.longitude ?? 0,
        logoUrl: dto.logoUrl,
        cuisineType: dto.cuisine,
        settings: raw.settings ?? {},
        ownerId: raw.ownerId ?? '',
      } as any,
    });
  }

  async update(id: string, dto: UpdateRestaurantDto) {
    const existing = await this.findById(id);
    const { settings: newSettings, address, ...rest } = dto as any;
    const mergedSettings = newSettings
      ? { ...((existing.settings ?? {}) as Record<string, unknown>), ...newSettings }
      : undefined;
    const streetPatch = address ? { street: address } : {};
    return this.prisma.restaurant.update({
      where: { id },
      data: {
        ...rest,
        ...streetPatch,
        ...(mergedSettings ? { settings: mergedSettings as any } : {}),
      } as any,
    });
  }

  async remove(id: string) {
    await this.findById(id);
    return this.prisma.restaurant.delete({ where: { id } });
  }

  async toggleOpen(id: string) {
    const restaurant = await this.findById(id);
    return this.prisma.restaurant.update({
      where: { id },
      data: { isOpen: !restaurant.isOpen },
    });
  }

  async getZones(id: string): Promise<any[]> {
    const restaurant = await this.findById(id);
    const settings = (restaurant.settings ?? {}) as Record<string, any>;
    return settings['deliveryZones'] ?? [];
  }

  async updateZones(id: string, zones: any[]): Promise<any[]> {
    const restaurant = await this.findById(id);
    const settings = { ...((restaurant.settings ?? {}) as Record<string, any>), deliveryZones: zones };
    await this.prisma.restaurant.update({ where: { id }, data: { settings } });
    return zones;
  }
}
