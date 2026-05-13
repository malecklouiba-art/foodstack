import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { PushService, PushSubscriptionDto, PushPayload } from './push.service';

// ---------------------------------------------------------------------------
// Mock web-push before any import that loads it.
// jest.mock() factories are hoisted and run before variable declarations, so
// we cannot reference outer `const` mocks inside the factory. Instead we
// create the fns inside the factory and expose them via a separate import.
// ---------------------------------------------------------------------------
jest.mock('web-push', () => ({
  setVapidDetails: jest.fn(),
  sendNotification: jest.fn().mockResolvedValue({ statusCode: 201 }),
}));

// eslint-disable-next-line @typescript-eslint/no-require-imports
const webpush = require('web-push') as {
  setVapidDetails: jest.Mock;
  sendNotification: jest.Mock;
};
const mockSetVapidDetails = webpush.setVapidDetails;
const mockSendNotification = webpush.sendNotification;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const SUBSCRIPTION: PushSubscriptionDto = {
  endpoint: 'https://fcm.googleapis.com/fcm/send/abc123',
  keys: { p256dh: 'p256dh-key', auth: 'auth-key' },
};

const SUBSCRIPTION_2: PushSubscriptionDto = {
  endpoint: 'https://fcm.googleapis.com/fcm/send/def456',
  keys: { p256dh: 'p256dh-key-2', auth: 'auth-key-2' },
};

const PAYLOAD: PushPayload = {
  title: 'Order Ready',
  body: 'Your order #42 is ready for pickup',
  url: '/orders/42',
};

function buildService(
  publicKey: string | undefined,
  privateKey: string | undefined,
): Promise<PushService> {
  const configMap: Record<string, string | undefined> = {
    VAPID_PUBLIC_KEY: publicKey,
    VAPID_PRIVATE_KEY: privateKey,
  };

  const mockConfig = {
    get: jest.fn((key: string) => configMap[key]),
  };

  return Test.createTestingModule({
    providers: [
      PushService,
      { provide: ConfigService, useValue: mockConfig },
    ],
  })
    .compile()
    .then((m: TestingModule) => m.get<PushService>(PushService));
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe('PushService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // -------------------------------------------------------------------------
  // Constructor / VAPID setup
  // -------------------------------------------------------------------------
  describe('constructor', () => {
    it('calls setVapidDetails when both VAPID keys are present', async () => {
      await buildService('pub-key', 'priv-key');

      expect(mockSetVapidDetails).toHaveBeenCalledTimes(1);
      expect(mockSetVapidDetails).toHaveBeenCalledWith(
        'mailto:admin@foodstack.app',
        'pub-key',
        'priv-key',
      );
    });

    it('does not call setVapidDetails when VAPID keys are missing', async () => {
      await buildService(undefined, undefined);

      expect(mockSetVapidDetails).not.toHaveBeenCalled();
    });

    it('does not call setVapidDetails when only the public key is missing', async () => {
      await buildService(undefined, 'priv-key');

      expect(mockSetVapidDetails).not.toHaveBeenCalled();
    });

    it('does not call setVapidDetails when only the private key is missing', async () => {
      await buildService('pub-key', undefined);

      expect(mockSetVapidDetails).not.toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------------------------
  // subscribe
  // -------------------------------------------------------------------------
  describe('subscribe', () => {
    it('stores the subscription so it can be used for sending', async () => {
      const service = await buildService('pub', 'priv');

      service.subscribe(SUBSCRIPTION);

      // Confirm the subscription is retrievable by sending to its endpoint
      await service.sendPushNotification(SUBSCRIPTION.endpoint, PAYLOAD);
      expect(mockSendNotification).toHaveBeenCalledTimes(1);
    });

    it('overwrites an existing subscription for the same endpoint', async () => {
      const service = await buildService('pub', 'priv');
      const updated: PushSubscriptionDto = {
        ...SUBSCRIPTION,
        keys: { p256dh: 'new-p256dh', auth: 'new-auth' },
      };

      service.subscribe(SUBSCRIPTION);
      service.subscribe(updated);

      await service.sendPushNotification(SUBSCRIPTION.endpoint, PAYLOAD);

      const calledWith = mockSendNotification.mock.calls[0][0];
      expect(calledWith.keys.p256dh).toBe('new-p256dh');
    });
  });

  // -------------------------------------------------------------------------
  // sendPushNotification
  // -------------------------------------------------------------------------
  describe('sendPushNotification', () => {
    it('sends a notification to a registered subscription endpoint', async () => {
      const service = await buildService('pub', 'priv');
      service.subscribe(SUBSCRIPTION);

      await service.sendPushNotification(SUBSCRIPTION.endpoint, PAYLOAD);

      expect(mockSendNotification).toHaveBeenCalledTimes(1);
      const [sub, payloadStr] = mockSendNotification.mock.calls[0];
      expect(sub.endpoint).toBe(SUBSCRIPTION.endpoint);
      expect(JSON.parse(payloadStr as string)).toEqual(PAYLOAD);
    });

    it('serialises the payload as JSON', async () => {
      const service = await buildService('pub', 'priv');
      service.subscribe(SUBSCRIPTION);

      await service.sendPushNotification(SUBSCRIPTION.endpoint, PAYLOAD);

      const payloadStr = mockSendNotification.mock.calls[0][1] as string;
      expect(() => JSON.parse(payloadStr)).not.toThrow();
      expect(JSON.parse(payloadStr)).toMatchObject({ title: PAYLOAD.title, body: PAYLOAD.body });
    });

    it('does nothing (no throw, no send) when the endpoint is not registered', async () => {
      const service = await buildService('pub', 'priv');

      await expect(
        service.sendPushNotification('https://unknown.endpoint/', PAYLOAD),
      ).resolves.toBeUndefined();
      expect(mockSendNotification).not.toHaveBeenCalled();
    });

    it('swallows errors thrown by sendNotification without rejecting', async () => {
      const service = await buildService('pub', 'priv');
      service.subscribe(SUBSCRIPTION);
      mockSendNotification.mockRejectedValueOnce(new Error('push gateway error'));

      await expect(
        service.sendPushNotification(SUBSCRIPTION.endpoint, PAYLOAD),
      ).resolves.toBeUndefined();
    });

    it('passes the full subscription object (including keys) to web-push', async () => {
      const service = await buildService('pub', 'priv');
      service.subscribe(SUBSCRIPTION);

      await service.sendPushNotification(SUBSCRIPTION.endpoint, PAYLOAD);

      const calledWith = mockSendNotification.mock.calls[0][0];
      expect(calledWith.keys).toEqual(SUBSCRIPTION.keys);
    });
  });

  // -------------------------------------------------------------------------
  // broadcastToAll
  // -------------------------------------------------------------------------
  describe('broadcastToAll', () => {
    it('sends to every registered subscription', async () => {
      const service = await buildService('pub', 'priv');
      service.subscribe(SUBSCRIPTION);
      service.subscribe(SUBSCRIPTION_2);

      await service.broadcastToAll(PAYLOAD);

      expect(mockSendNotification).toHaveBeenCalledTimes(2);
    });

    it('resolves immediately when there are no subscriptions', async () => {
      const service = await buildService('pub', 'priv');

      await expect(service.broadcastToAll(PAYLOAD)).resolves.toBeUndefined();
      expect(mockSendNotification).not.toHaveBeenCalled();
    });

    it('resolves even when one sendNotification call fails', async () => {
      const service = await buildService('pub', 'priv');
      service.subscribe(SUBSCRIPTION);
      service.subscribe(SUBSCRIPTION_2);

      // First notification fails, second succeeds
      mockSendNotification
        .mockRejectedValueOnce(new Error('expired subscription'))
        .mockResolvedValueOnce({ statusCode: 201 });

      await expect(service.broadcastToAll(PAYLOAD)).resolves.toBeUndefined();
      // Both were still attempted
      expect(mockSendNotification).toHaveBeenCalledTimes(2);
    });

    it('sends the correct payload to all subscribers', async () => {
      const service = await buildService('pub', 'priv');
      service.subscribe(SUBSCRIPTION);
      service.subscribe(SUBSCRIPTION_2);

      await service.broadcastToAll(PAYLOAD);

      for (const [, payloadStr] of mockSendNotification.mock.calls) {
        expect(JSON.parse(payloadStr as string)).toEqual(PAYLOAD);
      }
    });
  });
});
