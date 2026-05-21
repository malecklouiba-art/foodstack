import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, IsBoolean, IsArray, Min } from 'class-validator';

export class CreateMenuItemDto {
  @ApiProperty({ example: 'cuid-restaurant-id' })
  @IsString()
  restaurantId: string;

  @ApiProperty({ example: 'cuid-category-id' })
  @IsString()
  categoryId: string;

  @ApiProperty({ example: 'Classic Cheeseburger' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: 'A juicy beef patty with cheddar' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 9.99 })
  @IsNumber()
  @Min(0)
  price: number;

  @ApiPropertyOptional({ example: 12.99 })
  @IsOptional()
  @IsNumber()
  compareAtPrice?: number;

  @ApiPropertyOptional({ example: 'https://example.com/burger.png' })
  @IsOptional()
  @IsString()
  image?: string;

  @ApiPropertyOptional({ example: 650 })
  @IsOptional()
  @IsNumber()
  calories?: number;

  @ApiPropertyOptional({ example: 15 })
  @IsOptional()
  @IsNumber()
  prepTime?: number;

  @ApiPropertyOptional({ example: ['gluten'] })
  @IsOptional()
  @IsArray()
  allergens?: string[];

  @ApiPropertyOptional({ example: ['vegan'] })
  @IsOptional()
  @IsArray()
  dietaryTags?: string[];

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsNumber()
  position?: number;
}
