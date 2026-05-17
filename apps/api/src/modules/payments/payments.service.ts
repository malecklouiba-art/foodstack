import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { PrismaService } from '../../database/prisma.service';
import { CreatePaymentIntentDto } from './dto/create-payment-intent.dto';

@Injectable()
export class PaymentsService {
  private stripe: Stripe;

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    this.stripe = new Stripe(
      this.configService.get<string>('STRIPE_SECRET_KEY') ?? 'sk_test_placeholder',
      {
        apiVersion: '2023-10-16',
      },
    );
  }

  async createPaymentIntent(dto: CreatePaymentIntentDto) {
    // Créer le PaymentIntent Stripe
    const intent = await this.stripe.paymentIntents.create(
      {
        amount: Math.round(dto.amount * 100), // centimes
        currency: dto.currency ?? 'eur',
        metadata: { orderId: dto.orderId ?? '', customerId: dto.customerId ?? '' },
      },
      dto.orderId ? { idempotencyKey: `order_${dto.orderId}` } : undefined,
    );

    // Si orderId fourni, mettre à jour l'order en DB
    if (dto.orderId) {
      await this.prisma.order.update({
        where: { id: dto.orderId },
        data: { stripePaymentIntentId: intent.id },
      });
    }

    return { clientSecret: intent.client_secret, paymentIntentId: intent.id };
  }

  async confirmPayment(paymentIntentId: string) {
    const intent = await this.stripe.paymentIntents.retrieve(paymentIntentId);
    return { status: intent.status };
  }

  async refund(paymentIntentId: string, amount?: number) {
    const refund = await this.stripe.refunds.create({
      payment_intent: paymentIntentId,
      ...(amount ? { amount: Math.round(amount * 100) } : {}),
    });
    return { refundId: refund.id, status: refund.status };
  }

  async handleWebhook(rawBody: Buffer, signature: string) {
    let event: Stripe.Event;

    try {
      event = this.stripe.webhooks.constructEvent(
        rawBody,
        signature,
        this.configService.get<string>('STRIPE_WEBHOOK_SECRET') ?? '',
      );
    } catch (err) {
      throw new BadRequestException(`Webhook Error: ${(err as Error).message}`);
    }

    switch (event.type) {
      case 'payment_intent.succeeded': {
        const intent = event.data.object as Stripe.PaymentIntent;
        const orderId = intent.metadata?.orderId;
        if (orderId) {
          await this.prisma.order.update({
            where: { id: orderId },
            data: { paymentStatus: 'paid', status: 'confirmed' },
          });
        }
        break;
      }
      case 'payment_intent.payment_failed': {
        const intent = event.data.object as Stripe.PaymentIntent;
        const orderId = intent.metadata?.orderId;
        if (orderId) {
          await this.prisma.order.update({
            where: { id: orderId },
            data: { paymentStatus: 'failed' },
          });
        }
        break;
      }
      case 'charge.refunded': {
        const charge = event.data.object as Stripe.Charge;
        const orderId = charge.metadata?.orderId;
        if (orderId) {
          await this.prisma.order.update({
            where: { id: orderId },
            data: { paymentStatus: 'refunded', status: 'refunded' },
          });
        }
        break;
      }
    }

    return { received: true };
  }
}
