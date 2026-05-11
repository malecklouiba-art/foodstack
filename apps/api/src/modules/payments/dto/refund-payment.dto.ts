import { IsString, IsNumber, IsOptional, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RefundPaymentDto {
  @ApiProperty({ description: 'Stripe PaymentIntent ID to refund' })
  @IsString()
  paymentIntentId: string;

  @ApiPropertyOptional({ description: 'Amount to refund in smallest currency unit. Omit for full refund.' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  amount?: number;
}
