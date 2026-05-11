import { IsDateString, IsOptional, IsEnum } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export enum PeriodGranularity {
  DAY = 'day',
  WEEK = 'week',
  MONTH = 'month',
  YEAR = 'year',
}

export class DateRangeDto {
  @ApiPropertyOptional({ description: 'Start date (ISO 8601)', example: '2024-01-01' })
  @IsOptional()
  @IsDateString()
  from?: string;

  @ApiPropertyOptional({ description: 'End date (ISO 8601)', example: '2024-12-31' })
  @IsOptional()
  @IsDateString()
  to?: string;
}

export class PeriodDto extends DateRangeDto {
  @ApiPropertyOptional({ enum: PeriodGranularity, description: 'Time granularity for grouping' })
  @IsOptional()
  @IsEnum(PeriodGranularity)
  period?: PeriodGranularity;
}
