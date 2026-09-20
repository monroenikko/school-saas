import { IsString, IsNotEmpty, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SendBroadcastDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  title: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  content: string;

  @ApiPropertyOptional({ default: 'ALL', enum: ['ALL', 'PARENTS', 'TEACHERS', 'STUDENTS'] })
  @IsOptional()
  @IsString()
  audience?: string = 'ALL';

  @ApiPropertyOptional({ default: 'STANDARD', enum: ['STANDARD', 'URGENT'] })
  @IsOptional()
  @IsEnum(['STANDARD', 'URGENT'])
  priority?: string = 'STANDARD';
}
