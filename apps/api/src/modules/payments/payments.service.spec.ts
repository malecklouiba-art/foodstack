import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { PaymentsService } from './payments.service';
import { PrismaService } from '../../database/prisma.service';
import { EventsGateway } from '../events/events.gateway';
import { CreatePaymentIntentDto } from './dto/create-payment-intent.dto';

// ─── Stripe mock ────────────────────────────────────────────────────────────

const mockStripePaymentIntents = {
  create: jest.fn(),
  retrieve: jest.fn(),
};

const mockStripeRefunds = {
  create: jest.fn(),
};

jest.mock('stripe', () => {
  const MockStripe = jest.fn().mockImplementation(() => ({
    paymentIntents: mockStripePaymentIntents,
    refunds: mockStripeRefunds,
  }));
  return { __esModule: true, default: MockStripe };
});

// ─── Other service mocks ─────────────────────────────────────────────────────

const mockPrisma = {
  order: {
    update: jest.fn(),
  },
};

const mockEventsGateway = {
  emitOrderStatusUpdate: jest.fn(),
};

const mockConfigService = {
  get: jest.fn().mockReturnValue('sk_test_dummy'),
};

// ─── Suite ───────────────────────────────────────────────────────────────────

describe('PaymentsService', () => {
  let service: PaymentsService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentsService,
        { provide: ConfigService, useValue: mockConfigService },
        { provide: PrismaService, useValue: mockPrisma },
        { provide: EventsGateway, useValue: mockEventsGateway },
      ],
    }).compile();

    service = module.get<PaymentsService>(PaymentsService);
  });

  // ─── createPaymentIntent ──────────────────────────────────────────────────

  describe('createPaymentIntent', () => {
    const dto: CreatePaymentIntentDto = {
      amount: 2500,
      currency: 'eur',
      customerId: 'cus_123',
      orderId: 'order-1',
    } as CreatePaymentIntentDto;

    it('happy path – returns clientSecret and paymentIntentId', async () => {
      // Arrange
      const fakeIntent = { id: 'pi_abc', client_secret: 'pi_abc_secret_xyz' };
      mockStripePaymentIntents.create.mockResolvedValue(fakeIntent);

      // Act
      const result = await service.createPaymentIntent(dto);

      // Assert
      expect(mockStripePaymentIntents.create).toHaveBeenCalledWith(
        expect.objectContaining({
          amount: 2500,
          currency: 'eur',
          customer: 'cus_123',
          metadata: { orderId: 'order-1' },
          automatic_payment_methods: { enabled: true },
        }),
        { idempotencyKey: 'pi-order-1' },
      );
      expect(result).toEqual({
        clientSecret: 'pi_abc_secret_xyz',
        paymentIntentId: 'pi_abc',
      });
    });

    it('defaults currency to eur when not provided', async () => {
      // Arrange
      const dtoNoCurrency = { ...dto, currency: undefined } as CreatePaymentIntentDto;
      const fakeIntent = { id: 'pi_abc', client_secret: 'secret' };
      mockStripePaymentIntents.create.mockResolvedValue(fakeIntent);

      // Act
      await service.createPaymentIntent(dtoNoCurrency);

      // Assert
      expect(mockStripePaymentIntents.create).toHaveBeenCalledWith(
        expect.objectContaining({ currency: 'eur' }),
        expect.anything(),
      );
    });

    it('propagates stripe error', async () => {
      // Arrange
      mockStripePaymentIntents.create.mockRejectedValue(new Error('Stripe error'));

      // Act & Assert
      await expect(service.createPaymentIntent(dto)).rejects.toThrow('Stripe error');
    });
  });

  // ─── confirmPayment ───────────────────────────────────────────────────────

  describe('confirmPayment', () => {
    it('returns status when payment succeeded', async () => {
      // Arrange
      mockStripePaymentIntents.retrieve.mockResolvedValue({
        id: 'pi_abc',
        status: 'succeeded',
      });

      // Act
      const result = await service.confirmPayment('pi_abc');

      // Assert
      expect(result).toEqual({ paymentIntentId: 'pi_abc', status: 'succeeded' });
    });

    it('throws BadRequestException when payment has not succeeded', async () => {
      // Arrange
      mockStripePaymentIntents.retrieve.mockResolvedValue({
        id: 'pi_abc',
        status: 'requires_payment_method',
      });

      // Act & Assert
      await expect(service.confirmPayment('pi_abc')).rejects.toThrow(BadRequestException);
      await expect(service.confirmPayment('pi_abc')).rejects.toThrow(
        'Payment not succeeded: requires_payment_method',
      );
    });
  });

  // ─── refund ───────────────────────────────────────────────────────────────

  describe('refund', () => {
    it('creates a refund and cancels the linked order', async () => {
      // Arrange
      const fakeRefund = { id: 'ref_123', status: 'succeeded', amount: 2500 };
      mockStripeRefunds.create.mockResolvedValue(fakeRefund);
      // retrieve is called inside getOrderIdFromIntent
      mockStripePaymentIntents.retrieve.mockResolvedValue({
        id: 'pi_abc',
        metadata: { orderId: 'order-1' },
      });
      mockPrisma.order.update.mockResolvedValue({ id: 'order-1', status: 'cancelled' });

      // Act
      const result = await service.refund('pi_abc', 2500);

      // Assert
      expect(mockStripeRefunds.create).toHaveBeenCalledWith({
        payment_intent: 'pi_abc',
        amount: 2500,
      });
      expect(mockPrisma.order.update).toHaveBeenCalledWith({
        where: { id: 'order-1' },
        data: { status: 'cancelled' },
      });
      expect(result).toEqual({ refundId: 'ref_123', status: 'succeeded', amount: 2500 });
    });

    it('creates a full refund without amount param', async () => {
      // Arrange
      const fakeRefund = { id: 'ref_456', status: 'succeeded', amount: 5000 };
      mockStripeRefunds.create.mockResolvedValue(fakeRefund);
      mockStripePaymentIntents.retrieve.mockResolvedValue({
        id: 'pi_abc',
        metadata: { orderId: 'order-2' },
      });
      mockPrisma.order.update.mockResolvedValue({});

      // Act
      await service.refund('pi_abc');

      // Assert
      expect(mockStripeRefunds.create).toHaveBeenCalledWith({ payment_intent: 'pi_abc' });
    });

    it('skips order update when no orderId in intent metadata', async () => {
      // Arrange
      mockStripeRefunds.create.mockResolvedValue({ id: 'ref_789', status: 'succeeded', amount: 0 });
      mockStripePaymentIntents.retrieve.mockResolvedValue({
        id: 'pi_abc',
        metadata: {},
      });

      // Act
      await service.refund('pi_abc');

      // Assert
      expect(mockPrisma.order.update).not.toHaveBeenCalled();
    });
  });

  // ─── handleWebhook ────────────────────────────────────────────────────────

  describe('handleWebhook', () => {
    it('payment_intent.succeeded – updates order to confirmed and emits event', async () => {
      // Arrange
      const updatedOrder = { id: 'order-1', restaurantId: 'rest-1', status: 'confirmed' };
      mockPrisma.order.update.mockResolvedValue(updatedOrder);

      const event = {
        type: 'payment_intent.succeeded',
        data: {
          object: {
            id: 'pi_abc',
            metadata: { orderId: 'order-1' },
          } as unknown as Stripe.PaymentIntent,
        },
      } as unknown as Stripe.Event;

      // Act
      const result = await service.handleWebhook(event);

      // Assert
      expect(mockPrisma.order.update).toHaveBeenCalledWith({
        where: { id: 'order-1' },
        data: { status: 'confirmed' },
      });
      expect(mockEventsGateway.emitOrderStatusUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          orderId: 'order-1',
          restaurantId: 'rest-1',
          status: 'confirmed',
        }),
      );
      expect(result).toEqual({ received: true });
    });

    it('payment_intent.succeeded – skips update when no orderId in metadata', async () => {
      // Arrange
      const event = {
        type: 'payment_intent.succeeded',
        data: {
          object: {
            id: 'pi_abc',
            metadata: {},
          } as unknown as Stripe.PaymentIntent,
        },
      } as unknown as Stripe.Event;

      // Act
      const result = await service.handleWebhook(event);

      // Assert
      expect(mockPrisma.order.update).not.toHaveBeenCalled();
      expect(result).toEqual({ received: true });
    });

    it('payment_intent.payment_failed – returns received:true without throwing', async () => {
      // Arrange
      const event = {
        type: 'payment_intent.payment_failed',
        data: {
          object: {
            id: 'pi_fail',
            metadata: { orderId: 'order-1' },
            last_payment_error: { message: 'Card declined' },
          } as unknown as Stripe.PaymentIntent,
        },
      } as unknown as Stripe.Event;

      // Act
      const result = await service.handleWebhook(event);

      // Assert
      expect(result).toEqual({ received: true });
      expect(mockPrisma.order.update).not.toHaveBeenCalled();
    });

    it('unhandled event type – returns received:true', async () => {
      // Arrange
      const event = {
        type: 'charge.refunded',
        data: {
          object: { id: 'ch_abc' } as unknown as Stripe.Charge,
        },
      } as unknown as Stripe.Event;

      // Act
      const result = await service.handleWebhook(event);

      // Assert
      expect(result).toEqual({ received: true });
    });
  });
});
