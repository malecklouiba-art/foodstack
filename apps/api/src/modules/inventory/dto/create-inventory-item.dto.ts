import { IsString, IsNumber, IsOptional, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateInventoryItemDto {
  @ApiProperty({ description: 'Restaurant this item belongs to' })
  @IsString()
  restaurantId: string;

  @ApiProperty({ description: 'Name of the inventory item' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: 'Unit of measurement (e.g. kg, litre, piece)' })
  @IsOptional()
  @IsString()
  unit?: string;

  @ApiProperty({ description: 'Current stock quantity' })
  @IsNumber()
  @Min(0)
  quantity: number;

  @ApiPropertyOptional({ description: 'Minimum stock level before a low-stock alert is triggered' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  lowStockThreshold?: number;
}
