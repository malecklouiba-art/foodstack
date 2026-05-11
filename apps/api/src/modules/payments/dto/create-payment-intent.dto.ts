import { IsNumber, IsString, IsOptional, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePaymentIntentDto {
  @ApiProperty({ description: 'Amount in the smallest currency unit (e.g. pence, cents)' })
  @IsNumber()
  @Min(1)
  amount: number;

  @ApiProperty({ description: 'ISO 4217 currency code (e.g. gbp, usd)', example: 'gbp' })
  @IsString()
  currency: string;

  @ApiProperty({ description: 'ID of the order being paid for' })
  @IsString()
  orderId: string;

  @ApiPropertyOptional({ description: 'ID of the Stripe customer' })
  @IsOptional()
  @IsString()
  customerId?: string;
}
