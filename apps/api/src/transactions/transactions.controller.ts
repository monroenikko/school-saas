import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { TransactionsService } from './transactions.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { RecordPaymentDto } from './dto/record-payment.dto';
import { QueryTransactionsDto } from './dto/query-transactions.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../auth/guards/tenant.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';

@ApiTags('Transactions & Parent Billing')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
@Controller('transactions')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Get('stats')
  @Permissions('transactions:read')
  @ApiOperation({ summary: 'Get financial summary statistics (collected, receivables, rate)' })
  @ApiResponse({ status: 200, description: 'Summary statistics returned' })
  async getStats(@Req() req: any) {
    const stats = await this.transactionsService.getTransactionStats(req.tenantId);
    return {
      success: true,
      data: stats,
    };
  }

  @Get()
  @Permissions('transactions:read')
  @ApiOperation({ summary: 'Get filterable and paginated parent billing transactions' })
  @ApiResponse({ status: 200, description: 'List of fee invoices' })
  async getTransactions(@Req() req: any, @Query() query: QueryTransactionsDto) {
    const result = await this.transactionsService.getTransactions(req.tenantId, query);
    return {
      success: true,
      data: result.data,
      meta: result.meta,
    };
  }

  @Get(':id')
  @Permissions('transactions:read')
  @ApiOperation({ summary: 'Get single transaction invoice detail for receipt printing' })
  @ApiParam({ name: 'id', description: 'Transaction UUID' })
  @ApiResponse({ status: 200, description: 'Invoice detail returned' })
  async getTransactionById(@Req() req: any, @Param('id') id: string) {
    const result = await this.transactionsService.getTransactionById(req.tenantId, id);
    return {
      success: true,
      data: result,
    };
  }

  @Post()
  @Permissions('transactions:manage')
  @ApiOperation({ summary: 'Issue a new fee assessment or tuition invoice' })
  @ApiResponse({ status: 201, description: 'Invoice created successfully' })
  async createTransaction(@Req() req: any, @Body() dto: CreateTransactionDto) {
    return this.transactionsService.createTransaction(req.tenantId, dto);
  }

  @Post(':id/pay')
  @Permissions('transactions:manage')
  @ApiOperation({ summary: 'Record cashier or online payment settlement for an invoice' })
  @ApiParam({ name: 'id', description: 'Transaction UUID' })
  @ApiResponse({ status: 200, description: 'Payment recorded and marked completed' })
  async recordPayment(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: RecordPaymentDto,
  ) {
    return this.transactionsService.recordPayment(req.tenantId, id, dto);
  }

  @Delete(':id')
  @Permissions('transactions:manage')
  @ApiOperation({ summary: 'Void or cancel an unpaid invoice' })
  @ApiParam({ name: 'id', description: 'Transaction UUID' })
  @ApiResponse({ status: 200, description: 'Invoice cancelled' })
  async cancelTransaction(
    @Req() req: any,
    @Param('id') id: string,
    @Query('remarks') remarks?: string,
  ) {
    return this.transactionsService.cancelTransaction(req.tenantId, id, remarks);
  }
}
