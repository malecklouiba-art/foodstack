import {
  Controller,
  Get,
  Patch,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { SuperAdminService } from './super-admin.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('super-admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('super-admin')
export class SuperAdminController {
  constructor(private readonly superAdminService: SuperAdminService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Get platform-wide statistics' })
  getStats() {
    return this.superAdminService.getStats();
  }

  @Get('restaurants')
  @ApiOperation({ summary: 'Get paginated list of all restaurants' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getRestaurants(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.superAdminService.getRestaurants(
      page ? Number(page) : 1,
      limit ? Number(limit) : 20,
    );
  }

  @Patch('restaurants/:id/suspend')
  @ApiOperation({ summary: 'Suspend a restaurant' })
  suspendRestaurant(@Param('id') id: string) {
    return this.superAdminService.suspendRestaurant(id);
  }

  @Get('audit-logs')
  @ApiOperation({ summary: 'Get paginated audit logs' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getAuditLogs(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.superAdminService.getAuditLogs(
      page ? Number(page) : 1,
      limit ? Number(limit) : 50,
    );
  }
}
