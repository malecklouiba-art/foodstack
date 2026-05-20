import { IsEmail, IsString, MinLength, IsEnum, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ example: 'Jean Dupont' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'jean@exemple.fr' })
  @IsEmail()
  email: string;

  @ApiProperty({ minLength: 8 })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiProperty({ enum: ['customer', 'restaurant_owner', 'driver'], required: false })
  @IsOptional()
  @IsEnum(['customer', 'restaurant_owner', 'driver'])
  role?: 'customer' | 'restaurant_owner' | 'driver';

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  phone?: string;
}
