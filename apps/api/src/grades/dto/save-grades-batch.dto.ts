import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { GradingPeriod } from '@school-saas/shared';

export class GradeEntryDto {
  @ApiProperty({ description: 'Student UUID', example: 'student-uuid-1' })
  @IsString()
  @IsNotEmpty()
  studentId: string;

  @ApiProperty({ description: 'Grade score (0 to 100, up to 2 decimal places)', example: 88.5 })
  @IsNumber()
  @Min(0)
  @Max(100)
  score: number;

  @ApiPropertyOptional({ description: 'Custom teacher remarks', example: 'Very Satisfactory' })
  @IsOptional()
  @IsString()
  remarks?: string;
}

export class SaveGradesBatchDto {
  @ApiProperty({
    enum: GradingPeriod,
    description: 'Academic grading period (Q1-Q4 for K-12 DepEd, or PRELIM-FINALS)',
    example: GradingPeriod.Q1,
  })
  @IsEnum(GradingPeriod)
  period: GradingPeriod;

  @ApiPropertyOptional({ description: 'Optional Academic Term UUID', example: 'term-uuid-1' })
  @IsOptional()
  @IsString()
  termId?: string;

  @ApiProperty({
    description: 'Array of student grade entries to save or update',
    type: [GradeEntryDto],
  })
  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => GradeEntryDto)
  grades: GradeEntryDto[];

  @ApiPropertyOptional({
    description: 'Whether to publish grades immediately for student/parent view',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;
}
