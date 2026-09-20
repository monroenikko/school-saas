import { IsString, IsOptional, IsEnum } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Role, UserStatus } from '@school-saas/shared';

export class UpdateUserDto {
  @ApiPropertyOptional({
    example: 'Maria Teresa',
    description: 'First name',
  })
  @IsString()
  @IsOptional()
  firstName?: string;

  @ApiPropertyOptional({
    example: 'Santos',
    description: 'Last name',
  })
  @IsString()
  @IsOptional()
  lastName?: string;

  @ApiPropertyOptional({
    enum: [Role.SCHOOL_ADMIN, Role.STAFF, Role.TEACHER],
    example: Role.STAFF,
    description: 'Assigned role',
  })
  @IsEnum(Role)
  @IsOptional()
  role?: Role;

  @ApiPropertyOptional({
    enum: UserStatus,
    example: UserStatus.ACTIVE,
    description: 'Account activation status',
  })
  @IsEnum(UserStatus)
  @IsOptional()
  status?: UserStatus;
}
