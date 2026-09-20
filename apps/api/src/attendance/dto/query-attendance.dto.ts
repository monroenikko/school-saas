import { IsOptional, IsString, IsEnum, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { AttendanceStatus } from '@school-saas/shared';

export class QueryAttendanceDto {
  @ApiPropertyOptional({
    example: '2026-09-20',
    description: 'Date to query (YYYY-MM-DD), defaults to today',
  })
  @IsString()
  @IsOptional()
  date?: string;

  @ApiPropertyOptional({
    description: 'Filter by section UUID',
  })
  @IsString()
  @IsOptional()
  sectionId?: string;

  @ApiPropertyOptional({
    enum: AttendanceStatus,
    description: 'Filter by attendance status',
  })
  @IsEnum(AttendanceStatus)
  @IsOptional()
  status?: AttendanceStatus;

  @ApiPropertyOptional({
    description: 'Search by student name or student LRN ID',
  })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({ default: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number = 1;

  @ApiPropertyOptional({ default: 20 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  limit?: number = 20;

  @ApiPropertyOptional({ description: 'Filter by tenant UUID' })
  @IsOptional()
  @IsString()
  tenantId?: string;
}
