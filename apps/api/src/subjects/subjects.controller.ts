import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
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
import { SubjectsService } from './subjects.service';
import { CreateSubjectDto } from './dto/create-subject.dto';
import { CreateSubjectClassDto } from './dto/create-subject-class.dto';
import { UpdateSubjectClassDto } from './dto/update-subject-class.dto';
import { QuerySubjectDto, QuerySubjectClassDto } from './dto/query-subject.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../auth/guards/tenant.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';

@ApiTags('Subjects & Classes')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
@Controller('subjects')
export class SubjectsController {
  constructor(private readonly subjectsService: SubjectsService) {}

  // ==========================================
  // TERMS HELPER
  // ==========================================

  @Get('terms')
  @Permissions('subjects:read')
  @ApiOperation({ summary: 'List academic terms for multi-select dropdowns' })
  @ApiResponse({ status: 200, description: 'Academic terms list returned' })
  async getTerms(@Req() req: any) {
    const terms = await this.subjectsService.getTerms(req.tenantId);
    return {
      success: true,
      data: terms,
    };
  }

  // ==========================================
  // CLASS OFFERINGS (SUBJECT CLASSES)
  // ==========================================

  @Get('classes')
  @Permissions('subjects:read')
  @ApiOperation({ summary: 'List class offerings with faculty, schedule, and selected terms' })
  @ApiResponse({ status: 200, description: 'Class offerings returned' })
  async findAllClasses(@Req() req: any, @Query() query: QuerySubjectClassDto) {
    const result = await this.subjectsService.findAllClasses(req.tenantId, query);
    return {
      success: true,
      data: result.data,
      meta: result.meta,
    };
  }

  @Get('classes/:id')
  @Permissions('subjects:read')
  @ApiOperation({ summary: 'Get class offering detail including schedules and student enrollments' })
  @ApiParam({ name: 'id', description: 'SubjectClass UUID' })
  @ApiResponse({ status: 200, description: 'Class offering detail returned' })
  async findOneClass(@Req() req: any, @Param('id') id: string) {
    const subjectClass = await this.subjectsService.findOneClass(req.tenantId, id);
    return {
      success: true,
      data: subjectClass,
    };
  }

  @Post('classes')
  @Permissions('subjects:create')
  @ApiOperation({
    summary:
      'Create class offering with flexible multiple select terms, faculty, section, and multi-slot schedules',
  })
  @ApiResponse({ status: 201, description: 'Class offering created successfully' })
  async createClass(@Req() req: any, @Body() dto: CreateSubjectClassDto) {
    const created = await this.subjectsService.createClass(req.tenantId, dto);
    return {
      success: true,
      message: 'Class offering created successfully',
      data: created,
    };
  }

  @Patch('classes/:id')
  @Permissions('subjects:update')
  @ApiOperation({ summary: 'Update class offering, faculty, multiple select terms, or schedules' })
  @ApiParam({ name: 'id', description: 'SubjectClass UUID' })
  @ApiResponse({ status: 200, description: 'Class offering updated successfully' })
  async updateClass(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: UpdateSubjectClassDto,
  ) {
    const updated = await this.subjectsService.updateClass(req.tenantId, id, dto);
    return {
      success: true,
      message: 'Class offering updated successfully',
      data: updated,
    };
  }

  @Delete('classes/:id')
  @Permissions('subjects:delete')
  @ApiOperation({ summary: 'Delete a class offering' })
  @ApiParam({ name: 'id', description: 'SubjectClass UUID' })
  @ApiResponse({ status: 200, description: 'Class offering deleted successfully' })
  async removeClass(@Req() req: any, @Param('id') id: string) {
    await this.subjectsService.removeClass(req.tenantId, id);
    return {
      success: true,
      message: 'Class offering deleted successfully',
    };
  }

  // ==========================================
  // MASTER SUBJECTS
  // ==========================================

  @Get()
  @Permissions('subjects:read')
  @ApiOperation({ summary: 'List master curriculum subjects' })
  @ApiResponse({ status: 200, description: 'Master subjects list returned' })
  async findAllSubjects(@Req() req: any, @Query() query: QuerySubjectDto) {
    const result = await this.subjectsService.findAllSubjects(req.tenantId, query);
    return {
      success: true,
      data: result.data,
      meta: result.meta,
    };
  }

  @Get(':id')
  @Permissions('subjects:read')
  @ApiOperation({ summary: 'Get master subject detail' })
  @ApiParam({ name: 'id', description: 'Subject UUID' })
  @ApiResponse({ status: 200, description: 'Subject detail returned' })
  async findOneSubject(@Req() req: any, @Param('id') id: string) {
    const subject = await this.subjectsService.findOneSubject(req.tenantId, id);
    return {
      success: true,
      data: subject,
    };
  }

  @Post()
  @Permissions('subjects:create')
  @ApiOperation({ summary: 'Create a new master curriculum subject' })
  @ApiResponse({ status: 201, description: 'Subject created successfully' })
  async createSubject(@Req() req: any, @Body() dto: CreateSubjectDto) {
    const subject = await this.subjectsService.createSubject(req.tenantId, dto);
    return {
      success: true,
      message: 'Master subject created successfully',
      data: subject,
    };
  }

  @Patch(':id')
  @Permissions('subjects:update')
  @ApiOperation({ summary: 'Update master subject details' })
  @ApiParam({ name: 'id', description: 'Subject UUID' })
  @ApiResponse({ status: 200, description: 'Subject updated successfully' })
  async updateSubject(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: Partial<CreateSubjectDto>,
  ) {
    const subject = await this.subjectsService.updateSubject(req.tenantId, id, dto);
    return {
      success: true,
      message: 'Subject updated successfully',
      data: subject,
    };
  }

  @Delete(':id')
  @Permissions('subjects:delete')
  @ApiOperation({ summary: 'Delete master subject (if no classes assigned)' })
  @ApiParam({ name: 'id', description: 'Subject UUID' })
  @ApiResponse({ status: 200, description: 'Subject deleted successfully' })
  async removeSubject(@Req() req: any, @Param('id') id: string) {
    await this.subjectsService.removeSubject(req.tenantId, id);
    return {
      success: true,
      message: 'Subject deleted successfully',
    };
  }
}
