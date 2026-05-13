import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { CouponsService } from './coupons.service';
import { CreateCouponDto } from './dto/create-coupon.dto';
import { ApplyCouponDto } from './dto/apply-coupon.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('coupons')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('coupons')
export class CouponsController {
  constructor(private readonly couponsService: CouponsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new coupon' })
  create(@Body() dto: CreateCouponDto) {
    return this.couponsService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List all coupons, optionally filtered by restaurantId' })
  @ApiQuery({ name: 'restaurantId', required: false })
  findAll(@Query('restaurantId') restaurantId?: string) {
    return this.couponsService.findAll(restaurantId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a coupon by ID' })
  findOne(@Param('id') id: string) {
    return this.couponsService.findOne(id);
  }

  @Post('apply')
  @ApiOperation({ summary: 'Validate and apply a coupon code to an order total' })
  applyCoupon(@Body() dto: ApplyCouponDto) {
    return this.couponsService.applyCoupon(dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a coupon by ID' })
  remove(@Param('id') id: string) {
    return this.couponsService.remove(id);
  }
}
