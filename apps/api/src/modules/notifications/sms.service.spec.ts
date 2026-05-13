import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { SmsService } from './sms.service';

const mockCreate = jest.fn().mockResolvedValue({ sid: 'SM123' });

jest.mock('twilio', () => ({
  __esModule: true,
  default: jest.fn(() => ({
    messages: { create: mockCreate },
  })),
}));

describe('SmsService', () => {
  let service: SmsService;
  let configService: jest.Mocked<ConfigService>;

  beforeEach(async () => {
    jest.clearAllMocks();

    configService = {
      get: jest.fn((key: string) => {
        const cfg: Record<string, string> = {
          TWILIO_ACCOUNT_SID: 'ACtest',
          TWILIO_AUTH_TOKEN: 'authtoken',
          TWILIO_PHONE_NUMBER: '+15005550006',
        };
        return cfg[key];
      }),
    } as unknown as jest.Mocked<ConfigService>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [SmsService, { provide: ConfigService, useValue: configService }],
    }).compile();

    service = module.get<SmsService>(SmsService);
  });

  describe('sendOrderConfirmation', () => {
    it('sends confirmation SMS with order details', async () => {
      await service.sendOrderConfirmation('+33600000001', 'ORD-001', 'Burger Palace', 24.5);

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          to: '+33600000001',
          body: expect.stringContaining('ORD-001'),
        }),
      );
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({ body: expect.stringContaining('Burger Palace') }),
      );
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({ body: expect.stringContaining('24.50') }),
      );
    });
  });

  describe('sendOrderStatusUpdate', () => {
    it.each([
      ['PREPARING', 'being prepared'],
      ['READY', 'ready'],
      ['OUT_FOR_DELIVERY', 'out for delivery'],
      ['DELIVERED', 'delivered'],
      ['CANCELLED', 'cancelled'],
    ])('sends correct message for status %s', async (status, keyword) => {
      await service.sendOrderStatusUpdate('+33600000001', 'ORD-002', status);

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          to: '+33600000001',
          body: expect.stringContaining(keyword),
        }),
      );
    });

    it('handles unknown status with fallback message', async () => {
      await service.sendOrderStatusUpdate('+33600000001', 'ORD-003', 'UNKNOWN_STATUS');

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          body: expect.stringContaining('UNKNOWN_STATUS'),
        }),
      );
    });
  });

  describe('sendDeliveryAssigned', () => {
    it('sends driver assigned SMS', async () => {
      await service.sendDeliveryAssigned('+33600000001', 'ORD-004', 'Jean Dupont');

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          body: expect.stringContaining('Jean Dupont'),
        }),
      );
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          body: expect.stringContaining('ORD-004'),
        }),
      );
    });
  });

  describe('when Twilio not configured', () => {
    it('skips sending when credentials missing', async () => {
      configService.get = jest.fn().mockReturnValue(undefined);

      const module = await Test.createTestingModule({
        providers: [SmsService, { provide: ConfigService, useValue: configService }],
      }).compile();

      const unconfiguredService = module.get<SmsService>(SmsService);
      await unconfiguredService.sendOrderConfirmation('+33600000001', 'ORD-005', 'Test', 10);

      expect(mockCreate).not.toHaveBeenCalled();
    });
  });
});
