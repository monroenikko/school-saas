import { IsString, IsOptional, IsEnum, IsBoolean, IsNumber } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export enum CardOrientation {
  PORTRAIT = 'PORTRAIT',
  LANDSCAPE = 'LANDSCAPE',
}

export class CreateIdCardTemplateDto {
  @ApiProperty({ description: 'Template Name', example: 'Modern Emerald CR80' })
  @IsString()
  name!: string;

  @ApiPropertyOptional({ enum: CardOrientation, default: CardOrientation.PORTRAIT })
  @IsOptional()
  @IsEnum(CardOrientation)
  orientation?: CardOrientation = CardOrientation.PORTRAIT;

  @ApiPropertyOptional({ description: 'Primary Accent Color (HEX)', default: '#059669' })
  @IsOptional()
  @IsString()
  accentColor?: string = '#059669';

  @ApiPropertyOptional({ description: 'Header Background Color (HEX)', default: '#064e3b' })
  @IsOptional()
  @IsString()
  headerColor?: string = '#064e3b';

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  showQrCode?: boolean = true;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  showBarcode?: boolean = true;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  showRfidUid?: boolean = true;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  showGuardianInfo?: boolean = true;

  @ApiPropertyOptional({ default: 5 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  safeMarginPercent?: number = 5;
}

export class BatchBadgeQueryDto {
  @ApiPropertyOptional({ description: 'Filter by Section UUID' })
  @IsOptional()
  @IsString()
  sectionId?: string;
}
