import { Controller, Get, Patch, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AdminSettingsService } from './admin-settings.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('admin/settings')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('super_admin')
@Controller('admin/settings')
export class AdminSettingsController {
  constructor(private readonly service: AdminSettingsService) {}

  @Get('general')
  @ApiOperation({ summary: 'Get general platform settings' })
  getGeneral() {
    return this.service.getGeneral();
  }

  @Patch('general')
  @ApiOperation({ summary: 'Update general platform settings' })
  saveGeneral(@Body() body: Record<string, unknown>) {
    return this.service.saveGeneral(body);
  }

  @Get('stripe')
  @ApiOperation({ summary: 'Get Stripe configuration (secret key redacted)' })
  getStripe() {
    return this.service.getStripe();
  }

  @Patch('stripe')
  @ApiOperation({ summary: 'Update Stripe configuration' })
  saveStripe(@Body() body: Record<string, unknown>) {
    return this.service.saveStripe(body);
  }
}
