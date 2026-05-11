import { IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum DeliveryStatus {
  ASSIGNED = 'ASSIGNED',
  PICKED_UP = 'PICKED_UP',
  EN_ROUTE = 'EN_ROUTE',
  DELIVERED = 'DELIVERED',
  FAILED = 'FAILED',
}

export class UpdateDeliveryStatusDto {
  @ApiProperty({ enum: DeliveryStatus, description: 'New delivery status' })
  @IsEnum(DeliveryStatus)
  status: DeliveryStatus;
}
