import { IsString, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class TwoFactorVerifyDto {
  @ApiProperty({ description: '6-digit TOTP code' })
  @IsString()
  @Length(6, 6)
  token: string;
}
