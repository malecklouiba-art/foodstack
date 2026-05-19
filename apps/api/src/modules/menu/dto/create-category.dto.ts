import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber } from 'class-validator';

export class CreateCategoryDto {
  @ApiProperty({ example: 'cuid-restaurant-id' })
  @IsString()
  restaurantId: string;

  @ApiProperty({ example: 'Burgers' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: 'Our signature burgers' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 'https://example.com/cat.png' })
  @IsOptional()
  @IsString()
  image?: string;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsNumber()
  position?: number;
}
