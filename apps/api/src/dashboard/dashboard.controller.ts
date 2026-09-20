import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse as SwaggerResponse, ApiTags } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ApiResponse, JwtPayload } from '@school-saas/shared';

@ApiTags('Dashboard')
@ApiBearerAuth('JWT-auth')
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Get multi-tenant dashboard overview statistics and recent activity' })
  @SwaggerResponse({ status: 200, description: 'Overview statistics, attendance metrics, and recent scans' })
  async getStats(@CurrentUser() user: JwtPayload): Promise<ApiResponse<any>> {
    const data = await this.dashboardService.getStats(user.tenantId, user.role);
    return {
      success: true,
      data,
    };
  }
}
