import { IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateDriverLocationDto {
  @ApiProperty({ description: 'Latitude coordinate of the driver' })
  @IsNumber()
  lat: number;

  @ApiProperty({ description: 'Longitude coordinate of the driver' })
  @IsNumber()
  lng: number;
}
