import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { PrismaService } from '../../database/prisma.service';
import { EventsGateway } from '../events/events.gateway';
import { CreatePaymentIntentDto } from './dto/create-payment-intent.dto';

@Injectable()
export class PaymentsService {
  private readonly stripe: Stripe;
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
    private readonly events: EventsGateway,
  ) {
    this.stripe = new Stripe(this.config.get<string>('STRIPE_SECRET_KEY') ?? '', {
      apiVersion: '2024-04-10' as any,
    });
  }

  async createPaymentIntent(dto: CreatePaymentIntentDto) {
    const intent = await this.stripe.paymentIntents.create({
      amount: dto.amount,
      currency: dto.currency ?? 'eur',
      customer: dto.customerId,
      metadata: { orderId: dto.orderId },
      automatic_payment_methods: { enabled: true },
    }, {
      idempotencyKey: `pi-${dto.orderId}`,
    });

    return {
      clientSecret: intent.client_secret,
      paymentIntentId: intent.id,
    };
  }

  async confirmPayment(paymentIntentId: string) {
    const intent = await this.stripe.paymentIntents.retrieve(paymentIntentId);
    if (intent.status !== 'succeeded') {
      throw new BadRequestException(`Payment not succeeded: ${intent.status}`);
    }
    return { paymentIntentId, status: intent.status };
  }

  async refund(paymentIntentId: string, amount?: number) {
    const refund = await this.stripe.refunds.create({
      payment_intent: paymentIntentId,
      ...(amount !== undefined && { amount }),
    });

    const orderId = await this.getOrderIdFromIntent(paymentIntentId);
    if (orderId) {
      await this.prisma.order.update({
        where: { id: orderId },
        data: { status: 'cancelled' } as any,
      });
    }

    return { refundId: refund.id, status: refund.status, amount: refund.amount };
  }

  async handleWebhook(event: Stripe.Event) {
    switch (event.type) {
      case 'payment_intent.succeeded': {
        const intent = event.data.object as Stripe.PaymentIntent;
        await this.onPaymentSucceeded(intent);
        break;
      }
      case 'payment_intent.payment_failed': {
        const intent = event.data.object as Stripe.PaymentIntent;
        await this.onPaymentFailed(intent);
        break;
      }
      case 'charge.refunded': {
        const charge = event.data.object as Stripe.Charge;
        this.logger.log(`Charge refunded: ${charge.id}`);
        break;
      }
      default:
        this.logger.verbose(`Unhandled Stripe event: ${event.type}`);
    }
    return { received: true };
  }

  private async onPaymentSucceeded(intent: Stripe.PaymentIntent) {
    const orderId = intent.metadata?.orderId;
    if (!orderId) return;

    try {
      const order = await this.prisma.order.update({
        where: { id: orderId },
        data: { status: 'confirmed' } as any,
      });
      this.events.emitOrderStatusUpdate({
        orderId,
        restaurantId: order.restaurantId,
        status: 'confirmed',
        updatedAt: new Date().toISOString(),
      });
      this.logger.log(`Order ${orderId} confirmed after payment ${intent.id}`);
    } catch (err) {
      this.logger.error(`Failed to confirm order ${orderId}: ${(err as Error).message}`);
    }
  }

  private async onPaymentFailed(intent: Stripe.PaymentIntent) {
    const orderId = intent.metadata?.orderId;
    if (!orderId) return;
    this.logger.warn(`Payment failed for order ${orderId}: ${intent.last_payment_error?.message}`);
  }

  private async getOrderIdFromIntent(paymentIntentId: string): Promise<string | null> {
    const intent = await this.stripe.paymentIntents.retrieve(paymentIntentId);
    return intent.metadata?.orderId ?? null;
  }
}
