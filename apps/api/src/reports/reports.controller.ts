import {
  Controller,
  Get,
  Param,
  Query,
  Req,
  Res,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { ReportsService } from './reports.service';
import {
  GenerateSF1Dto,
  GenerateSF2Dto,
  GenerateFinancialReportDto,
  ExportCSVDto,
} from './dto/generate-report.dto';

@ApiTags('Reports')
@ApiBearerAuth()
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('sf1')
  @ApiOperation({ summary: 'Generate DepEd SF1 (School Register)' })
  getSF1(@Req() req: Request, @Query() dto: GenerateSF1Dto) {
    const tenantId = (req as any).tenantId as string;
    return this.reportsService.generateSF1(tenantId, dto);
  }

  @Get('sf2')
  @ApiOperation({ summary: 'Generate DepEd SF2 (Daily Attendance Report)' })
  getSF2(@Req() req: Request, @Query() dto: GenerateSF2Dto) {
    const tenantId = (req as any).tenantId as string;
    return this.reportsService.generateSF2(tenantId, dto);
  }

  @Get('sf9/:studentId')
  @ApiOperation({ summary: 'Generate DepEd SF9 / Form 138 (Learner Report Card)' })
  getSF9(@Req() req: Request, @Param('studentId') studentId: string) {
    const tenantId = (req as any).tenantId as string;
    return this.reportsService.generateSF9(tenantId, studentId);
  }

  @Get('financial')
  @ApiOperation({ summary: 'Generate Financial Revenue & Collection Audit' })
  getFinancialSummary(@Req() req: Request, @Query() dto: GenerateFinancialReportDto) {
    const tenantId = (req as any).tenantId as string;
    return this.reportsService.generateFinancialSummary(tenantId, dto);
  }

  @Get('export-csv')
  @ApiOperation({ summary: 'Download report as CSV file' })
  async exportCSV(
    @Req() req: Request,
    @Res() res: Response,
    @Query() query: ExportCSVDto,
  ) {
    const tenantId = (req as any).tenantId as string;
    const csvContent = await this.reportsService.exportCSV(query.type, tenantId, query);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${query.type.toLowerCase()}-report-${Date.now()}.csv"`,
    );
    res.send(csvContent);
  }
}
