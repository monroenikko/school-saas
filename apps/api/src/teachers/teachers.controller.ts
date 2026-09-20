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
import { TeachersService } from './teachers.service';
import { CreateTeacherDto } from './dto/create-teacher.dto';
import { UpdateTeacherDto } from './dto/update-teacher.dto';
import { QueryTeacherDto } from './dto/query-teacher.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../auth/guards/tenant.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';

@ApiTags('Teachers')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
@Controller('teachers')
export class TeachersController {
  constructor(private readonly teachersService: TeachersService) {}

  @Get('stats')
  @Permissions('teachers:read')
  @ApiOperation({ summary: 'Get faculty & teacher headcounts for school' })
  @ApiResponse({ status: 200, description: 'Faculty statistics returned successfully' })
  async getStats(@Req() req: any) {
    const stats = await this.teachersService.getStats(req.tenantId);
    return {
      success: true,
      data: stats,
    };
  }

  @Get()
  @Permissions('teachers:read')
  @ApiOperation({ summary: 'List teachers with pagination, search, and department filters' })
  @ApiResponse({ status: 200, description: 'Paginated faculty directory returned' })
  async findAll(@Req() req: any, @Query() query: QueryTeacherDto) {
    const result = await this.teachersService.findAll(req.tenantId, query);
    return {
      success: true,
      data: result.data,
      meta: result.meta,
    };
  }

  @Get(':id')
  @Permissions('teachers:read')
  @ApiOperation({ summary: 'Get detailed profile of a teacher by UUID' })
  @ApiParam({ name: 'id', description: 'Teacher UUID' })
  @ApiResponse({ status: 200, description: 'Teacher profile returned' })
  @ApiResponse({ status: 404, description: 'Teacher not found' })
  async findOne(@Req() req: any, @Param('id') id: string) {
    const teacher = await this.teachersService.findOne(req.tenantId, id);
    return {
      success: true,
      data: teacher,
    };
  }

  @Post()
  @Permissions('teachers:create')
  @ApiOperation({ summary: 'Register / add a new teacher to faculty' })
  @ApiResponse({ status: 201, description: 'Teacher registered successfully' })
  @ApiResponse({ status: 409, description: 'Employee ID already exists' })
  async create(@Req() req: any, @Body() createTeacherDto: CreateTeacherDto) {
    const teacher = await this.teachersService.create(req.tenantId, createTeacherDto);
    return {
      success: true,
      message: 'Teacher registered successfully',
      data: teacher,
    };
  }

  @Patch(':id')
  @Permissions('teachers:update')
  @ApiOperation({ summary: 'Update teacher profile' })
  @ApiParam({ name: 'id', description: 'Teacher UUID' })
  @ApiResponse({ status: 200, description: 'Teacher updated successfully' })
  @ApiResponse({ status: 404, description: 'Teacher not found' })
  async update(
    @Req() req: any,
    @Param('id') id: string,
    @Body() updateTeacherDto: UpdateTeacherDto,
  ) {
    const teacher = await this.teachersService.update(
      req.tenantId,
      id,
      updateTeacherDto,
    );
    return {
      success: true,
      message: 'Teacher updated successfully',
      data: teacher,
    };
  }

  @Delete(':id')
  @Permissions('teachers:delete')
  @ApiOperation({ summary: 'Deactivate / soft-delete a teacher' })
  @ApiParam({ name: 'id', description: 'Teacher UUID' })
  @ApiResponse({ status: 200, description: 'Teacher deactivated successfully' })
  async remove(@Req() req: any, @Param('id') id: string) {
    const teacher = await this.teachersService.remove(req.tenantId, id);
    return {
      success: true,
      message: 'Teacher deactivated',
      data: teacher,
    };
  }
}
