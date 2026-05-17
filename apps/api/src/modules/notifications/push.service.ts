import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as webpush from 'web-push';
import { PushSubscriptionDto } from './dto/push-subscription.dto';

interface StoredSubscription {
  subscription: webpush.PushSubscription;
  role?: string;
}

@Injectable()
export class PushService implements OnModuleInit {
  private readonly logger = new Logger(PushService.name);

  /** In-memory store: userId → subscription + role */
  private readonly subscriptions = new Map<string, StoredSubscription>();

  /** Reverse index: role → Set<userId> */
  private readonly roleIndex = new Map<string, Set<string>>();

  constructor(private readonly config: ConfigService) {}

  onModuleInit(): void {
    const publicKey = this.config.get<string>('VAPID_PUBLIC_KEY');
    const privateKey = this.config.get<string>('VAPID_PRIVATE_KEY');
    const subject =
      this.config.get<string>('VAPID_SUBJECT') ?? 'mailto:admin@foodstack.app';

    if (!publicKey || !privateKey) {
      this.logger.warn(
        'VAPID keys not configured — push notifications will be disabled. ' +
          'Run generateVapidKeys() to generate them.',
      );
      return;
    }

    webpush.setVapidDetails(subject, publicKey, privateKey);
    this.logger.log('Web Push VAPID configured');
  }

  /** Utility: generate a new VAPID key pair (for initial setup / debug). */
  generateVapidKeys(): { publicKey: string; privateKey: string } {
    const keys = webpush.generateVAPIDKeys();
    this.logger.log(`Generated VAPID keys — add to .env:\nVAPID_PUBLIC_KEY=${keys.publicKey}\nVAPID_PRIVATE_KEY=${keys.privateKey}`);
    return keys;
  }

  /** Save (or update) a push subscription for a given user. */
  subscribe(dto: PushSubscriptionDto, role?: string): void {
    const pushSub: webpush.PushSubscription = {
      endpoint: dto.endpoint,
      keys: {
        auth: dto.keys.auth,
        p256dh: dto.keys.p256dh,
      },
    };

    // Remove user from previous role index if re-subscribing with a different role
    const existing = this.subscriptions.get(dto.userId);
    if (existing?.role) {
      this.roleIndex.get(existing.role)?.delete(dto.userId);
    }

    this.subscriptions.set(dto.userId, { subscription: pushSub, role });

    if (role) {
      if (!this.roleIndex.has(role)) {
        this.roleIndex.set(role, new Set());
      }
      this.roleIndex.get(role)!.add(dto.userId);
    }

    this.logger.log(`Subscription saved for user ${dto.userId}${role ? ` (role: ${role})` : ''}`);
  }

  /** Unregister a user's push subscription. */
  unsubscribe(userId: string): void {
    const existing = this.subscriptions.get(userId);
    if (existing?.role) {
      this.roleIndex.get(existing.role)?.delete(userId);
    }
    this.subscriptions.delete(userId);
    this.logger.log(`Subscription removed for user ${userId}`);
  }

  /** Send a push notification to a single user. */
  async sendToUser(
    userId: string,
    notification: { title: string; body: string; icon?: string; url?: string },
  ): Promise<void> {
    const stored = this.subscriptions.get(userId);
    if (!stored) {
      this.logger.warn(`No subscription found for user ${userId}`);
      return;
    }

    await this.sendPush(stored.subscription, notification, userId);
  }

  /** Broadcast a push notification to all users belonging to a role. */
  async broadcastRole(
    role: string,
    notification: { title: string; body: string; icon?: string; url?: string },
  ): Promise<void> {
    const userIds = this.roleIndex.get(role);
    if (!userIds || userIds.size === 0) {
      this.logger.warn(`No subscribers found for role ${role}`);
      return;
    }

    const sends = Array.from(userIds).map((userId) =>
      this.sendToUser(userId, notification),
    );
    await Promise.allSettled(sends);
    this.logger.log(`Broadcast sent to ${userIds.size} user(s) with role ${role}`);
  }

  // ─── Private helpers ────────────────────────────────────────────────────────

  private async sendPush(
    subscription: webpush.PushSubscription,
    notification: { title: string; body: string; icon?: string; url?: string },
    userId?: string,
  ): Promise<void> {
    const payload = JSON.stringify({
      title: notification.title,
      body: notification.body,
      icon: notification.icon ?? '/favicon.svg',
      url: notification.url ?? '/',
    });

    try {
      await webpush.sendNotification(subscription, payload);
      this.logger.debug(`Push sent${userId ? ` to user ${userId}` : ''}`);
    } catch (err: unknown) {
      const statusCode = (err as { statusCode?: number }).statusCode;
      // 404 / 410 = subscription expired or revoked — clean up
      if (statusCode === 404 || statusCode === 410) {
        if (userId) {
          this.logger.warn(`Subscription expired for user ${userId} — removing`);
          this.unsubscribe(userId);
        }
        return;
      }
      this.logger.error(`Push send failed${userId ? ` for user ${userId}` : ''}`, err);
      throw err;
    }
  }
}
