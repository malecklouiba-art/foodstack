import { Controller, Get, Query, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('analytics')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('super_admin', 'restaurant_owner', 'staff')
@Controller('analytics')
export class AnalyticsController {
  constructor(private analyticsService: AnalyticsService) {}

  @Get(':restaurantId/sales')
  @ApiOperation({ summary: 'Get sales summary for a date range' })
  @ApiQuery({ name: 'from', required: false })
  @ApiQuery({ name: 'to', required: false })
  getSales(
    @Param('restaurantId') restaurantId: string,
    @Query('from') from?: string,
    @Query('to') to?: string
  ) {
    const fromDate = from ? new Date(from) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const toDate = to ? new Date(to) : new Date();
    return this.analyticsService.getSalesSummary(restaurantId, fromDate, toDate);
  }

  @Get(':restaurantId/top-items')
  @ApiOperation({ summary: 'Get top selling items' })
  getTopItems(@Param('restaurantId') restaurantId: string, @Query('limit') limit?: number) {
    return this.analyticsService.getTopItems(restaurantId, limit ? Number(limit) : 10);
  }

  @Get(':restaurantId/revenue')
  @ApiOperation({ summary: 'Get revenue by period' })
  @ApiQuery({ name: 'period', enum: ['day', 'week', 'month'] })
  getRevenue(
    @Param('restaurantId') restaurantId: string,
    @Query('period') period: 'day' | 'week' | 'month' = 'week'
  ) {
    return this.analyticsService.getRevenueByPeriod(restaurantId, period);
  }

  @Get(':restaurantId/delivery-performance')
  @ApiOperation({ summary: 'Get delivery performance metrics' })
  getDeliveryPerformance(@Param('restaurantId') restaurantId: string) {
    return this.analyticsService.getDeliveryPerformance(restaurantId);
  }

  @Get(':restaurantId/customers')
  @ApiOperation({ summary: 'Get customer insights' })
  getCustomers(@Param('restaurantId') restaurantId: string) {
    return this.analyticsService.getCustomerInsights(restaurantId);
  }
}
