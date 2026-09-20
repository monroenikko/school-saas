import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { TeacherStatus } from '@school-saas/shared';

export class CreateTeacherDto {
  @ApiProperty({
    description: 'Unique Employee / Faculty ID',
    example: 'TCH-2026-001',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  employeeId: string;

  @ApiProperty({ description: "Faculty's legal first name", example: 'Maria' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  firstName: string;

  @ApiProperty({ description: "Faculty's legal last name", example: 'Santos' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  lastName: string;

  @ApiProperty({
    description: 'Institutional or personal email address',
    example: 'msantos@stjude.edu.ph',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiPropertyOptional({ description: 'Contact phone number', example: '09170010001' })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  phone?: string;

  @ApiPropertyOptional({
    description: 'Academic subject specialization / department discipline',
    example: 'Mathematics',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  specialization?: string;

  @ApiPropertyOptional({ enum: TeacherStatus, default: TeacherStatus.ACTIVE })
  @IsOptional()
  @IsEnum(TeacherStatus)
  status?: TeacherStatus;
}
