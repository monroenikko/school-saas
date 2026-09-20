import { IsString, IsNotEmpty, IsOptional, IsEnum, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ScanType } from '@school-saas/shared';

export class RfidTapEventDto {
  @ApiProperty({
    example: 'E2000019',
    description: 'RFID Card UID scanned from turnstile',
  })
  @IsString()
  @IsNotEmpty()
  cardUid: string;

  @ApiProperty({
    example: 'GATE-01',
    description: 'Device ID that read the scan',
  })
  @IsString()
  @IsNotEmpty()
  deviceId: string;

  @ApiPropertyOptional({
    enum: ScanType,
    example: ScanType.TIME_IN,
    description: 'Explicit scan direction if device is configured for uni-directional lane',
  })
  @IsEnum(ScanType)
  @IsOptional()
  scanType?: ScanType;

  @ApiPropertyOptional({
    example: '2026-09-20T07:45:00.000Z',
    description: 'ISO timestamp from device clock',
  })
  @IsDateString()
  @IsOptional()
  scannedAt?: string;
}
