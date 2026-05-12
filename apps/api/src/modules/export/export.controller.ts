import {
  Controller, Get, Param, Query, Res, UseGuards, BadRequestException,
} from '@nestjs/common';
import { Response } from 'express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ExportService } from './export.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('export')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('export')
export class ExportController {
  constructor(private readonly exportService: ExportService) {}

  @Get(':restaurantId/orders/pdf')
  @ApiOperation({ summary: 'Export orders as PDF report' })
  @ApiQuery({ name: 'from', required: false })
  @ApiQuery({ name: 'to', required: false })
  async ordersPdf(
    @Param('restaurantId') restaurantId: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Res() res?: Response,
  ) {
    const fromDate = from ? new Date(from) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const toDate = to ? new Date(to) : new Date();
    if (fromDate > toDate) throw new BadRequestException('from must be before to');

    const buffer = await this.exportService.generateOrdersPdf(restaurantId, fromDate, toDate);
    const filename = `commandes_${fromDate.toISOString().slice(0, 10)}_${toDate.toISOString().slice(0, 10)}.pdf`;

    res!.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': buffer.length,
    });
    res!.end(buffer);
  }

  @Get(':restaurantId/orders/excel')
  @ApiOperation({ summary: 'Export orders as Excel file' })
  @ApiQuery({ name: 'from', required: false })
  @ApiQuery({ name: 'to', required: false })
  async ordersExcel(
    @Param('restaurantId') restaurantId: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Res() res?: Response,
  ) {
    const fromDate = from ? new Date(from) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const toDate = to ? new Date(to) : new Date();

    const buffer = await this.exportService.generateOrdersExcel(restaurantId, fromDate, toDate);
    const filename = `commandes_${fromDate.toISOString().slice(0, 10)}_${toDate.toISOString().slice(0, 10)}.xlsx`;

    res!.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': buffer.length,
    });
    res!.end(buffer);
  }

  @Get(':restaurantId/inventory/excel')
  @ApiOperation({ summary: 'Export inventory as Excel file' })
  async inventoryExcel(
    @Param('restaurantId') restaurantId: string,
    @Res() res?: Response,
  ) {
    const buffer = await this.exportService.generateInventoryExcel(restaurantId);
    const filename = `inventaire_${new Date().toISOString().slice(0, 10)}.xlsx`;

    res!.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': buffer.length,
    });
    res!.end(buffer);
  }
}
