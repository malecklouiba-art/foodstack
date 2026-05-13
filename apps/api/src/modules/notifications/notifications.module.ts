import { Module } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { PushService } from './push.service';
import { SmsService } from './sms.service';
import { NotificationsController } from './notifications.controller';

@Module({
  controllers: [NotificationsController],
  providers: [NotificationsService, PushService, SmsService],
  exports: [NotificationsService, PushService, SmsService],
})
export class NotificationsModule {}
