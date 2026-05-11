import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AssignDriverDto {
  @ApiProperty({ description: 'ID of the driver to assign' })
  @IsString()
  driverId: string;
}
