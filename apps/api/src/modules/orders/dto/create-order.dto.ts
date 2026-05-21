import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsNumber,
  IsString,
  IsOptional,
  IsNotEmpty,
  ValidateNested,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class OrderItemDto {
  @ApiProperty({ example: 'cjld2cjxh0000qzrmn831i7rn' })
  @IsString()
  @IsNotEmpty()
  menuItemId: string;

  @ApiProperty({ example: 2 })
  @IsNumber()
  @Min(1)
  quantity: number;

  @ApiPropertyOptional({ example: 'No onions please' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class CreateOrderDto {
  @ApiProperty({ example: 'cjld2cjxh0000qzrmn831i7rn' })
  @IsString()
  @IsNotEmpty()
  restaurantId: string;

  @ApiProperty({ example: 'cjld2cjxh0000qzrmn831i7rn' })
  @IsString()
  @IsNotEmpty()
  customerId: string;

  @ApiProperty({ type: [OrderItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];

  @ApiPropertyOptional({ example: '123 Delivery St' })
  @IsOptional()
  @IsString()
  deliveryAddress?: string;

  @ApiPropertyOptional({ example: 'Leave at door' })
  @IsOptional()
  @IsString()
  deliveryNotes?: string;
}
