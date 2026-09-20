import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
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
import { GradesService } from './grades.service';
import { EnrollStudentDto } from './dto/enroll-student.dto';
import { SaveGradesBatchDto } from './dto/save-grades-batch.dto';
import { QueryGradesMatrixDto } from './dto/query-grades.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../auth/guards/tenant.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { GradingPeriod } from '@school-saas/shared';

@ApiTags('Grades & Subject Enrollment')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
@Controller('grades')
export class GradesController {
  constructor(private readonly gradesService: GradesService) {}

  // ==========================================
  // ENROLLMENT ENDPOINTS
  // ==========================================

  @Post('classes/:id/enroll')
  @Permissions('grades:create')
  @ApiOperation({
    summary: 'Enroll individual students or entire section roster into class offering',
  })
  @ApiParam({ name: 'id', description: 'SubjectClass UUID' })
  @ApiResponse({ status: 201, description: 'Students enrolled successfully' })
  async enrollStudents(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: EnrollStudentDto,
  ) {
    const result = await this.gradesService.enrollStudents(req.tenantId, id, dto);
    return {
      success: true,
      data: result,
    };
  }

  @Delete('classes/:id/enroll/:studentId')
  @Permissions('grades:update')
  @ApiOperation({ summary: 'Unenroll / drop a student from a class offering' })
  @ApiParam({ name: 'id', description: 'SubjectClass UUID' })
  @ApiParam({ name: 'studentId', description: 'Student UUID' })
  @ApiResponse({ status: 200, description: 'Student unenrolled successfully' })
  async unenrollStudent(
    @Req() req: any,
    @Param('id') id: string,
    @Param('studentId') studentId: string,
  ) {
    const result = await this.gradesService.unenrollStudent(req.tenantId, id, studentId);
    return {
      success: true,
      data: result,
    };
  }

  // ==========================================
  // GRADES MATRIX & BATCH ENTRY
  // ==========================================

  @Get('classes/:id/matrix')
  @Permissions('grades:read')
  @ApiOperation({
    summary:
      'Get class grading sheet matrix with all enrolled learners, quarterly scores, and computed averages',
  })
  @ApiParam({ name: 'id', description: 'SubjectClass UUID' })
  @ApiResponse({ status: 200, description: 'Class grades matrix returned' })
  async getClassGradesMatrix(
    @Req() req: any,
    @Param('id') id: string,
    @Query() query: QueryGradesMatrixDto,
  ) {
    const result = await this.gradesService.getClassGradesMatrix(req.tenantId, id, query);
    return {
      success: true,
      data: result,
    };
  }

  @Post('classes/:id/batch')
  @Permissions('grades:create')
  @ApiOperation({
    summary: 'Batch save or update student quarterly scores with auto-computed DepEd remarks',
  })
  @ApiParam({ name: 'id', description: 'SubjectClass UUID' })
  @ApiResponse({ status: 200, description: 'Grades saved successfully' })
  async saveBatchGrades(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: SaveGradesBatchDto,
  ) {
    const result = await this.gradesService.saveBatchGrades(
      req.tenantId,
      id,
      req.user?.id || null,
      dto,
    );
    return {
      success: true,
      data: result,
    };
  }

  @Post('classes/:id/publish')
  @Permissions('grades:update')
  @ApiOperation({ summary: 'Publish grades for a specific grading period' })
  @ApiParam({ name: 'id', description: 'SubjectClass UUID' })
  @ApiResponse({ status: 200, description: 'Grades published successfully' })
  async publishGrades(
    @Req() req: any,
    @Param('id') id: string,
    @Body('period') period: GradingPeriod,
  ) {
    const result = await this.gradesService.publishGrades(req.tenantId, id, period);
    return {
      success: true,
      data: result,
    };
  }

  // ==========================================
  // STUDENT REPORT CARD / TRANSCRIPT
  // ==========================================

  @Get('students/:id/report-card')
  @Permissions('grades:read')
  @ApiOperation({
    summary:
      'Get comprehensive student report card with all enrolled subjects, quarterly marks, and general average',
  })
  @ApiParam({ name: 'id', description: 'Student UUID' })
  @ApiResponse({ status: 200, description: 'Student report card returned' })
  async getStudentReportCard(
    @Req() req: any,
    @Param('id') id: string,
    @Query('academicYearId') academicYearId?: string,
  ) {
    const result = await this.gradesService.getStudentReportCard(
      req.tenantId,
      id,
      academicYearId,
    );
    return {
      success: true,
      data: result,
    };
  }
}
