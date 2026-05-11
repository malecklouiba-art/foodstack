import { IsNumber, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RedeemPointsDto {
  @ApiProperty({ description: 'Number of points to redeem' })
  @IsNumber()
  @Min(1)
  points: number;
}
