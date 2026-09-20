import { IsString, IsOptional, IsEmail } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateSchoolSettingsDto {
  @ApiPropertyOptional({
    example: 'St. Jude International Academy',
    description: 'Official school name',
  })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({
    example: '123 Academic Avenue, Quezon City, Metro Manila',
    description: 'Physical campus address',
  })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiPropertyOptional({
    example: '+63 2 8123 4567',
    description: 'School trunkline phone',
  })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional({
    example: 'admissions@stjude.edu.ph',
    description: 'Official administrative email',
  })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({
    example: 'Asia/Manila',
    description: 'System timezone',
  })
  @IsString()
  @IsOptional()
  timezone?: string;

  @ApiPropertyOptional({
    example: 'PHP',
    description: 'Currency code',
  })
  @IsString()
  @IsOptional()
  currency?: string;

  @ApiPropertyOptional({
    example: '08:00',
    description: 'Morning arrival late cutoff time (HH:mm 24-hr format)',
  })
  @IsString()
  @IsOptional()
  lateCutoffTime?: string;
}
