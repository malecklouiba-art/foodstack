import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, IsBoolean, Min, Max } from 'class-validator';

export class CreateRestaurantDto {
  @ApiProperty({ example: 'Burger Palace' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: 'Best burgers in town' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: '123 Main St' })
  @IsString()
  address: string;

  @ApiPropertyOptional({ example: 40.7128 })
  @IsOptional()
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude?: number;

  @ApiPropertyOptional({ example: -74.006 })
  @IsOptional()
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude?: number;

  @ApiPropertyOptional({ example: '+1234567890' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ example: 'https://example.com/logo.png' })
  @IsOptional()
  @IsString()
  logoUrl?: string;

  @ApiPropertyOptional({ example: 'American' })
  @IsOptional()
  @IsString()
  cuisine?: string;
}
