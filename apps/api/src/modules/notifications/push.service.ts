import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as webpush from 'web-push';
import { PushSubscriptionDto } from './dto/push-subscription.dto';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class PushService implements OnModuleInit {
  private readonly logger = new Logger(PushService.name);
  private vapidReady = false;

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  onModuleInit(): void {
    const publicKey = this.config.get<string>('VAPID_PUBLIC_KEY');
    const privateKey = this.config.get<string>('VAPID_PRIVATE_KEY');
    const subject =
      this.config.get<string>('VAPID_SUBJECT') ?? 'mailto:admin@foodstack.app';

    if (!publicKey || !privateKey) {
      this.logger.warn('VAPID keys not configured — push notifications disabled.');
      return;
    }

    try {
      webpush.setVapidDetails(subject, publicKey, privateKey);
      this.vapidReady = true;
      this.logger.log('Web Push VAPID configured');
    } catch (err) {
      this.logger.warn(
        `VAPID keys invalid — push notifications disabled. Error: ${(err as Error).message}`,
      );
    }
  }

  generateVapidKeys(): { publicKey: string; privateKey: string } {
    const keys = webpush.generateVAPIDKeys();
    this.logger.log(
      `Generated VAPID keys:\nVAPID_PUBLIC_KEY=${keys.publicKey}\nVAPID_PRIVATE_KEY=${keys.privateKey}`,
    );
    return keys;
  }

  async subscribe(dto: PushSubscriptionDto, role?: string): Promise<void> {
    await this.prisma.pushSubscription.upsert({
      where: { userId: dto.userId },
      update: { endpoint: dto.endpoint, p256dh: dto.keys.p256dh, auth: dto.keys.auth, role },
      create: { userId: dto.userId, endpoint: dto.endpoint, p256dh: dto.keys.p256dh, auth: dto.keys.auth, role },
    });
    this.logger.log(`Push subscription saved for user ${dto.userId}`);
  }

  async unsubscribe(userId: string): Promise<void> {
    await this.prisma.pushSubscription.deleteMany({ where: { userId } });
    this.logger.log(`Push subscription removed for user ${userId}`);
  }

  async sendToUser(
    userId: string,
    notification: { title: string; body: string; icon?: string; url?: string },
  ): Promise<void> {
    const stored = await this.prisma.pushSubscription.findUnique({ where: { userId } });
    if (!stored) return;

    await this.sendPush(
      { endpoint: stored.endpoint, keys: { auth: stored.auth, p256dh: stored.p256dh } },
      notification,
      userId,
    );
  }

  async broadcastRole(
    role: string,
    notification: { title: string; body: string; icon?: string; url?: string },
  ): Promise<void> {
    const subs = await this.prisma.pushSubscription.findMany({ where: { role } });
    if (!subs.length) return;

    await Promise.allSettled(
      subs.map((s) =>
        this.sendPush(
          { endpoint: s.endpoint, keys: { auth: s.auth, p256dh: s.p256dh } },
          notification,
          s.userId,
        ),
      ),
    );
    this.logger.log(`Broadcast sent to ${subs.length} subscriber(s) with role ${role}`);
  }

  // ─── Expo push tokens ────────────────────────────────────────────────────────

  async registerExpoToken(userId: string, token: string): Promise<void> {
    await this.prisma.pushSubscription.upsert({
      where: { userId },
      update: { expoToken: token },
      create: { userId, endpoint: '', p256dh: '', auth: '', expoToken: token },
    });
    this.logger.log(`Expo push token registered for user ${userId}`);
  }

  async sendExpoNotification(
    userId: string,
    title: string,
    body: string,
    data?: Record<string, unknown>,
  ): Promise<void> {
    const stored = await this.prisma.pushSubscription.findUnique({ where: { userId } });
    if (!stored?.expoToken) return;

    try {
      const res = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ to: stored.expoToken, title, body, data: data ?? {} }),
      });
      if (!res.ok) this.logger.warn(`Expo push failed for user ${userId}: ${res.status}`);
    } catch (err) {
      this.logger.error(`Expo push error for user ${userId}`, err);
    }
  }

  // ─── Private helpers ─────────────────────────────────────────────────────────

  private async sendPush(
    subscription: webpush.PushSubscription,
    notification: { title: string; body: string; icon?: string; url?: string },
    userId?: string,
  ): Promise<void> {
    if (!this.vapidReady) return;

    const payload = JSON.stringify({
      title: notification.title,
      body: notification.body,
      icon: notification.icon ?? '/favicon.svg',
      url: notification.url ?? '/',
    });

    try {
      await webpush.sendNotification(subscription, payload);
    } catch (err: unknown) {
      const statusCode = (err as { statusCode?: number }).statusCode;
      if ((statusCode === 404 || statusCode === 410) && userId) {
        this.logger.warn(`Subscription expired for user ${userId} — removing`);
        await this.unsubscribe(userId);
        return;
      }
      this.logger.error(`Push send failed${userId ? ` for user ${userId}` : ''}`, err);
    }
  }
}
