import { IsString, IsOptional, IsEnum, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { DeviceStatus } from '@school-saas/shared';

export class UpdateRfidDeviceDto {
  @ApiPropertyOptional({
    example: 'Main Entrance Turnstile 1 - Updated',
    description: 'Friendly name of the RFID device',
  })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({
    example: 'Gate B - North Wing',
    description: 'Physical location of the device',
  })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  location?: string;

  @ApiPropertyOptional({
    enum: DeviceStatus,
    example: DeviceStatus.ACTIVE,
    description: 'Device operational status',
  })
  @IsEnum(DeviceStatus)
  @IsOptional()
  status?: DeviceStatus;
}
