import { IsString, IsNotEmpty, IsEnum, IsOptional, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AttendanceStatus } from '@school-saas/shared';

export class ManualAttendanceDto {
  @ApiProperty({
    example: 'stud-uuid-here',
    description: 'Student UUID to log attendance for',
  })
  @IsString()
  @IsNotEmpty()
  studentId: string;

  @ApiProperty({
    example: '2026-09-20',
    description: 'Attendance date (YYYY-MM-DD)',
  })
  @IsString()
  @IsNotEmpty()
  date: string;

  @ApiProperty({
    enum: AttendanceStatus,
    example: AttendanceStatus.PRESENT,
    description: 'Attendance status (PRESENT, LATE, ABSENT, EXCUSED, HALF_DAY)',
  })
  @IsEnum(AttendanceStatus)
  @IsNotEmpty()
  status: AttendanceStatus;

  @ApiPropertyOptional({
    example: '2026-09-20T07:45:00.000Z',
    description: 'Manual Clock-in time',
  })
  @IsDateString()
  @IsOptional()
  timeIn?: string;

  @ApiPropertyOptional({
    example: '2026-09-20T16:30:00.000Z',
    description: 'Manual Clock-out time',
  })
  @IsDateString()
  @IsOptional()
  timeOut?: string;

  @ApiPropertyOptional({
    example: 'Excused due to medical clinic appointment',
    description: 'Administrative notes/remarks',
  })
  @IsString()
  @IsOptional()
  remarks?: string;
}
