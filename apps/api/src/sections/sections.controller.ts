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
import { SectionsService } from './sections.service';
import { CreateSectionDto } from './dto/create-section.dto';
import { UpdateSectionDto } from './dto/update-section.dto';
import { QuerySectionDto } from './dto/query-section.dto';
import { AssignStudentsDto } from './dto/assign-students.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../auth/guards/tenant.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';

@ApiTags('Sections')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
@Controller('sections')
export class SectionsController {
  constructor(private readonly sectionsService: SectionsService) {}

  @Get('stats')
  @Permissions('sections:read')
  @ApiOperation({ summary: 'Get total sections and enrolled student statistics' })
  @ApiResponse({ status: 200, description: 'Section statistics returned' })
  async getStats(@Req() req: any) {
    const stats = await this.sectionsService.getStats(req.tenantId);
    return {
      success: true,
      data: stats,
    };
  }

  @Get()
  @Permissions('sections:read')
  @ApiOperation({ summary: 'List sections with grade levels, advisers, and student headcounts' })
  @ApiResponse({ status: 200, description: 'Sections list returned' })
  async findAll(@Req() req: any, @Query() query: QuerySectionDto) {
    const result = await this.sectionsService.findAll(req.tenantId, query);
    return {
      success: true,
      data: result.data,
      meta: result.meta,
    };
  }

  @Get('academic-years')
  @Permissions('sections:read')
  @ApiOperation({ summary: 'List academic years for section school year binding' })
  @ApiResponse({ status: 200, description: 'Academic years returned' })
  async getAcademicYears(@Req() req: any) {
    const years = await this.sectionsService.getAcademicYears(req.tenantId);
    return {
      success: true,
      data: years,
    };
  }

  @Get(':id')
  @Permissions('sections:read')
  @ApiOperation({ summary: 'Get section details including active student roster' })
  @ApiParam({ name: 'id', description: 'Section UUID' })
  @ApiResponse({ status: 200, description: 'Section detail and student listing returned' })
  async findOne(@Req() req: any, @Param('id') id: string) {
    const section = await this.sectionsService.findOne(req.tenantId, id);
    return {
      success: true,
      data: section,
    };
  }

  @Post()
  @Permissions('sections:create')
  @ApiOperation({ summary: 'Create a new class section' })
  @ApiResponse({ status: 201, description: 'Section created successfully' })
  async create(@Req() req: any, @Body() createSectionDto: CreateSectionDto) {
    const section = await this.sectionsService.create(req.tenantId, createSectionDto);
    return {
      success: true,
      message: 'Section created successfully',
      data: section,
    };
  }

  @Patch(':id')
  @Permissions('sections:update')
  @ApiOperation({ summary: 'Update section details (adviser, room, name)' })
  @ApiParam({ name: 'id', description: 'Section UUID' })
  async update(
    @Req() req: any,
    @Param('id') id: string,
    @Body() updateSectionDto: UpdateSectionDto,
  ) {
    const section = await this.sectionsService.update(req.tenantId, id, updateSectionDto);
    return {
      success: true,
      message: 'Section updated successfully',
      data: section,
    };
  }

  @Post(':id/students')
  @Permissions('sections:update')
  @ApiOperation({ summary: 'Bulk assign students to this section' })
  @ApiParam({ name: 'id', description: 'Section UUID' })
  async assignStudents(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: AssignStudentsDto,
  ) {
    const result = await this.sectionsService.assignStudents(
      req.tenantId,
      id,
      dto.studentIds,
    );
    return {
      success: true,
      message: `Successfully enrolled ${dto.studentIds.length} students into section`,
      data: result,
    };
  }

  @Delete(':id/students/:studentId')
  @Permissions('sections:update')
  @ApiOperation({ summary: 'Remove / unassign a student from this section' })
  @ApiParam({ name: 'id', description: 'Section UUID' })
  @ApiParam({ name: 'studentId', description: 'Student UUID' })
  async removeStudent(
    @Req() req: any,
    @Param('id') id: string,
    @Param('studentId') studentId: string,
  ) {
    const result = await this.sectionsService.removeStudent(req.tenantId, id, studentId);
    return {
      success: true,
      message: 'Student unassigned from section',
      data: result,
    };
  }

  @Delete(':id')
  @Permissions('sections:delete')
  @ApiOperation({ summary: 'Delete a section' })
  @ApiParam({ name: 'id', description: 'Section UUID' })
  async remove(@Req() req: any, @Param('id') id: string) {
    const result = await this.sectionsService.remove(req.tenantId, id);
    return {
      success: true,
      message: 'Section deleted',
      data: result,
    };
  }
}
