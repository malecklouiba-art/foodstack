import { PartialType } from '@nestjs/mapped-types';
import { IsOptional, IsString, IsIn } from 'class-validator';
import { CreateTableDto } from './create-table.dto';

export class UpdateTableDto extends PartialType(CreateTableDto) {
  @IsOptional()
  @IsString()
  @IsIn(['free', 'occupied', 'reserved', 'cleaning'])
  override status?: string;
}
