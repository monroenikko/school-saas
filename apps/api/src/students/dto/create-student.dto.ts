import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsEmail,
  IsDateString,
  MaxLength,
} from 'class-validator';
import { Gender, StudentStatus } from '@school-saas/shared';

export class CreateStudentDto {
  @ApiProperty({
    description: 'Unique Student ID or DepEd Learner Reference Number (LRN)',
    example: '2026-0001',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  studentId: string;

  @ApiProperty({ description: "Student's legal first name", example: 'Juan' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  firstName: string;

  @ApiProperty({ description: "Student's legal last name", example: 'Dela Cruz' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  lastName: string;

  @ApiPropertyOptional({ description: "Student's middle name", example: 'Protacio' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  middleName?: string;

  @ApiPropertyOptional({ enum: Gender, example: Gender.MALE })
  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender;

  @ApiPropertyOptional({
    description: 'Birth date in ISO format (YYYY-MM-DD)',
    example: '2012-05-14',
  })
  @IsOptional()
  @IsDateString()
  birthDate?: string;

  @ApiPropertyOptional({
    description: 'Physical RFID Badge Card UID (hexadecimal)',
    example: 'E28068940000501234A1B2C1',
  })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  rfidCardUid?: string;

  @ApiPropertyOptional({ enum: StudentStatus, default: StudentStatus.ACTIVE })
  @IsOptional()
  @IsEnum(StudentStatus)
  status?: StudentStatus;

  @ApiPropertyOptional({ description: 'Primary guardian full name', example: 'Juan Dela Cruz Sr.' })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  guardianName?: string;

  @ApiPropertyOptional({ description: 'Guardian primary email', example: 'parent.delacruz@gmail.com' })
  @IsOptional()
  @IsEmail()
  guardianEmail?: string;

  @ApiPropertyOptional({ description: 'Guardian contact number / mobile phone', example: '09171234567' })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  guardianPhone?: string;

  @ApiPropertyOptional({ description: 'Alternative emergency contact phone or name', example: '09189876543' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  emergencyContact?: string;

  @ApiPropertyOptional({
    description: 'Section ID to immediately assign student into',
    example: 'section-uuid-1',
  })
  @IsOptional()
  @IsString()
  sectionId?: string;
}
