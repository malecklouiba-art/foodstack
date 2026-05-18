import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';
import twilio from 'twilio';
import type { Twilio } from 'twilio';
import { PrismaService } from '../../database/prisma.service';

interface OrderConfirmationData {
  orderNumber: string;
  items: { name: string; quantity: number; price: number }[];
  total: number;
  estimatedTime: number;
}

interface OrderStatusUpdateData {
  orderNumber: string;
  status: string;
  statusLabel: string;
}

interface DeliveryCompletedData {
  orderNumber: string;
  total: number;
  driverName: string;
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private readonly resend: Resend | null;
  private twilioClient: Twilio | null = null;

  constructor(
    private config: ConfigService,
    private prisma: PrismaService,
  ) {
    const apiKey = this.config.get<string>('RESEND_API_KEY');
    if (!apiKey) {
      this.logger.warn('RESEND_API_KEY is not configured — emails will be skipped');
    }
    this.resend = apiKey ? new Resend(apiKey) : null;

    const twilioSid = this.config.get<string>('TWILIO_ACCOUNT_SID');
    const twilioToken = this.config.get<string>('TWILIO_AUTH_TOKEN');
    if (twilioSid && twilioToken) {
      this.twilioClient = twilio(twilioSid, twilioToken);
    } else {
      this.logger.warn('Twilio credentials not configured — SMS will be skipped');
    }
  }

  // ─── In-app notification CRUD ────────────────────────────────

  async createNotification(
    userId: string,
    type: string,
    title: string,
    body: string,
    orderId?: string,
  ) {
    return this.prisma.notification.create({
      data: {
        userId,
        type,
        title,
        body,
        channel: 'push',
        data: orderId ? { orderId } : undefined,
      },
    });
  }

  async listForUser(userId: string) {
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async unreadCount(userId: string): Promise<{ count: number }> {
    const count = await this.prisma.notification.count({
      where: { userId, read: false },
    });
    return { count };
  }

  async markRead(id: string, userId: string): Promise<{ ok: boolean }> {
    const notification = await this.prisma.notification.findUnique({ where: { id } });
    if (!notification || notification.userId !== userId) {
      throw new NotFoundException(`Notification ${id} not found`);
    }
    await this.prisma.notification.update({
      where: { id },
      data: { read: true, readAt: new Date() },
    });
    return { ok: true };
  }

  async markAllRead(userId: string): Promise<{ count: number }> {
    const result = await this.prisma.notification.updateMany({
      where: { userId, read: false },
      data: { read: true, readAt: new Date() },
    });
    return { count: result.count };
  }

  async deleteNotification(id: string, userId: string): Promise<{ ok: boolean }> {
    const notification = await this.prisma.notification.findUnique({ where: { id } });
    if (!notification || notification.userId !== userId) {
      throw new NotFoundException(`Notification ${id} not found`);
    }
    await this.prisma.notification.delete({ where: { id } });
    return { ok: true };
  }

  // ─── Email / SMS senders ─────────────────────────────────────

  async sendOrderConfirmation(to: string, orderData: OrderConfirmationData): Promise<void> {
    const itemRows = orderData.items
      .map(
        (item) =>
          `<tr>
            <td style="padding:6px 0;border-bottom:1px solid #f3f4f6">${item.quantity}x ${item.name}</td>
            <td style="padding:6px 0;border-bottom:1px solid #f3f4f6;text-align:right">${(item.price * item.quantity).toFixed(2)}€</td>
          </tr>`,
      )
      .join('');

    await this.send({
      to,
      subject: `Commande ${orderData.orderNumber} confirmée — FoodStack`,
      html: `
        <div style="font-family:sans-serif;max-width:520px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden">
          <div style="background:#f97316;padding:24px 32px">
            <h1 style="color:#fff;margin:0;font-size:22px">FoodStack</h1>
          </div>
          <div style="padding:32px">
            <h2 style="color:#111;margin-top:0">Commande confirmée !</h2>
            <p>Merci pour votre commande <strong>${orderData.orderNumber}</strong>.</p>
            <table style="width:100%;border-collapse:collapse;margin:16px 0">
              <tbody>${itemRows}</tbody>
              <tfoot>
                <tr>
                  <td style="padding-top:12px;font-weight:700">Total</td>
                  <td style="padding-top:12px;font-weight:700;text-align:right;color:#f97316">${orderData.total.toFixed(2)}€</td>
                </tr>
              </tfoot>
            </table>
            <p style="background:#fff7ed;border-left:4px solid #f97316;padding:12px 16px;border-radius:4px;color:#7c2d12">
              Temps de preparation estimé : <strong>${orderData.estimatedTime} min</strong>
            </p>
          </div>
          <div style="background:#f9fafb;padding:16px 32px;text-align:center">
            <p style="color:#9ca3af;font-size:12px;margin:0">FoodStack — Plateforme de restauration</p>
          </div>
        </div>
      `,
    });
  }

  async sendOrderStatusUpdate(to: string, data: OrderStatusUpdateData): Promise<void> {
    await this.send({
      to,
      subject: `Commande ${data.orderNumber} — ${data.statusLabel}`,
      html: `
        <div style="font-family:sans-serif;max-width:520px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden">
          <div style="background:#f97316;padding:24px 32px">
            <h1 style="color:#fff;margin:0;font-size:22px">FoodStack</h1>
          </div>
          <div style="padding:32px">
            <h2 style="color:#111;margin-top:0">Mise à jour de votre commande</h2>
            <p>Votre commande <strong>${data.orderNumber}</strong> est maintenant :</p>
            <div style="background:#fff7ed;border:2px solid #f97316;border-radius:8px;padding:16px;text-align:center;margin:16px 0">
              <span style="font-size:20px;font-weight:700;color:#f97316">${data.statusLabel}</span>
            </div>
          </div>
          <div style="background:#f9fafb;padding:16px 32px;text-align:center">
            <p style="color:#9ca3af;font-size:12px;margin:0">FoodStack — Plateforme de restauration</p>
          </div>
        </div>
      `,
    });
  }

  async sendDeliveryCompleted(to: string, data: DeliveryCompletedData): Promise<void> {
    await this.send({
      to,
      subject: `Votre commande ${data.orderNumber} a été livrée — FoodStack`,
      html: `
        <div style="font-family:sans-serif;max-width:520px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden">
          <div style="background:#f97316;padding:24px 32px">
            <h1 style="color:#fff;margin:0;font-size:22px">FoodStack</h1>
          </div>
          <div style="padding:32px">
            <h2 style="color:#111;margin-top:0">Commande livrée !</h2>
            <p>Votre commande <strong>${data.orderNumber}</strong> a été livrée par <strong>${data.driverName}</strong>.</p>
            <p>Montant total : <strong style="color:#f97316">${data.total.toFixed(2)}€</strong></p>
            <p>Bon appétit ! N'oubliez pas de laisser un avis sur votre expérience.</p>
          </div>
          <div style="background:#f9fafb;padding:16px 32px;text-align:center">
            <p style="color:#9ca3af;font-size:12px;margin:0">FoodStack — Plateforme de restauration</p>
          </div>
        </div>
      `,
    });
  }

  async sendPasswordReset(to: string, resetUrl: string) {
    return this.send({
      to,
      subject: 'Réinitialisation de votre mot de passe FoodStack',
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto">
          <h2 style="color:#111">Réinitialisation du mot de passe</h2>
          <p>Cliquez sur le bouton ci-dessous pour réinitialiser votre mot de passe.</p>
          <a href="${resetUrl}" style="display:inline-block;background:#1EFF6A;color:#000;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;margin:16px 0">
            Réinitialiser mon mot de passe
          </a>
          <p style="color:#666;font-size:12px">Ce lien expire dans 1 heure. Si vous n'avez pas demandé cette réinitialisation, ignorez cet email.</p>
        </div>
      `,
    });
  }

  async sendWelcome(to: string, name: string) {
    return this.send({
      to,
      subject: `Bienvenue sur FoodStack, ${name} !`,
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto">
          <h2 style="color:#111">Bienvenue sur FoodStack ! 👋</h2>
          <p>Bonjour <strong>${name}</strong>,</p>
          <p>Votre compte a été créé avec succès. Profitez de nos meilleurs restaurants et de la livraison rapide.</p>
          <hr/>
          <p style="color:#666;font-size:12px">FoodStack — Plateforme de restauration</p>
        </div>
      `,
    });
  }

  async sendSms(to: string, message: string): Promise<void> {
    if (!this.twilioClient) {
      this.logger.warn('Twilio not configured, skipping SMS');
      return;
    }
    try {
      await this.twilioClient.messages.create({
        body: message,
        from: this.config.get<string>('TWILIO_PHONE_NUMBER'),
        to,
      });
    } catch (err) {
      this.logger.error(`SMS failed to ${to}:`, err);
    }
  }

  async sendOrderReadySms(phone: string, orderNumber: string): Promise<void> {
    await this.sendSms(phone, `Votre commande #${orderNumber} est prête ! 🎉`);
  }

  async sendDeliveryEnRouteSms(phone: string, orderNumber: string, eta: number): Promise<void> {
    await this.sendSms(
      phone,
      `Votre livreur est en route pour #${orderNumber}. Livraison estimée dans ${eta} min. 🛵`,
    );
  }

  private async send({ to, subject, html }: { to: string; subject: string; html: string }) {
    if (!this.resend) {
      this.logger.warn(`Email not sent (no RESEND_API_KEY): ${subject} → ${to}`);
      return { id: 'dev-mock', to, subject };
    }
    try {
      const { data, error } = await this.resend.emails.send({
        from: 'FoodStack <noreply@foodstack.app>',
        to,
        subject,
        html,
      });
      if (error) throw error;
      return data;
    } catch (err) {
      this.logger.error(`Email send failed: ${subject} → ${to}`, err);
      throw err;
    }
  }
}
