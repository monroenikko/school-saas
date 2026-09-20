import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { AttendanceService } from './attendance.service';
import { QueryAttendanceDto } from './dto/query-attendance.dto';
import { ManualAttendanceDto } from './dto/manual-attendance.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../auth/guards/tenant.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';

@ApiTags('Attendance')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
@Controller('attendance')
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Get()
  @Permissions('attendance:read')
  @ApiOperation({ summary: 'Get paginated daily attendance records with student & turnstile details' })
  @ApiResponse({ status: 200, description: 'Attendance records returned successfully' })
  async getDailyAttendance(@Req() req: any, @Query() query: QueryAttendanceDto) {
    const result = await this.attendanceService.getDailyAttendance(
      req.tenantId,
      query,
    );
    return {
      success: true,
      ...result,
    };
  }

  @Get('stats')
  @Permissions('attendance:read')
  @ApiOperation({ summary: 'Get summary statistics (Present, Late, Absent, Attendance Rate %) for date' })
  @ApiQuery({ name: 'date', required: false, example: '2026-09-20' })
  @ApiResponse({ status: 200, description: 'Summary statistics returned successfully' })
  async getAttendanceStats(@Req() req: any, @Query('date') date?: string) {
    const stats = await this.attendanceService.getAttendanceStats(
      req.tenantId,
      date,
    );
    return {
      success: true,
      data: stats,
    };
  }

  @Get('recent-taps')
  @Permissions('attendance:read')
  @ApiOperation({ summary: 'Get latest RFID scan events for real-time gate turnstile feeds' })
  @ApiQuery({ name: 'limit', required: false, example: 15 })
  @ApiResponse({ status: 200, description: 'Recent tap stream returned' })
  async getRecentTaps(@Req() req: any, @Query('limit') limit?: number) {
    const taps = await this.attendanceService.getRecentTaps(
      req.tenantId,
      limit ? Number(limit) : 15,
    );
    return {
      success: true,
      data: taps,
    };
  }

  @Post('manual')
  @Permissions('attendance:create')
  @ApiOperation({ summary: 'Manually record or override student attendance status with remarks' })
  @ApiResponse({ status: 201, description: 'Attendance record saved' })
  async recordManualAttendance(
    @Req() req: any,
    @Body() dto: ManualAttendanceDto,
  ) {
    return this.attendanceService.recordManualAttendance(req.tenantId, dto);
  }
}
