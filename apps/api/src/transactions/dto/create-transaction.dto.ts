import { IsString, IsNotEmpty, IsOptional, IsEnum, IsNumber, Min, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TransactionType } from '@school-saas/shared';
import { Type } from 'class-transformer';

export class CreateTransactionDto {
  @ApiPropertyOptional({
    example: '35901d2f-e9cf-4d97-a9be-38659ccecddb',
    description: 'Student UUID for whom fee is assessed',
  })
  @IsString()
  @IsOptional()
  studentId?: string;

  @ApiPropertyOptional({
    example: 'bb00807a-a53a-463a-b05e-f9b12008514e',
    description: 'Parent UUID (optional, can be auto-resolved from student)',
  })
  @IsString()
  @IsOptional()
  parentId?: string;

  @ApiProperty({
    example: '1st Quarter Tuition Fee',
    description: 'Title of the billing fee or invoice item',
  })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiPropertyOptional({
    example: 'Includes tuition, laboratory fees, and energy fee for Q1 AY 2026-2027',
    description: 'Detailed description or breakdown',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    example: 7500.0,
    description: 'Assessment amount in PHP',
  })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  amount: number;

  @ApiProperty({
    enum: TransactionType,
    example: TransactionType.TUITION,
    description: 'Category of fee assessment',
  })
  @IsEnum(TransactionType)
  @IsNotEmpty()
  type: TransactionType;

  @ApiPropertyOptional({
    example: '2026-10-15',
    description: 'Payment due date (YYYY-MM-DD)',
  })
  @IsDateString()
  @IsOptional()
  dueDate?: string;

  @ApiPropertyOptional({
    example: 'Payable via GCash or Cashier window',
    description: 'Additional notes or payment instructions',
  })
  @IsString()
  @IsOptional()
  remarks?: string;
}
