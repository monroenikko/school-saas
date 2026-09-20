import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Req,
  Headers,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { RfidService } from './rfid.service';
import { CreateRfidDeviceDto } from './dto/create-rfid-device.dto';
import { UpdateRfidDeviceDto } from './dto/update-rfid-device.dto';
import { RfidTapEventDto } from './dto/rfid-tap-event.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../auth/guards/tenant.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { Public } from '../auth/decorators/public.decorator';

@ApiTags('RFID')
@Controller('rfid')
export class RfidController {
  constructor(private readonly rfidService: RfidService) {}

  // ==========================================
  // DEVICE MANAGEMENT
  // ==========================================

  @Get('devices')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
  @Permissions('devices:read')
  @ApiOperation({ summary: 'List all RFID turnstiles and gate devices for school' })
  @ApiResponse({ status: 200, description: 'List of RFID devices with live heartbeat status' })
  async listDevices(@Req() req: any) {
    const devices = await this.rfidService.listDevices(req.tenantId);
    return {
      success: true,
      data: devices,
    };
  }

  @Post('devices')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
  @Permissions('devices:create')
  @ApiOperation({ summary: 'Register a new RFID turnstile gate reader' })
  @ApiResponse({ status: 201, description: 'Device registered and API Key generated' })
  async registerDevice(@Req() req: any, @Body() dto: CreateRfidDeviceDto) {
    return this.rfidService.registerDevice(req.tenantId, dto);
  }

  @Patch('devices/:id')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
  @Permissions('devices:update')
  @ApiOperation({ summary: 'Update RFID turnstile status or details' })
  @ApiParam({ name: 'id', description: 'Device UUID' })
  @ApiResponse({ status: 200, description: 'Device updated successfully' })
  async updateDevice(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: UpdateRfidDeviceDto,
  ) {
    const updated = await this.rfidService.updateDevice(req.tenantId, id, dto);
    return {
      success: true,
      data: updated,
      message: 'Device updated successfully.',
    };
  }

  @Public()
  @Post('devices/:deviceId/heartbeat')
  @ApiOperation({ summary: 'Send heartbeat ping from physical gate reader' })
  @ApiParam({ name: 'deviceId', description: 'Device Hardware ID e.g. GATE-01' })
  @ApiResponse({ status: 200, description: 'Heartbeat recorded' })
  async recordHeartbeat(
    @Param('deviceId') deviceId: string,
    @Headers('x-device-key') apiKey?: string,
  ) {
    return this.rfidService.recordHeartbeat(deviceId, apiKey);
  }

  // ==========================================
  // REAL-TIME TAP EVENT PIPELINE
  // ==========================================

  @Public()
  @Post('tap')
  @ApiOperation({
    summary: 'Process real-time RFID card scan from turnstile gate or dashboard simulator',
  })
  @ApiResponse({
    status: 200,
    description: 'Tap processed: Time-In or Time-Out recorded with student details',
  })
  async processTap(
    @Headers('x-tenant-id') tenantIdHeader: string,
    @Body() dto: RfidTapEventDto,
  ) {
    const result = await this.rfidService.processTap(tenantIdHeader, dto);
    return {
      success: true,
      data: result,
    };
  }
}
