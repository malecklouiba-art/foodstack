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

  @Get('general')   getGeneral()                           { return this.service.getGeneral(); }
  @Patch('general') saveGeneral(@Body() b: Record<string, unknown>) { return this.service.saveGeneral(b); }

  @Get('stripe')    getStripe()                            { return this.service.getStripe(); }
  @Patch('stripe')  saveStripe(@Body() b: Record<string, unknown>)  { return this.service.saveStripe(b); }

  @Get('smtp')      getSmtp()                              { return this.service.getSmtp(); }
  @Patch('smtp')    saveSmtp(@Body() b: Record<string, unknown>)    { return this.service.saveSmtp(b); }

  @Get('security')  getSecurity()                          { return this.service.getSecurity(); }
  @Patch('security') saveSecurity(@Body() b: Record<string, unknown>) { return this.service.saveSecurity(b); }

  @Get('appearance') getAppearance()                       { return this.service.getAppearance(); }
  @Patch('appearance') saveAppearance(@Body() b: Record<string, unknown>) { return this.service.saveAppearance(b); }
}
