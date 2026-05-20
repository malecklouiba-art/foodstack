import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { PushService } from './push.service';
import { PushSubscriptionDto } from './dto/push-subscription.dto';
import { NotificationsService } from './notifications.service';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('notifications')
export class NotificationsController {
  constructor(
    private readonly pushService: PushService,
    private readonly notificationsService: NotificationsService,
  ) {}

  // ─── Push subscription (existing) ────────────────────────────

  @Post('push/subscribe')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  subscribe(@Body() dto: PushSubscriptionDto): { ok: boolean } {
    this.pushService.subscribe(dto);
    return { ok: true };
  }

  @Post('expo-token')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  registerExpoToken(
    @Request() req: { user: { id: string } },
    @Body() body: { token: string },
  ): { ok: boolean } {
    if (body.token) {
      this.pushService.registerExpoToken(req.user.id, body.token);
    }
    return { ok: true };
  }

  // ─── In-app notifications CRUD ───────────────────────────────

  @Get()
  @UseGuards(JwtAuthGuard)
  list(@Request() req: any) {
    return this.notificationsService.listForUser(req.user.id);
  }

  @Get('unread-count')
  @UseGuards(JwtAuthGuard)
  unreadCount(@Request() req: any): Promise<{ count: number }> {
    return this.notificationsService.unreadCount(req.user.id);
  }

  @Patch('read-all')
  @UseGuards(JwtAuthGuard)
  markAllRead(@Request() req: any): Promise<{ count: number }> {
    return this.notificationsService.markAllRead(req.user.id);
  }

  @Patch(':id/read')
  @UseGuards(JwtAuthGuard)
  markRead(@Param('id') id: string, @Request() req: any): Promise<{ ok: boolean }> {
    return this.notificationsService.markRead(id, req.user.id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  remove(@Param('id') id: string, @Request() req: any): Promise<{ ok: boolean }> {
    return this.notificationsService.deleteNotification(id, req.user.id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateNotificationDto) {
    return this.notificationsService.createNotification(
      dto.userId,
      dto.type,
      dto.title,
      dto.body,
      dto.orderId,
    );
  }
}
