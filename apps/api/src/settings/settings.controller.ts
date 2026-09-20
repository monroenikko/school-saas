import { Controller, Get, Patch, Body, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { SettingsService } from './settings.service';
import { UpdateSchoolSettingsDto } from './dto/update-school-settings.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../auth/guards/tenant.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';

@ApiTags('School Settings & Configuration')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  @Permissions('settings:read')
  @ApiOperation({ summary: 'Get current school profile, academic year, and RFID timing policies' })
  @ApiResponse({ status: 200, description: 'Settings returned successfully' })
  async getSettings(@Req() req: any) {
    const settings = await this.settingsService.getSettings(req.tenantId);
    return {
      success: true,
      data: settings,
    };
  }

  @Patch()
  @Permissions('settings:update')
  @ApiOperation({ summary: 'Update school details, contact info, and attendance policies' })
  @ApiResponse({ status: 200, description: 'Settings updated successfully' })
  async updateSettings(@Req() req: any, @Body() dto: UpdateSchoolSettingsDto) {
    return this.settingsService.updateSettings(req.tenantId, dto);
  }
}
