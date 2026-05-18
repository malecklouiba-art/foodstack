import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateDriverDto } from './dto/create-driver.dto';
import { UpdateLocationDto } from './dto/update-location.dto';

@Injectable()
export class DriversService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(restaurantId: string) {
    return this.prisma.driver.findMany({
      where: { restaurantId },
      include: {
        user: {
          select: { firstName: true, lastName: true, email: true },
        },
      },
    });
  }

  findOne(id: string) {
    return this.prisma.driver.findUnique({
      where: { id },
      include: {
        user: {
          select: { firstName: true, lastName: true, email: true },
        },
      },
    });
  }

  findByUserId(userId: string) {
    return this.prisma.driver.findFirst({
      where: { userId },
      include: {
        user: {
          select: { firstName: true, lastName: true, email: true, phone: true, avatar: true },
        },
      },
    });
  }

  create(dto: CreateDriverDto) {
    return this.prisma.driver.create({
      data: {
        userId: dto.userId,
        restaurantId: dto.restaurantId,
        vehicleType: dto.vehicleType,
        vehiclePlate: dto.vehiclePlate,
      },
    });
  }

  updateLocation(id: string, dto: UpdateLocationDto) {
    return this.prisma.driver.update({
      where: { id },
      data: {
        latitude: dto.latitude,
        longitude: dto.longitude,
        updatedAt: new Date(),
      },
    });
  }

  setAvailability(id: string, available: boolean) {
    return this.prisma.driver.update({
      where: { id },
      data: { isAvailable: available },
    });
  }

  setOnline(id: string, online: boolean) {
    return this.prisma.driver.update({
      where: { id },
      data: { isOnline: online },
    });
  }

  remove(id: string) {
    return this.prisma.driver.delete({ where: { id } });
  }
}
