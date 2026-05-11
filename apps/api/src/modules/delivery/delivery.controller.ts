import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { DeliveryService } from './delivery.service';
import { UpdateDriverLocationDto } from './dto/update-driver-location.dto';
import { UpdateDeliveryStatusDto } from './dto/update-delivery-status.dto';
import { AssignDriverDto } from './dto/assign-driver.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('delivery')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('delivery')
export class DeliveryController {
  constructor(private readonly deliveryService: DeliveryService) {}

  @Get('active')
  @ApiOperation({ summary: 'Get all active deliveries for a restaurant' })
  @ApiQuery({ name: 'restaurantId', type: String })
  getActiveDeliveries(@Query('restaurantId') restaurantId: string) {
    return this.deliveryService.getActiveDeliveries(restaurantId);
  }

  @Get('orders/:orderId/eta')
  @ApiOperation({ summary: 'Get estimated delivery time for an order' })
  getDeliveryETA(@Param('orderId') orderId: string) {
    return this.deliveryService.getDeliveryETA(orderId);
  }

  @Patch('orders/:orderId/status')
  @ApiOperation({ summary: 'Update the delivery status of an order' })
  updateDeliveryStatus(
    @Param('orderId') orderId: string,
    @Body() dto: UpdateDeliveryStatusDto,
  ) {
    return this.deliveryService.updateDeliveryStatus(orderId, dto);
  }

  @Patch('orders/:orderId/assign-driver')
  @ApiOperation({ summary: 'Assign a driver to an order' })
  assignDriver(@Param('orderId') orderId: string, @Body() dto: AssignDriverDto) {
    return this.deliveryService.assignDriver(orderId, dto.driverId);
  }

  @Patch('drivers/:driverId/location')
  @ApiOperation({ summary: "Update a driver's current GPS location" })
  updateDriverLocation(
    @Param('driverId') driverId: string,
    @Body() dto: UpdateDriverLocationDto,
  ) {
    return this.deliveryService.updateDriverLocation(driverId, dto.lat, dto.lng);
  }
}
