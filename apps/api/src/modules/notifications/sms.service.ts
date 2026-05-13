import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Twilio from 'twilio';

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);
  private readonly client: ReturnType<typeof Twilio> | null = null;
  private readonly from: string;

  constructor(private readonly config: ConfigService) {
    const sid = this.config.get<string>('TWILIO_ACCOUNT_SID');
    const token = this.config.get<string>('TWILIO_AUTH_TOKEN');
    this.from = this.config.get<string>('TWILIO_PHONE_NUMBER') ?? '';

    if (!sid || !token || !this.from) {
      this.logger.warn('Twilio credentials not set — SMS notifications will be skipped');
    } else {
      this.client = Twilio(sid, token);
    }
  }

  async sendOrderConfirmation(to: string, orderNumber: string, restaurantName: string, total: number): Promise<void> {
    await this.send(
      to,
      `FoodStack: Your order #${orderNumber} from ${restaurantName} is confirmed! Total: €${total.toFixed(2)}. We'll text you when it's on its way.`,
    );
  }

  async sendOrderStatusUpdate(to: string, orderNumber: string, status: string): Promise<void> {
    const messages: Record<string, string> = {
      PREPARING: `FoodStack: Order #${orderNumber} is being prepared. Sit tight!`,
      READY: `FoodStack: Order #${orderNumber} is ready and waiting for pickup by your delivery driver.`,
      OUT_FOR_DELIVERY: `FoodStack: Great news! Order #${orderNumber} is out for delivery. Should arrive soon.`,
      DELIVERED: `FoodStack: Order #${orderNumber} has been delivered. Enjoy your meal! 🍽️`,
      CANCELLED: `FoodStack: Order #${orderNumber} has been cancelled. Contact support if this was unexpected.`,
    };

    const body = messages[status] ?? `FoodStack: Order #${orderNumber} status updated to ${status}.`;
    await this.send(to, body);
  }

  async sendDeliveryAssigned(to: string, orderNumber: string, driverName: string): Promise<void> {
    await this.send(
      to,
      `FoodStack: ${driverName} is picking up your order #${orderNumber} and heading your way!`,
    );
  }

  private async send(to: string, body: string): Promise<void> {
    if (!this.client) return;
    try {
      await this.client.messages.create({ from: this.from, to, body });
      this.logger.log(`SMS sent to ${to}`);
    } catch (err) {
      this.logger.error(`Failed to send SMS to ${to}: ${(err as Error).message}`);
    }
  }
}
