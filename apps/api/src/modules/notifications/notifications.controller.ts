import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { PushService } from './push.service';
import { PushSubscriptionDto } from './dto/push-subscription.dto';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly pushService: PushService) {}

  @Post('push/subscribe')
  @HttpCode(HttpStatus.CREATED)
  subscribe(@Body() dto: PushSubscriptionDto): { ok: boolean } {
    this.pushService.subscribe(dto);
    return { ok: true };
  }
}
