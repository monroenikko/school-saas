import { IsString, IsNotEmpty, IsEmail, MinLength, IsEnum, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Role } from '@school-saas/shared';

export class CreateUserDto {
  @ApiProperty({
    example: 'cashier.santos@stjude.edu.ph',
    description: 'Unique email address for staff login',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    example: 'Password123!',
    description: 'Initial login password (min 8 characters)',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  password: string;

  @ApiProperty({
    example: 'Maria',
    description: 'First name',
  })
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty({
    example: 'Santos',
    description: 'Last name',
  })
  @IsString()
  @IsNotEmpty()
  lastName: string;

  @ApiProperty({
    enum: [Role.SCHOOL_ADMIN, Role.STAFF, Role.TEACHER],
    example: Role.STAFF,
    description: 'Staff account role',
  })
  @IsEnum(Role)
  @IsNotEmpty()
  role: Role;

  @ApiPropertyOptional({
    example: '09171234567',
    description: 'Contact phone number',
  })
  @IsString()
  @IsOptional()
  phone?: string;
}
