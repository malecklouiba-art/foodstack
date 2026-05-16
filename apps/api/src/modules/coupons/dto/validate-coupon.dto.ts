import { IsString, IsNumber, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ValidateCouponDto {
  @ApiProperty()
  @IsString()
  code: string;

  @ApiProperty()
  @IsString()
  restaurantId: string;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  orderTotal: number;
}
