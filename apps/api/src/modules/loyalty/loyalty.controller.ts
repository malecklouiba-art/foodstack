import { Controller, Get, Post, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { LoyaltyService } from './loyalty.service';
import { AddPointsDto } from './dto/add-points.dto';
import { RedeemPointsDto } from './dto/redeem-points.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

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
  @ApiOperation({ summary: 'Get loyalty points for a user (admin only)' })
  getPoints(@Param('userId') userId: string) {
    return this.loyaltyService.getPoints(userId);
  }

  @Post(':userId/add')
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
