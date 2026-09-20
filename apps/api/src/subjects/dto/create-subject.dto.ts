import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class CreateSubjectDto {
  @ApiProperty({ description: 'Subject code (e.g. MATH7, SCI10, ENG8)', example: 'MATH7' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(30)
  code: string;

  @ApiProperty({ description: 'Full subject title', example: 'General Mathematics 7' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  name: string;

  @ApiPropertyOptional({ description: 'Course description / curriculum overview' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Academic credits or units', example: 3.0, default: 3.0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  credits?: number;

  @ApiPropertyOptional({ description: 'Applicable grade level (e.g. Grade 7)', example: 'Grade 7' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  gradeLevel?: string;
}
