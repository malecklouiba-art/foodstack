import { Controller, Get, Query, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('analytics')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('analytics')
export class AnalyticsController {
  constructor(private analyticsService: AnalyticsService) {}

  @Get(':restaurantId/kpis')
  @ApiOperation({ summary: 'Dashboard KPIs — revenue, orders, avg basket, unique customers (last 7d vs previous 7d)' })
  getKpis(@Param('restaurantId') restaurantId: string) {
    return this.analyticsService.getDashboardKpis(restaurantId);
  }

  @Get(':restaurantId/sales')
  @ApiOperation({ summary: 'Sales summary for a date range' })
  @ApiQuery({ name: 'from', required: false })
  @ApiQuery({ name: 'to', required: false })
  getSales(
    @Param('restaurantId') restaurantId: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    const fromDate = from ? new Date(from) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const toDate = to ? new Date(to) : new Date();
    return this.analyticsService.getSalesSummary(restaurantId, fromDate, toDate);
  }

  @Get(':restaurantId/revenue-series')
  @ApiOperation({ summary: 'Revenue + order count per day in date range' })
  @ApiQuery({ name: 'from', required: false })
  @ApiQuery({ name: 'to', required: false })
  getRevenueSeries(
    @Param('restaurantId') restaurantId: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    const fromDate = from ? new Date(from) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const toDate = to ? new Date(to) : new Date();
    return this.analyticsService.getRevenueTimeSeries(restaurantId, fromDate, toDate);
  }

  @Get(':restaurantId/hourly')
  @ApiOperation({ summary: 'Orders per hour for a given date (default: today)' })
  @ApiQuery({ name: 'date', required: false, example: '2026-05-12' })
  getHourly(
    @Param('restaurantId') restaurantId: string,
    @Query('date') date?: string,
  ) {
    return this.analyticsService.getHourlyOrders(restaurantId, date ? new Date(date) : undefined);
  }

  @Get(':restaurantId/order-types')
  @ApiOperation({ summary: 'Order type breakdown (delivery / pickup / dine_in)' })
  @ApiQuery({ name: 'from', required: false })
  @ApiQuery({ name: 'to', required: false })
  getOrderTypes(
    @Param('restaurantId') restaurantId: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    const fromDate = from ? new Date(from) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const toDate = to ? new Date(to) : new Date();
    return this.analyticsService.getOrderTypeBreakdown(restaurantId, fromDate, toDate);
  }

  @Get(':restaurantId/top-items')
  @ApiOperation({ summary: 'Top selling items by quantity' })
  @ApiQuery({ name: 'limit', required: false })
  getTopItems(@Param('restaurantId') restaurantId: string, @Query('limit') limit?: number) {
    return this.analyticsService.getTopItems(restaurantId, limit ? Number(limit) : 10);
  }

  @Get(':restaurantId/delivery-performance')
  @ApiOperation({ summary: 'Delivery on-time rate and average metrics' })
  getDeliveryPerformance(@Param('restaurantId') restaurantId: string) {
    return this.analyticsService.getDeliveryPerformance(restaurantId);
  }

  @Get(':restaurantId/customers')
  @ApiOperation({ summary: 'New vs returning customers, retention rate' })
  getCustomers(@Param('restaurantId') restaurantId: string) {
    return this.analyticsService.getCustomerInsights(restaurantId);
  }
}
