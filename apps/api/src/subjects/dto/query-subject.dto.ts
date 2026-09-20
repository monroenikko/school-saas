import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class QuerySubjectDto {
  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 50, minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 50;

  @ApiPropertyOptional({ description: 'Search subject code or name' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Filter by grade level' })
  @IsOptional()
  @IsString()
  gradeLevel?: string;
}

export class QuerySubjectClassDto {
  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 20, minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @ApiPropertyOptional({ description: 'Search class code, subject name, or teacher name' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Filter by subject UUID' })
  @IsOptional()
  @IsString()
  subjectId?: string;

  @ApiPropertyOptional({ description: 'Filter by teacher / faculty UUID' })
  @IsOptional()
  @IsString()
  teacherId?: string;

  @ApiPropertyOptional({ description: 'Filter by section UUID' })
  @IsOptional()
  @IsString()
  sectionId?: string;

  @ApiPropertyOptional({ description: 'Filter by academic term UUID' })
  @IsOptional()
  @IsString()
  termId?: string;

  @ApiPropertyOptional({ description: 'Filter by academic year UUID' })
  @IsOptional()
  @IsString()
  academicYearId?: string;
}
