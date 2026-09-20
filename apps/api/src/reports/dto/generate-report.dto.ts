import { IsOptional, IsString, IsNumber } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class GenerateSF1Dto {
  @ApiPropertyOptional({ description: 'Section UUID' })
  @IsOptional()
  @IsString()
  sectionId?: string;
}

export class GenerateSF2Dto {
  @ApiPropertyOptional({ description: 'Section UUID' })
  @IsOptional()
  @IsString()
  sectionId?: string;

  @ApiPropertyOptional({ description: 'Month (1-12)', default: 9 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  month?: number;

  @ApiPropertyOptional({ description: 'Year', default: 2026 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  year?: number;
}

export class GenerateFinancialReportDto {
  @ApiPropertyOptional({ description: 'Start Date (YYYY-MM-DD)' })
  @IsOptional()
  @IsString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'End Date (YYYY-MM-DD)' })
  @IsOptional()
  @IsString()
  endDate?: string;
}

export class ExportCSVDto {
  @ApiPropertyOptional({ description: 'Report Type (SF1, SF2, SF9, FINANCIAL)' })
  @IsString()
  type!: string;

  @ApiPropertyOptional({ description: 'Section UUID' })
  @IsOptional()
  @IsString()
  sectionId?: string;

  @ApiPropertyOptional({ description: 'Student UUID' })
  @IsOptional()
  @IsString()
  studentId?: string;

  @ApiPropertyOptional({ description: 'Month (1-12)' })
  @IsOptional()
  @Type(() => Number)
  month?: number;

  @ApiPropertyOptional({ description: 'Year' })
  @IsOptional()
  @Type(() => Number)
  year?: number;
}
