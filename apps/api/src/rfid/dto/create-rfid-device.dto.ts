import { IsString, IsNotEmpty, IsOptional, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateRfidDeviceDto {
  @ApiProperty({
    example: 'GATE-01',
    description: 'Unique device identifier within the school',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  deviceId: string;

  @ApiProperty({
    example: 'Main Entrance Turnstile 1',
    description: 'Friendly name of the RFID device',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @ApiPropertyOptional({
    example: 'Gate A - Senior High School Wing',
    description: 'Physical location of the device',
  })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  location?: string;
}
