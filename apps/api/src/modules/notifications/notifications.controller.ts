import { Body, Controller, Get, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PushService, PushSubscriptionDto } from './push.service';

@Controller('notifications')
export class NotificationsController {
  constructor(
    private readonly pushService: PushService,
    private readonly config: ConfigService,
  ) {}

  @Post('subscribe')
  @HttpCode(HttpStatus.CREATED)
  subscribe(@Body() subscription: PushSubscriptionDto): { success: boolean } {
    this.pushService.subscribe(subscription);
    return { success: true };
  }

  @Get('vapid-public-key')
  getVapidPublicKey(): { publicKey: string } {
    return { publicKey: this.config.get<string>('VAPID_PUBLIC_KEY') ?? '' };
  }
}
