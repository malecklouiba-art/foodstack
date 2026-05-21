import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { RestaurantsModule } from './modules/restaurants/restaurants.module';
import { MenuModule } from './modules/menu/menu.module';
import { OrdersModule } from './modules/orders/orders.module';
import { InventoryModule } from './modules/inventory/inventory.module';
import { DeliveryModule } from './modules/delivery/delivery.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { LoyaltyModule } from './modules/loyalty/loyalty.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { DatabaseModule } from './database/database.module';
import { RealtimeModule } from './modules/realtime/realtime.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { CouponsModule } from './modules/coupons/coupons.module';
import { DriversModule } from './modules/drivers/drivers.module';
import { SuperAdminModule } from './modules/super-admin/super-admin.module';
import { AuditModule } from './modules/audit/audit.module';
import { TablesModule } from './modules/tables/tables.module';
import { SuppliersModule } from './modules/suppliers/suppliers.module';
import { AdminSettingsModule } from './modules/admin-settings/admin-settings.module';
import { HealthModule } from './modules/health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
    DatabaseModule,
    AuditModule,
    RealtimeModule,
    AuthModule,
    UsersModule,
    RestaurantsModule,
    MenuModule,
    OrdersModule,
    InventoryModule,
    DeliveryModule,
    PaymentsModule,
    LoyaltyModule,
    AnalyticsModule,
    NotificationsModule,
    CouponsModule,
    DriversModule,
    SuperAdminModule,
    TablesModule,
    SuppliersModule,
    AdminSettingsModule,
    HealthModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
