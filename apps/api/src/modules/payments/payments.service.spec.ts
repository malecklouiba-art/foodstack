import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PaymentsService } from './payments.service';
import { PrismaService } from '../../database/prisma.service';

// ---------------------------------------------------------------------------
// Stripe mock — must be declared before any import that resolves Stripe
// ---------------------------------------------------------------------------
const mockPaymentIntentsCreate = jest.fn();
const mockPaymentIntentsRetrieve = jest.fn();
const mockRefundsCreate = jest.fn();
const mockWebhooksConstructEvent = jest.fn();

jest.mock('stripe', () => {
  return jest.fn().mockImplementation(() => ({
    paymentIntents: {
      create: mockPaymentIntentsCreate,
      retrieve: mockPaymentIntentsRetrieve,
    },
    refunds: {
      create: mockRefundsCreate,
    },
    webhooks: {
      constructEvent: mockWebhooksConstructEvent,
    },
  }));
});

// ---------------------------------------------------------------------------
// Prisma mock
// ---------------------------------------------------------------------------
const mockPrisma = {
  order: {
    update: jest.fn(),
  },
};

// ---------------------------------------------------------------------------
// ConfigService mock
// ---------------------------------------------------------------------------
const mockConfigService = {
  get: jest.fn().mockReturnValue('sk_test_placeholder'),
};

describe('PaymentsService', () => {
  let service: PaymentsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<PaymentsService>(PaymentsService);
    jest.clearAllMocks();
  });

  // ---------------------------------------------------------------------------
  // createPaymentIntent()
  // ---------------------------------------------------------------------------
  describe('createPaymentIntent', () => {
    it('should return clientSecret and paymentIntentId from Stripe', async () => {
      mockPaymentIntentsCreate.mockResolvedValue({
        id: 'pi_test123',
        client_secret: 'pi_test123_secret_xyz',
        status: 'requires_payment_method',
      });

      const result = await service.createPaymentIntent({
        amount: 29.99,
        currency: 'eur',
        orderId: 'order_abc',
      });

      expect(result.clientSecret).toBe('pi_test123_secret_xyz');
      expect(result.paymentIntentId).toBe('pi_test123');
    });

    it('should send amount converted to cents to Stripe', async () => {
      mockPaymentIntentsCreate.mockResolvedValue({
        id: 'pi_test456',
        client_secret: 'pi_test456_secret',
      });
      mockPrisma.order.update.mockResolvedValue({});

      await service.createPaymentIntent({
        amount: 15.5,
        currency: 'eur',
        orderId: 'order_abc',
      });

      expect(mockPaymentIntentsCreate).toHaveBeenCalledWith(
        expect.objectContaining({ amount: 1550 }),
        expect.anything(),
      );
    });

    it('should default currency to eur when not provided', async () => {
      mockPaymentIntentsCreate.mockResolvedValue({
        id: 'pi_test789',
        client_secret: 'pi_test789_secret',
      });
      mockPrisma.order.update.mockResolvedValue({});

      await service.createPaymentIntent({
        amount: 20,
        currency: undefined as any,
        orderId: 'order_abc',
      });

      expect(mockPaymentIntentsCreate).toHaveBeenCalledWith(
        expect.objectContaining({ currency: 'eur' }),
        expect.anything(),
      );
    });

    it('should update order in DB with paymentIntentId when orderId is provided', async () => {
      mockPaymentIntentsCreate.mockResolvedValue({
        id: 'pi_order_update',
        client_secret: 'secret',
      });
      mockPrisma.order.update.mockResolvedValue({ id: 'order_abc', stripePaymentIntentId: 'pi_order_update' });

      await service.createPaymentIntent({
        amount: 50,
        currency: 'eur',
        orderId: 'order_abc',
      });

      expect(mockPrisma.order.update).toHaveBeenCalledWith({
        where: { id: 'order_abc' },
        data: { stripePaymentIntentId: 'pi_order_update' },
      });
    });

    it('should NOT update DB when orderId is not provided', async () => {
      mockPaymentIntentsCreate.mockResolvedValue({
        id: 'pi_no_order',
        client_secret: 'secret',
      });

      await service.createPaymentIntent({
        amount: 50,
        currency: 'eur',
        orderId: undefined as any,
      });

      expect(mockPrisma.order.update).not.toHaveBeenCalled();
    });

    it('should pass orderId as metadata to Stripe', async () => {
      mockPaymentIntentsCreate.mockResolvedValue({ id: 'pi_meta', client_secret: 'secret' });
      mockPrisma.order.update.mockResolvedValue({});

      await service.createPaymentIntent({
        amount: 30,
        currency: 'eur',
        orderId: 'order_meta',
        customerId: 'cus_123',
      });

      expect(mockPaymentIntentsCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: { orderId: 'order_meta', customerId: 'cus_123' },
        }),
        expect.anything(),
      );
    });

    it('should use idempotency key derived from orderId', async () => {
      mockPaymentIntentsCreate.mockResolvedValue({ id: 'pi_idem', client_secret: 'secret' });
      mockPrisma.order.update.mockResolvedValue({});

      await service.createPaymentIntent({
        amount: 30,
        currency: 'eur',
        orderId: 'order_idem',
      });

      expect(mockPaymentIntentsCreate).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ idempotencyKey: 'order_order_idem' }),
      );
    });
  });

  // ---------------------------------------------------------------------------
  // confirmPayment()
  // ---------------------------------------------------------------------------
  describe('confirmPayment', () => {
    it('should return the status of the retrieved payment intent', async () => {
      mockPaymentIntentsRetrieve.mockResolvedValue({ status: 'succeeded' });

      const result = await service.confirmPayment('pi_test123');

      expect(result.status).toBe('succeeded');
    });

    it('should pass the paymentIntentId to stripe.paymentIntents.retrieve', async () => {
      mockPaymentIntentsRetrieve.mockResolvedValue({ status: 'requires_payment_method' });

      await service.confirmPayment('pi_abc');

      expect(mockPaymentIntentsRetrieve).toHaveBeenCalledWith('pi_abc');
    });

    it('should return requires_payment_method status when not yet confirmed', async () => {
      mockPaymentIntentsRetrieve.mockResolvedValue({ status: 'requires_payment_method' });

      const result = await service.confirmPayment('pi_pending');

      expect(result.status).toBe('requires_payment_method');
    });
  });

  // ---------------------------------------------------------------------------
  // refund()
  // ---------------------------------------------------------------------------
  describe('refund', () => {
    it('should return refundId and status on success', async () => {
      mockRefundsCreate.mockResolvedValue({ id: 're_test123', status: 'succeeded' });

      const result = await service.refund('pi_test123');

      expect(result.refundId).toBe('re_test123');
      expect(result.status).toBe('succeeded');
    });

    it('should pass payment_intent to stripe.refunds.create', async () => {
      mockRefundsCreate.mockResolvedValue({ id: 're_1', status: 'succeeded' });

      await service.refund('pi_refund_me');

      expect(mockRefundsCreate).toHaveBeenCalledWith(
        expect.objectContaining({ payment_intent: 'pi_refund_me' }),
      );
    });

    it('should convert partial refund amount to cents', async () => {
      mockRefundsCreate.mockResolvedValue({ id: 're_partial', status: 'succeeded' });

      await service.refund('pi_partial', 12.5);

      expect(mockRefundsCreate).toHaveBeenCalledWith(
        expect.objectContaining({ amount: 1250 }),
      );
    });

    it('should NOT include amount in request when no partial amount is given', async () => {
      mockRefundsCreate.mockResolvedValue({ id: 're_full', status: 'succeeded' });

      await service.refund('pi_full');

      const callArgs = mockRefundsCreate.mock.calls[0][0];
      expect(callArgs).not.toHaveProperty('amount');
    });
  });

  // ---------------------------------------------------------------------------
  // handleWebhook()
  // ---------------------------------------------------------------------------
  describe('handleWebhook', () => {
    const rawBody = Buffer.from('{}');
    const signature = 'sig_test';

    it('should return { received: true } for any valid event', async () => {
      mockWebhooksConstructEvent.mockReturnValue({
        type: 'some.other.event',
        data: { object: {} },
      });

      const result = await service.handleWebhook(rawBody, signature);

      expect(result).toEqual({ received: true });
    });

    it('should throw BadRequestException when signature is invalid', async () => {
      mockWebhooksConstructEvent.mockImplementation(() => {
        throw new Error('No signatures found matching the expected signature for payload');
      });

      await expect(service.handleWebhook(rawBody, 'bad_sig')).rejects.toThrow(BadRequestException);
    });

    it('should update order paymentStatus to paid on payment_intent.succeeded', async () => {
      mockWebhooksConstructEvent.mockReturnValue({
        type: 'payment_intent.succeeded',
        data: {
          object: {
            id: 'pi_success',
            metadata: { orderId: 'order_pay' },
          },
        },
      });
      mockPrisma.order.update.mockResolvedValue({});

      await service.handleWebhook(rawBody, signature);

      expect(mockPrisma.order.update).toHaveBeenCalledWith({
        where: { id: 'order_pay' },
        data: { paymentStatus: 'paid', status: 'confirmed' },
      });
    });

    it('should update order paymentStatus to failed on payment_intent.payment_failed', async () => {
      mockWebhooksConstructEvent.mockReturnValue({
        type: 'payment_intent.payment_failed',
        data: {
          object: { metadata: { orderId: 'order_fail' } },
        },
      });
      mockPrisma.order.update.mockResolvedValue({});

      await service.handleWebhook(rawBody, signature);

      expect(mockPrisma.order.update).toHaveBeenCalledWith({
        where: { id: 'order_fail' },
        data: { paymentStatus: 'failed' },
      });
    });

    it('should update order to refunded on charge.refunded', async () => {
      mockWebhooksConstructEvent.mockReturnValue({
        type: 'charge.refunded',
        data: {
          object: { metadata: { orderId: 'order_refund' } },
        },
      });
      mockPrisma.order.update.mockResolvedValue({});

      await service.handleWebhook(rawBody, signature);

      expect(mockPrisma.order.update).toHaveBeenCalledWith({
        where: { id: 'order_refund' },
        data: { paymentStatus: 'refunded', status: 'refunded' },
      });
    });

    it('should NOT update DB when orderId is missing from metadata', async () => {
      mockWebhooksConstructEvent.mockReturnValue({
        type: 'payment_intent.succeeded',
        data: {
          object: { metadata: {} },
        },
      });

      await service.handleWebhook(rawBody, signature);

      expect(mockPrisma.order.update).not.toHaveBeenCalled();
    });
  });
});
