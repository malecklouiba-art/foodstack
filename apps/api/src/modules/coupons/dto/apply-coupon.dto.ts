import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, Min } from 'class-validator';

export class ApplyCouponDto {
  @ApiProperty({ example: 'SUMMER20' })
  @IsString()
  code: string;

  @ApiPropertyOptional({ example: 'cuid-restaurant-id' })
  @IsOptional()
  @IsString()
  restaurantId?: string;

  @ApiProperty({ example: 45.99 })
  @IsNumber()
  @Min(0)
  orderTotal: number;
}
