import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { RestaurantsService } from './restaurants.service';
import { CreateRestaurantDto } from './dto/create-restaurant.dto';
import { UpdateRestaurantDto } from './dto/update-restaurant.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('restaurants')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('restaurants')
export class RestaurantsController {
  constructor(private readonly restaurantsService: RestaurantsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all restaurants' })
  findAll() {
    return this.restaurantsService.findAll();
  }

  @Get('nearby')
  @ApiOperation({ summary: 'Find restaurants near a location' })
  @ApiQuery({ name: 'lat', type: Number })
  @ApiQuery({ name: 'lng', type: Number })
  @ApiQuery({ name: 'radius', type: Number, required: false })
  findNearby(
    @Query('lat') lat: number,
    @Query('lng') lng: number,
    @Query('radius') radius: number = 10,
  ) {
    return this.restaurantsService.findNearby(+lat, +lng, +radius);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get restaurant by ID' })
  findOne(@Param('id') id: string) {
    return this.restaurantsService.findById(id);
  }

  @Post()
  @Roles('restaurant_owner', 'super_admin')
  @ApiOperation({ summary: 'Create a new restaurant' })
  create(@Body() dto: CreateRestaurantDto) {
    return this.restaurantsService.create(dto);
  }

  @Patch(':id')
  @Roles('restaurant_owner', 'super_admin')
  @ApiOperation({ summary: 'Update a restaurant' })
  update(@Param('id') id: string, @Body() dto: UpdateRestaurantDto) {
    return this.restaurantsService.update(id, dto);
  }

  @Delete(':id')
  @Roles('restaurant_owner', 'super_admin')
  @ApiOperation({ summary: 'Delete a restaurant' })
  remove(@Param('id') id: string) {
    return this.restaurantsService.remove(id);
  }

  @Patch(':id/toggle-open')
  @Roles('restaurant_owner', 'super_admin')
  @ApiOperation({ summary: 'Toggle the open/closed status of a restaurant' })
  toggleOpen(@Param('id') id: string) {
    return this.restaurantsService.toggleOpen(id);
  }
}
