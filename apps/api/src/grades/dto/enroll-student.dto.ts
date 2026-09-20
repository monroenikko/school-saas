import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsOptional, IsString } from 'class-validator';

export class EnrollStudentDto {
  @ApiPropertyOptional({
    description: 'Array of Student UUIDs to enroll into this class offering',
    example: ['student-uuid-1', 'student-uuid-2'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  studentIds?: string[];

  @ApiPropertyOptional({
    description: 'If specified, enrolls all active learners from this Section roster',
    example: 'section-uuid-1',
  })
  @IsOptional()
  @IsString()
  sectionId?: string;
}
