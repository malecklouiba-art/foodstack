import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { OrderFiltersDto } from './dto/order-filters.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('orders')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new order' })
  createOrder(@Body() dto: CreateOrderDto) {
    return this.ordersService.createOrder(dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get order by ID' })
  findOne(@Param('id') id: string) {
    return this.ordersService.findById(id);
  }

  @Get('restaurant/:restaurantId')
  @ApiOperation({ summary: 'Get all orders for a restaurant' })
  findByRestaurant(
    @Param('restaurantId') restaurantId: string,
    @Query() filters: OrderFiltersDto,
  ) {
    return this.ordersService.findByRestaurant(restaurantId, filters);
  }

  @Get('customer/:customerId')
  @ApiOperation({ summary: 'Get all orders for a customer' })
  findByCustomer(@Param('customerId') customerId: string) {
    return this.ordersService.findByCustomer(customerId);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update order status' })
  updateStatus(@Param('id') id: string, @Body() dto: UpdateOrderStatusDto) {
    return this.ordersService.updateStatus(id, dto);
  }

  @Patch(':id/cancel')
  @ApiOperation({ summary: 'Cancel an order' })
  cancelOrder(@Param('id') id: string, @Body('reason') reason: string) {
    return this.ordersService.cancelOrder(id, reason);
  }

  @Patch(':id/assign-driver')
  @ApiOperation({ summary: 'Assign a driver to an order' })
  assignDriver(@Param('id') id: string, @Body('driverId') driverId: string) {
    return this.ordersService.assignDriver(id, driverId);
  }
}
