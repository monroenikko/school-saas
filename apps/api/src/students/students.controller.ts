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
  ApiBody,
} from '@nestjs/swagger';
import { StudentsService } from './students.service';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';
import { QueryStudentDto } from './dto/query-student.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../auth/guards/tenant.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Students')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
@Controller('students')
export class StudentsController {
  constructor(private readonly studentsService: StudentsService) {}

  @Get('stats')
  @Permissions('students:read')
  @ApiOperation({ summary: 'Get student enrollment & RFID badging statistics for school' })
  @ApiResponse({ status: 200, description: 'Summary statistics returned successfully' })
  async getStats(@Req() req: any) {
    const stats = await this.studentsService.getStats(req.tenantId);
    return {
      success: true,
      data: stats,
    };
  }

  @Get('sections')
  @Permissions('students:read')
  @ApiOperation({ summary: 'Get active sections for dropdown filter/assignment' })
  @ApiResponse({ status: 200, description: 'Sections list returned' })
  async getSections(@Req() req: any) {
    const sections = await this.studentsService.getSections(req.tenantId);
    return {
      success: true,
      data: sections,
    };
  }

  @Get()
  @Permissions('students:read')
  @ApiOperation({ summary: 'List students with pagination, search, and section filters' })
  @ApiResponse({ status: 200, description: 'Paginated students roster returned' })
  async findAll(@Req() req: any, @Query() query: QueryStudentDto) {
    const result = await this.studentsService.findAll(req.tenantId, query);
    return {
      success: true,
      data: result.data,
      meta: result.meta,
    };
  }

  @Get(':id')
  @Permissions('students:read')
  @ApiOperation({ summary: 'Get detailed profile of a student by UUID' })
  @ApiParam({ name: 'id', description: 'Student UUID' })
  @ApiResponse({ status: 200, description: 'Student profile returned' })
  @ApiResponse({ status: 404, description: 'Student not found' })
  async findOne(@Req() req: any, @Param('id') id: string) {
    const student = await this.studentsService.findOne(req.tenantId, id);
    return {
      success: true,
      data: student,
    };
  }

  @Post()
  @Permissions('students:create')
  @ApiOperation({ summary: 'Enroll / register a new student' })
  @ApiResponse({ status: 201, description: 'Student enrolled successfully' })
  @ApiResponse({ status: 409, description: 'Student ID or RFID Card UID already exists' })
  async create(@Req() req: any, @Body() createStudentDto: CreateStudentDto) {
    const student = await this.studentsService.create(req.tenantId, createStudentDto);
    return {
      success: true,
      message: 'Student enrolled successfully',
      data: student,
    };
  }

  @Patch(':id')
  @Permissions('students:update')
  @ApiOperation({ summary: 'Update an existing student profile' })
  @ApiParam({ name: 'id', description: 'Student UUID' })
  @ApiResponse({ status: 200, description: 'Student updated successfully' })
  @ApiResponse({ status: 404, description: 'Student not found' })
  async update(
    @Req() req: any,
    @Param('id') id: string,
    @Body() updateStudentDto: UpdateStudentDto,
  ) {
    const student = await this.studentsService.update(
      req.tenantId,
      id,
      updateStudentDto,
    );
    return {
      success: true,
      message: 'Student updated successfully',
      data: student,
    };
  }

  @Patch(':id/rfid')
  @Permissions('students:update')
  @ApiOperation({ summary: 'Quick assign / re-badge an RFID card UID to student' })
  @ApiParam({ name: 'id', description: 'Student UUID' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        rfidCardUid: {
          type: 'string',
          example: 'E28068940000501234A1B2C1',
        },
      },
      required: ['rfidCardUid'],
    },
  })
  @ApiResponse({ status: 200, description: 'RFID card assigned successfully' })
  async assignRfid(
    @Req() req: any,
    @Param('id') id: string,
    @Body('rfidCardUid') rfidCardUid: string,
  ) {
    const student = await this.studentsService.assignRfid(
      req.tenantId,
      id,
      rfidCardUid,
    );
    return {
      success: true,
      message: 'RFID badge linked successfully',
      data: student,
    };
  }

  @Delete(':id')
  @Permissions('students:delete')
  @ApiOperation({ summary: 'Archive / soft-delete a student' })
  @ApiParam({ name: 'id', description: 'Student UUID' })
  @ApiResponse({ status: 200, description: 'Student archived successfully' })
  async remove(@Req() req: any, @Param('id') id: string) {
    const student = await this.studentsService.remove(req.tenantId, id);
    return {
      success: true,
      message: 'Student record archived',
      data: student,
    };
  }
}
