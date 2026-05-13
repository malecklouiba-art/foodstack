import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as webpush from 'web-push';

interface PushSubscriptionKeys {
  p256dh: string;
  auth: string;
}

export interface PushSubscriptionDto {
  endpoint: string;
  keys: PushSubscriptionKeys;
}

export interface PushPayload {
  title: string;
  body: string;
  url?: string;
}

@Injectable()
export class PushService {
  private readonly logger = new Logger(PushService.name);
  private readonly subscriptions = new Map<string, PushSubscriptionDto>();

  constructor(private readonly config: ConfigService) {
    const publicKey = this.config.get<string>('VAPID_PUBLIC_KEY');
    const privateKey = this.config.get<string>('VAPID_PRIVATE_KEY');

    if (!publicKey || !privateKey) {
      this.logger.warn(
        'VAPID_PUBLIC_KEY or VAPID_PRIVATE_KEY is not set — web push notifications will be skipped',
      );
    } else {
      webpush.setVapidDetails('mailto:admin@foodstack.app', publicKey, privateKey);
    }
  }

  subscribe(subscription: PushSubscriptionDto): void {
    this.subscriptions.set(subscription.endpoint, subscription);
    this.logger.log(`Push subscription registered: ${subscription.endpoint}`);
  }

  async sendPushNotification(endpoint: string, payload: PushPayload): Promise<void> {
    const subscription = this.subscriptions.get(endpoint);
    if (!subscription) {
      this.logger.warn(`No subscription found for endpoint: ${endpoint}`);
      return;
    }

    try {
      await webpush.sendNotification(subscription as webpush.PushSubscription, JSON.stringify(payload));
    } catch (err) {
      this.logger.error(
        `Failed to send push notification to ${endpoint}: ${(err as Error).message}`,
      );
    }
  }

  async broadcastToAll(payload: PushPayload): Promise<void> {
    const promises = Array.from(this.subscriptions.keys()).map((endpoint) =>
      this.sendPushNotification(endpoint, payload),
    );
    await Promise.allSettled(promises);
  }
}
