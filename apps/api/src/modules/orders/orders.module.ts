import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { EventsModule } from '../events/events.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { LoyaltyModule } from '../loyalty/loyalty.module';

@Module({
  imports: [DatabaseModule, EventsModule, NotificationsModule, LoyaltyModule],
  controllers: [OrdersController],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}
