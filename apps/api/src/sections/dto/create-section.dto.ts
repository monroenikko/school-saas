import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateSectionDto {
  @ApiProperty({ description: 'Section name (e.g. Rizal, Bonifacio, Diamond)', example: 'Rizal' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @ApiProperty({ description: 'Grade level (e.g. Grade 7, Grade 10, Grade 12)', example: 'Grade 7' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  gradeLevel: string;

  @ApiPropertyOptional({ description: 'Assigned classroom or building', example: 'Room 204' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  room?: string;

  @ApiPropertyOptional({ description: 'Teacher adviser UUID', example: 'teacher-uuid-1' })
  @IsOptional()
  @IsString()
  adviserId?: string;

  @ApiPropertyOptional({ description: 'Academic Year UUID (defaults to current active academic year)' })
  @IsOptional()
  @IsString()
  academicYearId?: string;

  @ApiPropertyOptional({ description: 'Term UUID (optional)' })
  @IsOptional()
  @IsString()
  termId?: string;
}
