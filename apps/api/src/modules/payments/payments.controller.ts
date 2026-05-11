import {
  Controller,
  Post,
  Body,
  Headers,
  RawBodyRequest,
  Req,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { Request } from 'express';
import Stripe from 'stripe';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { CreatePaymentIntentDto } from './dto/create-payment-intent.dto';
import { ConfirmPaymentDto } from './dto/confirm-payment.dto';
import { RefundPaymentDto } from './dto/refund-payment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('payments')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('intent')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Create a Stripe PaymentIntent for an order' })
  createPaymentIntent(@Body() dto: CreatePaymentIntentDto) {
    return this.paymentsService.createPaymentIntent(dto);
  }

  @Post('confirm')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Confirm a PaymentIntent as successfully completed' })
  confirmPayment(@Body() dto: ConfirmPaymentDto) {
    return this.paymentsService.confirmPayment(dto.paymentIntentId);
  }

  @Post('refund')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Refund a payment (full or partial)' })
  refund(@Body() dto: RefundPaymentDto) {
    return this.paymentsService.refund(dto.paymentIntentId, dto.amount);
  }

  @Post('webhook')
  @ApiOperation({ summary: 'Stripe webhook handler — do not call directly' })
  async handleWebhook(
    @Headers('stripe-signature') signature: string,
    @Req() req: RawBodyRequest<Request>,
  ) {
    // TODO: Move secret to ConfigService
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET ?? '';
    if (!webhookSecret) {
      throw new BadRequestException('Stripe webhook secret is not configured');
    }
    let event: Stripe.Event;
    try {
      const stripe = new (require('stripe'))(process.env.STRIPE_SECRET_KEY ?? '');
      event = stripe.webhooks.constructEvent(req.rawBody, signature, webhookSecret);
    } catch {
      throw new BadRequestException('Webhook signature verification failed');
    }
    return this.paymentsService.handleWebhook(event);
  }
}
