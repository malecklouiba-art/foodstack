import { Controller, Get, Post, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { LoyaltyService } from './loyalty.service';
import { AddPointsDto } from './dto/add-points.dto';
import { RedeemPointsDto } from './dto/redeem-points.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('loyalty')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('loyalty')
export class LoyaltyController {
  constructor(private loyaltyService: LoyaltyService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get my loyalty points and tier' })
  getMyPoints(@Request() req: any) {
    return this.loyaltyService.getPoints(req.user.id);
  }

  @Get('me/history')
  @ApiOperation({ summary: 'Get my loyalty transaction history' })
  getMyHistory(@Request() req: any) {
    return this.loyaltyService.getTransactionHistory(req.user.id);
  }

  @Get(':userId/points')
  @UseGuards(RolesGuard)
  @Roles('super_admin', 'restaurant_owner', 'staff')
  @ApiOperation({ summary: 'Get loyalty points for a user (admin only)' })
  getPoints(@Param('userId') userId: string) {
    return this.loyaltyService.getPoints(userId);
  }

  @Post(':userId/add')
  @UseGuards(RolesGuard)
  @Roles('super_admin', 'restaurant_owner', 'staff')
  @ApiOperation({ summary: 'Add loyalty points to a user (admin only)' })
  addPoints(@Param('userId') userId: string, @Body() dto: AddPointsDto) {
    return this.loyaltyService.addPoints(userId, dto.points, dto.reason ?? 'Manual adjustment');
  }

  @Post(':userId/redeem')
  @ApiOperation({ summary: 'Redeem loyalty points' })
  redeemPoints(@Param('userId') userId: string, @Body() dto: RedeemPointsDto) {
    return this.loyaltyService.redeemPoints(userId, dto.points);
  }
}
