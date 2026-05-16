import { IsString, IsEnum, IsNumber, IsOptional, IsDateString, Min, IsInt } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum DiscountType {
  PERCENT = 'percent',
  FIXED = 'fixed',
}

export class CreateCouponDto {
  @ApiProperty()
  @IsString()
  code: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ enum: DiscountType, default: DiscountType.PERCENT })
  @IsEnum(DiscountType)
  discountType: DiscountType;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  discountValue: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  minOrderValue?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  maxUses?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  expiresAt?: string;

  @ApiProperty()
  @IsString()
  restaurantId: string;
}
