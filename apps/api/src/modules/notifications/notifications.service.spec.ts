import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { NotificationsService } from './notifications.service';

// ---------------------------------------------------------------------------
// Mock the resend package before any imports that consume it
// ---------------------------------------------------------------------------
const mockEmailsSend = jest.fn().mockResolvedValue({ id: 'email-1' });

jest.mock('resend', () => ({
  Resend: jest.fn().mockImplementation(() => ({
    emails: { send: mockEmailsSend },
  })),
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const ORDER_DATA = {
  orderNumber: 'ORD-001',
  total: 42.5,
  items: [
    { name: 'Burger', qty: 2, price: 10.0 },
    { name: 'Fries', qty: 1, price: 4.5 },
  ],
  restaurantName: 'Test Bistro',
};

function buildService(apiKey: string | undefined, fromEmail?: string): Promise<NotificationsService> {
  const configMap: Record<string, string | undefined> = {
    RESEND_API_KEY: apiKey,
    RESEND_FROM_EMAIL: fromEmail,
  };

  const mockConfig = {
    get: jest.fn((key: string) => configMap[key]),
  };

  return Test.createTestingModule({
    providers: [
      NotificationsService,
      { provide: ConfigService, useValue: mockConfig },
    ],
  })
    .compile()
    .then((m) => m.get<NotificationsService>(NotificationsService));
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe('NotificationsService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // -------------------------------------------------------------------------
  // sendOrderConfirmation
  // -------------------------------------------------------------------------
  describe('sendOrderConfirmation', () => {
    it('sends an order confirmation email via Resend when API key is set', async () => {
      const service = await buildService('re_test_key');

      await service.sendOrderConfirmation('user@example.com', ORDER_DATA);

      expect(mockEmailsSend).toHaveBeenCalledTimes(1);
      const call = mockEmailsSend.mock.calls[0][0];
      expect(call.to).toBe('user@example.com');
      expect(call.subject).toContain('ORD-001');
      expect(call.html).toContain('ORD-001');
      expect(call.html).toContain('Test Bistro');
      expect(call.html).toContain('42.50');
    });

    it('resolves without sending when RESEND_API_KEY is not set', async () => {
      const service = await buildService(undefined);

      await expect(service.sendOrderConfirmation('user@example.com', ORDER_DATA)).resolves.toBeUndefined();
      expect(mockEmailsSend).not.toHaveBeenCalled();
    });

    it('does not throw even if the Resend send call rejects', async () => {
      const service = await buildService('re_test_key');
      mockEmailsSend.mockRejectedValueOnce(new Error('network error'));

      await expect(service.sendOrderConfirmation('user@example.com', ORDER_DATA)).resolves.toBeUndefined();
    });

    it('uses the configured from address', async () => {
      const service = await buildService('re_test_key', 'orders@brand.com');

      await service.sendOrderConfirmation('user@example.com', ORDER_DATA);

      expect(mockEmailsSend.mock.calls[0][0].from).toBe('orders@brand.com');
    });

    it('falls back to the default from address when RESEND_FROM_EMAIL is not configured', async () => {
      const service = await buildService('re_test_key', undefined);

      await service.sendOrderConfirmation('user@example.com', ORDER_DATA);

      expect(mockEmailsSend.mock.calls[0][0].from).toBe('noreply@foodstack.app');
    });
  });

  // -------------------------------------------------------------------------
  // sendPasswordReset
  // -------------------------------------------------------------------------
  describe('sendPasswordReset', () => {
    it('sends a password reset email containing the reset URL', async () => {
      const service = await buildService('re_test_key');
      const resetUrl = 'https://app.foodstack.com/reset?token=abc123';

      await service.sendPasswordReset('user@example.com', resetUrl);

      expect(mockEmailsSend).toHaveBeenCalledTimes(1);
      const call = mockEmailsSend.mock.calls[0][0];
      expect(call.to).toBe('user@example.com');
      expect(call.subject).toContain('password');
      expect(call.html).toContain(resetUrl);
    });

    it('resolves without sending when RESEND_API_KEY is not set', async () => {
      const service = await buildService(undefined);

      await expect(service.sendPasswordReset('user@example.com', 'https://example.com/reset')).resolves.toBeUndefined();
      expect(mockEmailsSend).not.toHaveBeenCalled();
    });

    it('does not throw even if the Resend send call rejects', async () => {
      const service = await buildService('re_test_key');
      mockEmailsSend.mockRejectedValueOnce(new Error('timeout'));

      await expect(service.sendPasswordReset('user@example.com', 'https://example.com/reset')).resolves.toBeUndefined();
    });
  });

  // -------------------------------------------------------------------------
  // sendWelcome
  // -------------------------------------------------------------------------
  describe('sendWelcome', () => {
    it('sends a welcome email addressing the user by first name', async () => {
      const service = await buildService('re_test_key');

      await service.sendWelcome('new@example.com', 'Alice');

      expect(mockEmailsSend).toHaveBeenCalledTimes(1);
      const call = mockEmailsSend.mock.calls[0][0];
      expect(call.to).toBe('new@example.com');
      expect(call.subject).toContain('Alice');
      expect(call.html).toContain('Alice');
    });

    it('resolves without sending when RESEND_API_KEY is not set', async () => {
      const service = await buildService(undefined);

      await expect(service.sendWelcome('new@example.com', 'Alice')).resolves.toBeUndefined();
      expect(mockEmailsSend).not.toHaveBeenCalled();
    });

    it('does not throw even if the Resend send call rejects', async () => {
      const service = await buildService('re_test_key');
      mockEmailsSend.mockRejectedValueOnce(new Error('rate limited'));

      await expect(service.sendWelcome('new@example.com', 'Bob')).resolves.toBeUndefined();
    });
  });
});
