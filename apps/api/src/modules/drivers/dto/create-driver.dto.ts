import { IsString, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum VehicleType { BIKE = 'bike', SCOOTER = 'scooter', CAR = 'car' }

export class CreateDriverDto {
  @ApiProperty() @IsString() userId: string;
  @ApiPropertyOptional() @IsOptional() @IsString() restaurantId?: string;
  @ApiProperty({ enum: VehicleType }) @IsEnum(VehicleType) vehicleType: VehicleType;
  @ApiPropertyOptional() @IsOptional() @IsString() vehiclePlate?: string;
}
