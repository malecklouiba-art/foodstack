import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { PrismaService } from '../../database/prisma.service';
import { RealtimeGateway } from '../realtime/realtime.gateway';
import { NotificationsService } from '../notifications/notifications.service';
import { AuditService } from '../audit/audit.service';
import { CreatePaymentIntentDto } from './dto/create-payment-intent.dto';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);
  private stripe: Stripe;

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
    private realtime: RealtimeGateway,
    private notifications: NotificationsService,
    private audit: AuditService,
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

    // Audit log — fire-and-forget
    this.audit.log({
      action: 'payment.refunded',
      entityId: paymentIntentId,
    }).catch(() => { /* audit failures must never surface */ });

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
        if (!orderId) break;

        const order = await this.prisma.order.findUnique({
          where: { id: orderId },
          include: { items: true, customer: true },
        });
        if (!order) break;

        // Idempotency: skip if already in target state
        if (order.paymentStatus === 'paid' && order.status === 'confirmed') {
          this.logger.log(`Webhook payment_intent.succeeded: order ${orderId} already paid/confirmed, skipping`);
          break;
        }

        await this.prisma.order.update({
          where: { id: orderId },
          data: { paymentStatus: 'paid', status: 'confirmed' },
        });

        // Audit log — fire-and-forget
        this.audit.log({
          action: 'payment.processed',
          entityType: 'Order',
          entityId: orderId,
          metadata: { amount: intent.amount },
        }).catch(() => { /* audit failures must never surface */ });

        // Emit socket event to customers tracking this order
        this.realtime.server
          .to(`order:${orderId}`)
          .emit('order:payment_confirmed', {
            orderId,
            orderNumber: order.orderNumber,
            restaurantId: order.restaurantId,
            status: 'confirmed',
            customerId: order.customerId,
          });

        // Also emit a general status update
        this.realtime.emitOrderStatusUpdated({
          orderId,
          orderNumber: order.orderNumber,
          restaurantId: order.restaurantId,
          status: 'confirmed',
          customerId: order.customerId,
          total: order.total,
          itemCount: order.items.length,
        });

        this.logger.log(`Order ${orderId} payment confirmed via webhook`);
        break;
      }

      case 'payment_intent.payment_failed': {
        const intent = event.data.object as Stripe.PaymentIntent;
        const orderId = intent.metadata?.orderId;
        if (!orderId) break;

        const order = await this.prisma.order.findUnique({
          where: { id: orderId },
          include: { customer: true },
        });
        if (!order) break;

        // Idempotency: skip if already marked as failed
        if (order.paymentStatus === 'failed') {
          this.logger.log(`Webhook payment_intent.payment_failed: order ${orderId} already failed, skipping`);
          break;
        }

        await this.prisma.order.update({
          where: { id: orderId },
          data: { paymentStatus: 'failed' },
        });

        // Notify customer via email
        const customerEmail = order.customer.email;
        try {
          await this.notifications.sendOrderStatusUpdate(customerEmail, {
            orderNumber: order.orderNumber,
            status: 'payment_failed',
            statusLabel: 'Paiement refusé',
          });
        } catch (emailErr) {
          this.logger.error(`Failed to send payment failure email for order ${orderId}`, emailErr);
        }

        this.logger.log(`Order ${orderId} payment failed via webhook`);
        break;
      }

      case 'charge.refunded': {
        const charge = event.data.object as Stripe.Charge;
        const orderId = charge.metadata?.orderId;
        if (!orderId) break;

        const order = await this.prisma.order.findUnique({
          where: { id: orderId },
        });
        if (!order) break;

        // Idempotency: skip if already refunded
        if (order.paymentStatus === 'refunded') {
          this.logger.log(`Webhook charge.refunded: order ${orderId} already refunded, skipping`);
          break;
        }

        await this.prisma.order.update({
          where: { id: orderId },
          data: { paymentStatus: 'refunded', status: 'refunded' },
        });

        // Audit log — fire-and-forget
        this.audit.log({
          action: 'payment.refunded',
          entityId: charge.payment_intent as string | undefined,
        }).catch(() => { /* audit failures must never surface */ });

        this.logger.log(`Order ${orderId} refunded via webhook`);
        break;
      }
    }

    return { received: true };
  }
}
