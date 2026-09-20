import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { DayOfWeek } from '@school-saas/shared';

export class ScheduleSlotDto {
  @ApiProperty({ enum: DayOfWeek, example: DayOfWeek.MONDAY })
  @IsEnum(DayOfWeek)
  dayOfWeek: DayOfWeek;

  @ApiProperty({ description: 'Start time in 24h format (HH:mm)', example: '08:00' })
  @IsString()
  @IsNotEmpty()
  startTime: string;

  @ApiProperty({ description: 'End time in 24h format (HH:mm)', example: '09:30' })
  @IsString()
  @IsNotEmpty()
  endTime: string;

  @ApiPropertyOptional({ description: 'Specific room for this time slot', example: 'Room 201' })
  @IsOptional()
  @IsString()
  room?: string;
}

export class CreateSubjectClassDto {
  @ApiProperty({ description: 'Master subject UUID', example: 'subject-uuid-1' })
  @IsString()
  @IsNotEmpty()
  subjectId: string;

  @ApiProperty({
    description: 'Unique class offering code (e.g. MATH7-SEC-A)',
    example: 'MATH7-SEC-A',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(60)
  classCode: string;

  @ApiPropertyOptional({ description: 'Assigned faculty / teacher UUID', example: 'teacher-uuid-1' })
  @IsOptional()
  @IsString()
  teacherId?: string;

  @ApiPropertyOptional({ description: 'Target section UUID', example: 'section-uuid-1' })
  @IsOptional()
  @IsString()
  sectionId?: string;

  @ApiPropertyOptional({ description: 'Default classroom / laboratory', example: 'Science Lab' })
  @IsOptional()
  @IsString()
  room?: string;

  @ApiPropertyOptional({ description: 'Class student capacity', example: 45, default: 45 })
  @IsOptional()
  @IsInt()
  @Min(1)
  capacity?: number;

  @ApiPropertyOptional({ description: 'Academic year UUID' })
  @IsOptional()
  @IsString()
  academicYearId?: string;

  @ApiProperty({
    description: 'Multiple select academic terms (e.g. 1st Semester, 2nd Semester)',
    example: ['term-uuid-1', 'term-uuid-2'],
  })
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  termIds: string[];

  @ApiPropertyOptional({
    description: 'Multiple recurring weekly schedule slots',
    type: [ScheduleSlotDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ScheduleSlotDto)
  schedules?: ScheduleSlotDto[];
}
