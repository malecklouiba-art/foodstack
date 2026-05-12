import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { EventsModule } from '../events/events.module';

@Module({
  imports: [DatabaseModule, EventsModule],
  controllers: [OrdersController],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}
