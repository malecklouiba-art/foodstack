import { IsNumber, IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AdjustStockDto {
  @ApiProperty({ description: 'Quantity to add (positive) or remove (negative)' })
  @IsNumber()
  quantity: number;

  @ApiPropertyOptional({ description: 'Reason for the stock adjustment' })
  @IsOptional()
  @IsString()
  reason?: string;
}
