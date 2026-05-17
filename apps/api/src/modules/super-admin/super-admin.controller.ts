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
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('super-admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('super_admin')
@Controller('super-admin')
export class SuperAdminController {
  constructor(private readonly superAdminService: SuperAdminService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Get platform-wide statistics' })
  getStats() {
    return this.superAdminService.getPlatformStats();
  }

  @Get('restaurants')
  @ApiOperation({ summary: 'List all restaurants with stats' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getRestaurants(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.superAdminService.getRestaurantsOverview(
      page ? Number(page) : 1,
      limit ? Number(limit) : 20,
    );
  }

  @Get('restaurants/:id')
  @ApiOperation({ summary: 'Get restaurant detail with metrics' })
  getRestaurant(@Param('id') id: string) {
    return this.superAdminService.getRestaurantDetail(id);
  }

  @Patch('restaurants/:id/suspend')
  @ApiOperation({ summary: 'Suspend a restaurant' })
  suspendRestaurant(@Param('id') id: string) {
    return this.superAdminService.suspendRestaurant(id);
  }

  @Patch('restaurants/:id/activate')
  @ApiOperation({ summary: 'Activate a restaurant' })
  activateRestaurant(@Param('id') id: string) {
    return this.superAdminService.activateRestaurant(id);
  }

  @Get('users')
  @ApiOperation({ summary: 'List all users (paginated)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getUsers(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.superAdminService.getUsers(
      page ? Number(page) : 1,
      limit ? Number(limit) : 20,
    );
  }

  @Get('audit-logs')
  @ApiOperation({ summary: 'Get paginated audit logs (filterable)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'userId', required: false, type: String })
  @ApiQuery({ name: 'action', required: false, type: String })
  getAuditLogs(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('userId') userId?: string,
    @Query('action') action?: string,
  ) {
    return this.superAdminService.getAuditLogs(
      page ? Number(page) : 1,
      limit ? Number(limit) : 50,
      { userId, action },
    );
  }
}
