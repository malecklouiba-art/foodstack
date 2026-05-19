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
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // ─── Current user (self) ─────────────────────────────────────────────────

  @Get('me')
  @ApiOperation({ summary: 'Get own profile' })
  getMe(@Request() req: any) {
    return this.usersService.getProfile(req.user.id);
  }

  @Patch('me')
  @ApiOperation({ summary: 'Update own profile' })
  updateMe(@Request() req: any, @Body() dto: UpdateUserDto) {
    return this.usersService.update(req.user.id, dto);
  }

  @Get('me/addresses')
  @ApiOperation({ summary: 'Get own saved addresses' })
  getAddresses(@Request() req: any) {
    return this.usersService.getAddresses(req.user.id);
  }

  @Post('me/addresses')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Add a saved address' })
  addAddress(
    @Request() req: any,
    @Body() body: { label: string; address?: string; street?: string; city?: string; postalCode?: string; isDefault?: boolean },
  ) {
    const street = body.street ?? body.address ?? '';
    const city = body.city ?? '';
    const postalCode = body.postalCode ?? '';
    return this.usersService.addAddress(req.user.id, { label: body.label, street, city, postalCode, isDefault: body.isDefault });
  }

  @Patch('me/addresses/:addressId')
  @ApiOperation({ summary: 'Update a saved address' })
  updateAddress(
    @Request() req: any,
    @Param('addressId') addressId: string,
    @Body() body: { label?: string; address?: string; street?: string; city?: string; postalCode?: string; isDefault?: boolean; deleted?: boolean },
  ) {
    const { address, ...rest } = body;
    const updateBody = address ? { ...rest, street: address } : rest;
    return this.usersService.updateAddress(req.user.id, addressId, updateBody);
  }

  @Delete('me/addresses/:addressId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a saved address' })
  deleteAddress(@Request() req: any, @Param('addressId') addressId: string) {
    return this.usersService.deleteAddress(req.user.id, addressId);
  }

  // ─── Favorites ────────────────────────────────────────────────────────────

  @Get('favorites')
  @ApiOperation({ summary: 'Get own favourite restaurants' })
  getFavorites(@Request() req: any) {
    return this.usersService.getFavorites(req.user.id);
  }

  @Post('favorites/:restaurantId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Add a restaurant to favourites' })
  addFavorite(@Request() req: any, @Param('restaurantId') restaurantId: string) {
    return this.usersService.addFavorite(req.user.id, restaurantId);
  }

  @Delete('favorites/:restaurantId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Remove a restaurant from favourites' })
  removeFavorite(@Request() req: any, @Param('restaurantId') restaurantId: string) {
    return this.usersService.removeFavorite(req.user.id, restaurantId);
  }

  // ─── Admin endpoints ─────────────────────────────────────────────────────

  @Get('customers')
  @ApiOperation({ summary: 'Get all customers with order stats' })
  findCustomers(@Query('restaurantId') restaurantId?: string) {
    return this.usersService.findCustomers(restaurantId);
  }

  @Get('staff')
  @ApiOperation({ summary: 'Get all staff members' })
  findStaff() {
    return this.usersService.findStaff();
  }

  @Get()
  @ApiOperation({ summary: 'Get all users' })
  findAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID' })
  findOne(@Param('id') id: string) {
    return this.usersService.findById(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update user by ID' })
  update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.usersService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete user by ID' })
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }
}
