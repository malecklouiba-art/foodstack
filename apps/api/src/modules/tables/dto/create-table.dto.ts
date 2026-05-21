import { IsString, IsInt, IsOptional, IsIn, Min } from 'class-validator';

export class CreateTableDto {
  @IsInt()
  @Min(1)
  number!: number;

  @IsInt()
  @Min(1)
  capacity!: number;

  @IsOptional()
  @IsString()
  section?: string;

  @IsOptional()
  @IsString()
  @IsIn(['free', 'occupied', 'reserved', 'cleaning'])
  status?: string;

  @IsOptional()
  @IsString()
  qrCode?: string;
}
