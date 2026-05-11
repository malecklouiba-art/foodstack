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
import { InventoryService } from './inventory.service';
import { CreateInventoryItemDto } from './dto/create-inventory-item.dto';
import { UpdateInventoryItemDto } from './dto/update-inventory-item.dto';
import { AdjustStockDto } from './dto/adjust-stock.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('inventory')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get()
  @ApiOperation({ summary: 'Get all inventory items for a restaurant' })
  @ApiQuery({ name: 'restaurantId', type: String })
  findAll(@Query('restaurantId') restaurantId: string) {
    return this.inventoryService.findAll(restaurantId);
  }

  @Get('low-stock')
  @ApiOperation({ summary: 'Get low-stock alerts for a restaurant' })
  @ApiQuery({ name: 'restaurantId', type: String })
  getLowStockAlerts(@Query('restaurantId') restaurantId: string) {
    return this.inventoryService.getLowStockAlerts(restaurantId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single inventory item by ID' })
  findOne(@Param('id') id: string) {
    return this.inventoryService.findById(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new inventory item' })
  createItem(@Body() dto: CreateInventoryItemDto) {
    return this.inventoryService.createItem(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an inventory item' })
  updateItem(@Param('id') id: string, @Body() dto: UpdateInventoryItemDto) {
    return this.inventoryService.updateItem(id, dto);
  }

  @Patch(':id/adjust-stock')
  @ApiOperation({ summary: 'Adjust stock quantity for an inventory item' })
  adjustStock(@Param('id') id: string, @Body() dto: AdjustStockDto) {
    return this.inventoryService.adjustStock(id, dto.quantity, dto.reason);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an inventory item' })
  removeItem(@Param('id') id: string) {
    return this.inventoryService.removeItem(id);
  }
}
