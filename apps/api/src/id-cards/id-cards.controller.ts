import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Request } from 'express';
import { IdCardsService } from './id-cards.service';
import { CreateIdCardTemplateDto, BatchBadgeQueryDto } from './dto/id-card-template.dto';

@ApiTags('ID Cards')
@ApiBearerAuth()
@Controller('id-cards')
export class IdCardsController {
  constructor(private readonly idCardsService: IdCardsService) {}

  @Get('templates')
  @ApiOperation({ summary: 'List available CR80 ID card layout templates' })
  getTemplates(@Req() req: Request) {
    const tenantId = (req as any).tenantId as string;
    return this.idCardsService.getTemplates(tenantId);
  }

  @Get('student/:studentId')
  @ApiOperation({ summary: 'Get printable badge payload for a student' })
  getStudentBadge(@Req() req: Request, @Param('studentId') studentId: string) {
    const tenantId = (req as any).tenantId as string;
    return this.idCardsService.getStudentBadgeData(tenantId, studentId);
  }

  @Get('batch')
  @ApiOperation({ summary: 'Get batch badges for multi-card sheet printing' })
  getBatchBadges(@Req() req: Request, @Query() query: BatchBadgeQueryDto) {
    const tenantId = (req as any).tenantId as string;
    return this.idCardsService.getBatchBadgeData(tenantId, query);
  }

  @Post('templates')
  @ApiOperation({ summary: 'Save custom ID card template configuration' })
  saveTemplate(@Req() req: Request, @Body() dto: CreateIdCardTemplateDto) {
    const tenantId = (req as any).tenantId as string;
    return this.idCardsService.saveCustomTemplate(tenantId, dto);
  }
}
