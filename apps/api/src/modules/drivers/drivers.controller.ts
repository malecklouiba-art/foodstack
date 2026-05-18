import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { DriversService } from './drivers.service';
import { CreateDriverDto } from './dto/create-driver.dto';
import { UpdateLocationDto } from './dto/update-location.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('drivers')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('drivers')
export class DriversController {
  constructor(private readonly driversService: DriversService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get own driver profile' })
  getMe(@Request() req: any) {
    return this.driversService.findByUserId(req.user.id);
  }

  @Patch('me/location')
  @ApiOperation({ summary: 'Update own GPS location' })
  updateMyLocation(@Request() req: any, @Body() dto: UpdateLocationDto) {
    return this.driversService.findByUserId(req.user.id).then((d) =>
      d ? this.driversService.updateLocation(d.id, dto) : null
    );
  }

  @Patch('me/availability')
  @ApiOperation({ summary: 'Toggle own availability' })
  setMyAvailability(@Request() req: any, @Body() body: { available: boolean }) {
    return this.driversService.findByUserId(req.user.id).then((d) =>
      d ? this.driversService.setAvailability(d.id, body.available) : null
    );
  }

  @Patch('me/online')
  @ApiOperation({ summary: 'Toggle own online status' })
  setMyOnline(@Request() req: any, @Body() body: { online: boolean }) {
    return this.driversService.findByUserId(req.user.id).then((d) =>
      d ? this.driversService.setOnline(d.id, body.online) : null
    );
  }

  @Get()
  @ApiOperation({ summary: 'List all drivers for a restaurant' })
  @ApiQuery({ name: 'restaurantId', type: String })
  findAll(@Query('restaurantId') restaurantId: string) {
    return this.driversService.findAll(restaurantId);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new driver' })
  create(@Body() dto: CreateDriverDto) {
    return this.driversService.create(dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a driver by id' })
  findOne(@Param('id') id: string) {
    return this.driversService.findOne(id);
  }

  @Patch(':id/location')
  @ApiOperation({ summary: 'Update driver GPS location' })
  updateLocation(@Param('id') id: string, @Body() dto: UpdateLocationDto) {
    return this.driversService.updateLocation(id, dto);
  }

  @Patch(':id/availability')
  @ApiOperation({ summary: 'Toggle driver availability' })
  setAvailability(@Param('id') id: string, @Body() body: { available: boolean }) {
    return this.driversService.setAvailability(id, body.available);
  }

  @Patch(':id/online')
  @ApiOperation({ summary: 'Toggle driver online status' })
  setOnline(@Param('id') id: string, @Body() body: { online: boolean }) {
    return this.driversService.setOnline(id, body.online);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remove a driver' })
  remove(@Param('id') id: string) {
    return this.driversService.remove(id);
  }
}
