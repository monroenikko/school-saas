import { ApiProperty } from '@nestjs/swagger';
import { ArrayNotEmpty, IsArray, IsString } from 'class-validator';

export class AssignStudentsDto {
  @ApiProperty({
    description: 'Array of student UUIDs to enroll into this section',
    example: ['student-uuid-1', 'student-uuid-2'],
  })
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  studentIds: string[];
}
