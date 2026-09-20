import { IsString, IsNotEmpty, IsOptional, IsEnum, IsNumber, Min, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaymentMethod } from '@school-saas/shared';
import { Type } from 'class-transformer';

export class RecordPaymentDto {
  @ApiProperty({
    enum: PaymentMethod,
    example: PaymentMethod.GCASH,
    description: 'Payment method utilized by payor',
  })
  @IsEnum(PaymentMethod)
  @IsNotEmpty()
  paymentMethod: PaymentMethod;

  @ApiPropertyOptional({
    example: 7500.0,
    description: 'Amount paid (defaults to full invoice amount if omitted)',
  })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  @IsOptional()
  amountPaid?: number;

  @ApiPropertyOptional({
    example: '2026-09-20T10:30:00.000Z',
    description: 'Timestamp when payment was received (defaults to now)',
  })
  @IsDateString()
  @IsOptional()
  paidAt?: string;

  @ApiPropertyOptional({
    example: 'OR-2026-0042',
    description: 'Official Receipt (OR) Number or transaction reference from payment provider',
  })
  @IsString()
  @IsOptional()
  receiptNumber?: string;

  @ApiPropertyOptional({
    example: 'https://storage.schoolsaas.com/receipts/OR-2026-0042.pdf',
    description: 'Receipt document URL or uploaded proof',
  })
  @IsString()
  @IsOptional()
  receiptUrl?: string;

  @ApiPropertyOptional({
    example: 'Cashier Window 2 - Confirmed by Cashier Maria',
    description: 'Audit remarks or notes',
  })
  @IsString()
  @IsOptional()
  remarks?: string;
}
