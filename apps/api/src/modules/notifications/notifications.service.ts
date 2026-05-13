import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

interface OrderItem {
  name: string;
  qty: number;
  price: number;
}

interface OrderDetails {
  orderNumber: string;
  total: number;
  items: OrderItem[];
  restaurantName: string;
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private readonly resend: Resend | null = null;
  private readonly from: string;

  constructor(private readonly config: ConfigService) {
    const apiKey = this.config.get<string>('RESEND_API_KEY');
    this.from = this.config.get<string>('RESEND_FROM_EMAIL') ?? 'noreply@foodstack.app';

    if (!apiKey) {
      this.logger.warn('RESEND_API_KEY is not set — email notifications will be skipped');
    } else {
      this.resend = new Resend(apiKey);
    }
  }

  async sendOrderConfirmation(to: string, order: OrderDetails): Promise<void> {
    if (!this.resend) return;

    const itemRows = order.items
      .map(
        (item) => `
        <tr>
          <td style="padding:8px 0;border-bottom:1px solid #f3f4f6;color:#374151;">${item.name}</td>
          <td style="padding:8px 0;border-bottom:1px solid #f3f4f6;color:#374151;text-align:center;">x${item.qty}</td>
          <td style="padding:8px 0;border-bottom:1px solid #f3f4f6;color:#374151;text-align:right;">€${(item.price * item.qty).toFixed(2)}</td>
        </tr>`,
      )
      .join('');

    const html = `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;padding:40px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
        <!-- Header -->
        <tr>
          <td style="background:#f97316;padding:32px 40px;text-align:center;">
            <h1 style="margin:0;color:#ffffff;font-size:28px;font-weight:700;letter-spacing:-0.5px;">FoodStack</h1>
            <p style="margin:8px 0 0;color:#fff7ed;font-size:14px;">Your order is confirmed!</p>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:40px;">
            <h2 style="margin:0 0 4px;color:#111827;font-size:20px;font-weight:600;">Order ${order.orderNumber}</h2>
            <p style="margin:0 0 24px;color:#6b7280;font-size:14px;">From ${order.restaurantName}</p>

            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
              <thead>
                <tr>
                  <th style="padding:8px 0;border-bottom:2px solid #e5e7eb;color:#6b7280;font-size:12px;text-align:left;text-transform:uppercase;letter-spacing:0.05em;">Item</th>
                  <th style="padding:8px 0;border-bottom:2px solid #e5e7eb;color:#6b7280;font-size:12px;text-align:center;text-transform:uppercase;letter-spacing:0.05em;">Qty</th>
                  <th style="padding:8px 0;border-bottom:2px solid #e5e7eb;color:#6b7280;font-size:12px;text-align:right;text-transform:uppercase;letter-spacing:0.05em;">Price</th>
                </tr>
              </thead>
              <tbody>${itemRows}</tbody>
            </table>

            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px;">
              <tr>
                <td style="padding:12px 16px;background:#fff7ed;border-radius:8px;border-left:4px solid #f97316;">
                  <span style="color:#6b7280;font-size:14px;">Total</span>
                  <span style="float:right;color:#111827;font-size:18px;font-weight:700;">€${order.total.toFixed(2)}</span>
                </td>
              </tr>
            </table>

            <p style="margin:0;color:#6b7280;font-size:14px;line-height:1.6;">
              Thank you for your order! We'll notify you when it's on its way.
            </p>
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="padding:24px 40px;background:#f9fafb;border-top:1px solid #e5e7eb;text-align:center;">
            <p style="margin:0;color:#9ca3af;font-size:12px;">© ${new Date().getFullYear()} FoodStack. All rights reserved.</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

    try {
      await this.resend.emails.send({
        from: this.from,
        to,
        subject: `Order confirmed — ${order.orderNumber}`,
        html,
      });
      this.logger.log(`Order confirmation sent to ${to} for order ${order.orderNumber}`);
    } catch (err) {
      this.logger.error(`Failed to send order confirmation to ${to}: ${(err as Error).message}`);
    }
  }

  async sendPasswordReset(to: string, resetUrl: string): Promise<void> {
    if (!this.resend) return;

    const html = `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;padding:40px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
        <tr>
          <td style="background:#f97316;padding:32px 40px;text-align:center;">
            <h1 style="margin:0;color:#ffffff;font-size:28px;font-weight:700;letter-spacing:-0.5px;">FoodStack</h1>
          </td>
        </tr>
        <tr>
          <td style="padding:40px;">
            <h2 style="margin:0 0 16px;color:#111827;font-size:20px;font-weight:600;">Reset your password</h2>
            <p style="margin:0 0 24px;color:#6b7280;font-size:14px;line-height:1.6;">
              We received a request to reset the password for your FoodStack account. Click the button below to choose a new password.
            </p>
            <table cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
              <tr>
                <td style="background:#f97316;border-radius:8px;text-align:center;">
                  <a href="${resetUrl}" style="display:inline-block;padding:14px 32px;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;">Reset Password</a>
                </td>
              </tr>
            </table>
            <p style="margin:0 0 8px;color:#6b7280;font-size:13px;line-height:1.6;">
              Or copy and paste this link into your browser:
            </p>
            <p style="margin:0 0 24px;color:#f97316;font-size:13px;word-break:break-all;">${resetUrl}</p>
            <p style="margin:0;color:#9ca3af;font-size:13px;line-height:1.6;">
              This link expires in 1 hour. If you didn't request a password reset, you can safely ignore this email.
            </p>
          </td>
        </tr>
        <tr>
          <td style="padding:24px 40px;background:#f9fafb;border-top:1px solid #e5e7eb;text-align:center;">
            <p style="margin:0;color:#9ca3af;font-size:12px;">© ${new Date().getFullYear()} FoodStack. All rights reserved.</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

    try {
      await this.resend.emails.send({
        from: this.from,
        to,
        subject: 'Reset your FoodStack password',
        html,
      });
      this.logger.log(`Password reset email sent to ${to}`);
    } catch (err) {
      this.logger.error(`Failed to send password reset to ${to}: ${(err as Error).message}`);
    }
  }

  async sendWelcome(to: string, firstName: string): Promise<void> {
    if (!this.resend) return;

    const html = `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;padding:40px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
        <tr>
          <td style="background:#f97316;padding:32px 40px;text-align:center;">
            <h1 style="margin:0;color:#ffffff;font-size:28px;font-weight:700;letter-spacing:-0.5px;">FoodStack</h1>
            <p style="margin:8px 0 0;color:#fff7ed;font-size:14px;">Welcome to the family!</p>
          </td>
        </tr>
        <tr>
          <td style="padding:40px;">
            <h2 style="margin:0 0 16px;color:#111827;font-size:20px;font-weight:600;">Hey ${firstName}, welcome aboard! 🎉</h2>
            <p style="margin:0 0 16px;color:#6b7280;font-size:14px;line-height:1.6;">
              Your FoodStack account is ready. Discover the best local restaurants and get food delivered straight to your door.
            </p>
            <p style="margin:0 0 24px;color:#6b7280;font-size:14px;line-height:1.6;">
              Here's what you can do with FoodStack:
            </p>
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px;">
              <tr>
                <td style="padding:12px 16px;margin-bottom:8px;background:#fff7ed;border-radius:8px;border-left:4px solid #f97316;display:block;">
                  <strong style="color:#111827;font-size:14px;">Browse restaurants</strong>
                  <p style="margin:4px 0 0;color:#6b7280;font-size:13px;">Explore hundreds of local restaurants near you.</p>
                </td>
              </tr>
              <tr><td style="height:8px;"></td></tr>
              <tr>
                <td style="padding:12px 16px;background:#fff7ed;border-radius:8px;border-left:4px solid #f97316;">
                  <strong style="color:#111827;font-size:14px;">Earn loyalty points</strong>
                  <p style="margin:4px 0 0;color:#6b7280;font-size:13px;">Every order earns you points redeemable for discounts.</p>
                </td>
              </tr>
            </table>
            <p style="margin:0;color:#6b7280;font-size:14px;line-height:1.6;">
              Happy ordering!<br>
              <strong style="color:#111827;">The FoodStack Team</strong>
            </p>
          </td>
        </tr>
        <tr>
          <td style="padding:24px 40px;background:#f9fafb;border-top:1px solid #e5e7eb;text-align:center;">
            <p style="margin:0;color:#9ca3af;font-size:12px;">© ${new Date().getFullYear()} FoodStack. All rights reserved.</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

    try {
      await this.resend.emails.send({
        from: this.from,
        to,
        subject: `Welcome to FoodStack, ${firstName}!`,
        html,
      });
      this.logger.log(`Welcome email sent to ${to}`);
    } catch (err) {
      this.logger.error(`Failed to send welcome email to ${to}: ${(err as Error).message}`);
    }
  }
}
