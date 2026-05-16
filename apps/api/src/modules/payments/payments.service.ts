import { Injectable, BadRequestException } from '@nestjs/common';
import Stripe from 'stripe';
import { CreatePaymentIntentDto } from './dto/create-payment-intent.dto';
import { OrdersService } from '../orders/orders.service';
import { OrderStatus } from '../orders/dto/update-order-status.dto';

@Injectable()
export class PaymentsService {
  private readonly stripe: Stripe;

  constructor(private readonly orders: OrdersService) {
    // TODO: Inject ConfigService and use process.env.STRIPE_SECRET_KEY via ConfigModule
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? '', {
      apiVersion: '2024-04-10' as any,
    });
  }

  async createPaymentIntent(dto: CreatePaymentIntentDto) {
    // TODO: Store payment intent record in the database linked to the order
    // TODO: Idempotency key based on orderId to prevent duplicate charges
    const intent = await this.stripe.paymentIntents.create({
      amount: dto.amount,
      currency: dto.currency,
      customer: dto.customerId,
      metadata: { orderId: dto.orderId },
    });
    return {
      clientSecret: intent.client_secret,
      paymentIntentId: intent.id,
    };
  }

  async confirmPayment(paymentIntentId: string) {
    // TODO: Update corresponding order payment status in the database
    const intent = await this.stripe.paymentIntents.retrieve(paymentIntentId);
    if (intent.status !== 'succeeded') {
      throw new BadRequestException(`Payment intent status is ${intent.status}, not succeeded`);
    }
    return { paymentIntentId, status: intent.status };
  }

  async refund(paymentIntentId: string, amount?: number) {
    // TODO: Update order payment status to REFUNDED in the database
    // TODO: Validate that amount does not exceed the original charge
    const refund = await this.stripe.refunds.create({
      payment_intent: paymentIntentId,
      ...(amount !== undefined && { amount }),
    });
    return { refundId: refund.id, status: refund.status, amount: refund.amount };
  }

  async handleWebhook(event: Stripe.Event) {
    // TODO: Verify webhook signature using stripe.webhooks.constructEvent before calling this
    switch (event.type) {
      case 'payment_intent.succeeded': {
        const intent = event.data.object as Stripe.PaymentIntent;
        const orderId = intent.metadata?.orderId;
        if (orderId) {
          await this.orders.updateStatus(orderId, { status: OrderStatus.CONFIRMED });
        }
        break;
      }
      case 'payment_intent.payment_failed': {
        const intent = event.data.object as Stripe.PaymentIntent;
        const orderId = intent.metadata?.orderId;
        if (orderId) {
          await this.orders.updateStatus(orderId, { status: OrderStatus.CANCELLED });
        }
        break;
      }
      case 'charge.refunded':
        // Logged — order status managed separately via refund endpoint
        break;
      default:
        // Unhandled event type — log and ignore
        break;
    }
    return { received: true };
  }
}
