import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { GradingPeriod } from '@school-saas/shared';

export class QueryGradesMatrixDto {
  @ApiPropertyOptional({ description: 'Filter by term UUID' })
  @IsOptional()
  @IsString()
  termId?: string;

  @ApiPropertyOptional({ enum: GradingPeriod, description: 'Filter by grading period' })
  @IsOptional()
  @IsEnum(GradingPeriod)
  period?: GradingPeriod;
}
