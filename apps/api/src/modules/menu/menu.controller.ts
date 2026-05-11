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
import { MenuService } from './menu.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { CreateMenuItemDto } from './dto/create-menu-item.dto';
import { UpdateMenuItemDto } from './dto/update-menu-item.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('menu')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('menu')
export class MenuController {
  constructor(private readonly menuService: MenuService) {}

  @Get()
  @ApiOperation({ summary: 'Get full menu for a restaurant' })
  @ApiQuery({ name: 'restaurantId', type: String })
  getMenu(@Query('restaurantId') restaurantId: string) {
    return this.menuService.getMenu(restaurantId);
  }

  @Post('categories')
  @ApiOperation({ summary: 'Create a menu category' })
  createCategory(@Body() dto: CreateCategoryDto) {
    return this.menuService.createCategory(dto);
  }

  @Patch('categories/:id')
  @ApiOperation({ summary: 'Update a menu category' })
  updateCategory(@Param('id') id: string, @Body() dto: UpdateCategoryDto) {
    return this.menuService.updateCategory(id, dto);
  }

  @Delete('categories/:id')
  @ApiOperation({ summary: 'Delete a menu category' })
  deleteCategory(@Param('id') id: string) {
    return this.menuService.deleteCategory(id);
  }

  @Post('items')
  @ApiOperation({ summary: 'Create a menu item' })
  createItem(@Body() dto: CreateMenuItemDto) {
    return this.menuService.createItem(dto);
  }

  @Patch('items/:id')
  @ApiOperation({ summary: 'Update a menu item' })
  updateItem(@Param('id') id: string, @Body() dto: UpdateMenuItemDto) {
    return this.menuService.updateItem(id, dto);
  }

  @Delete('items/:id')
  @ApiOperation({ summary: 'Delete a menu item' })
  deleteItem(@Param('id') id: string) {
    return this.menuService.deleteItem(id);
  }

  @Patch('items/:id/toggle-availability')
  @ApiOperation({ summary: 'Toggle availability of a menu item' })
  toggleItemAvailability(@Param('id') id: string) {
    return this.menuService.toggleItemAvailability(id);
  }
}
