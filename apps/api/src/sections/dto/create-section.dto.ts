import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MaxLength, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateSectionDto {
  @ApiProperty({ description: 'Section name (e.g. Rizal, Bonifacio, Diamond, STEM-A)', example: 'Rizal' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @ApiProperty({ description: 'Grade level (e.g. Grade 7, Grade 10, Grade 12)', example: 'Grade 7' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  gradeLevel: string;

  @ApiPropertyOptional({ description: 'Senior High Track (for Grade 11/12)', example: 'Academic' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  track?: string;

  @ApiPropertyOptional({ description: 'Senior High Strand (for Grade 11/12)', example: 'STEM' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  strand?: string;

  @ApiPropertyOptional({ description: 'Assigned classroom or building', example: 'Room 204' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  room?: string;

  @ApiPropertyOptional({ description: 'Target student capacity', example: 40, default: 40 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  capacity?: number;

  @ApiPropertyOptional({ description: 'Teacher adviser UUID', example: 'teacher-uuid-1' })
  @IsOptional()
  @IsString()
  adviserId?: string;

  @ApiPropertyOptional({ description: 'Academic Year UUID (defaults to current active academic year)' })
  @IsOptional()
  @IsString()
  academicYearId?: string;

  @ApiPropertyOptional({ description: 'School Year Name (e.g. 2026-2027)', example: '2026-2027' })
  @IsOptional()
  @IsString()
  schoolYear?: string;

  @ApiPropertyOptional({ description: 'Term UUID (optional)' })
  @IsOptional()
  @IsString()
  termId?: string;
}

