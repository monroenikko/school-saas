import { IsEmail, IsNotEmpty, IsOptional, IsString, Matches, MinLength } from 'class-validator';

export class RegisterSchoolDto {
  @IsString()
  @IsNotEmpty({ message: 'School name is required' })
  @MinLength(3, { message: 'School name must be at least 3 characters' })
  schoolName!: string;

  @IsString()
  @IsNotEmpty({ message: 'School URL slug is required' })
  @Matches(/^[a-z0-9-]+$/, {
    message: 'Slug can only contain lowercase letters, numbers, and hyphens',
  })
  schoolSlug!: string;

  @IsString()
  @IsNotEmpty({ message: 'Admin first name is required' })
  adminFirstName!: string;

  @IsString()
  @IsNotEmpty({ message: 'Admin last name is required' })
  adminLastName!: string;

  @IsEmail({}, { message: 'Please provide a valid administrator email' })
  adminEmail!: string;

  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters' })
  @Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
    message: 'Password must contain uppercase, lowercase, and numbers/symbols',
  })
  adminPassword!: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  address?: string;
}
