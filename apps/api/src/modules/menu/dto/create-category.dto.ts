import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber, IsUUID } from 'class-validator';

export class CreateCategoryDto {
  @ApiProperty({ example: 'cuid-restaurant-id' })
  @IsUUID()
  restaurantId: string;

  @ApiProperty({ example: 'Burgers' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: 'Our signature burgers' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsNumber()
  sortOrder?: number;
}
