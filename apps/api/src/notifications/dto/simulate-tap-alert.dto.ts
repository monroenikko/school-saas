import { IsString, IsNotEmpty, IsEnum, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ScanType } from '@school-saas/shared';

export class SimulateTapAlertDto {
  @ApiProperty({ description: 'Student ID to simulate tap for' })
  @IsNotEmpty()
  @IsString()
  studentId: string;

  @ApiPropertyOptional({ enum: ScanType, default: ScanType.TIME_IN })
  @IsOptional()
  @IsEnum(ScanType)
  scanType?: ScanType = ScanType.TIME_IN;

  @ApiPropertyOptional({ description: 'Gate device name for display' })
  @IsOptional()
  @IsString()
  deviceName?: string = 'Main Entrance Gate';
}
