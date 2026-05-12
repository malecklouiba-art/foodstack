import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { EventsModule } from '../events/events.module';
import { DeliveryController } from './delivery.controller';
import { DeliveryService } from './delivery.service';

@Module({
  imports: [DatabaseModule, EventsModule],
  controllers: [DeliveryController],
  providers: [DeliveryService],
  exports: [DeliveryService],
})
export class DeliveryModule {}
