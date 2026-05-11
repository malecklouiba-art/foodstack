import { IsNumber, IsString, IsOptional, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AddPointsDto {
  @ApiProperty({ description: 'Number of points to add' })
  @IsNumber()
  @Min(1)
  points: number;

  @ApiPropertyOptional({ description: 'Reason for awarding points (e.g. order completion, referral)' })
  @IsOptional()
  @IsString()
  reason?: string;
}
