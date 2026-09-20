import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Request } from 'express';
import { NotificationsService } from './notifications.service';
import { QueryNotificationsDto } from './dto/query-notifications.dto';
import { SendBroadcastDto } from './dto/send-broadcast.dto';
import { SimulateTapAlertDto } from './dto/simulate-tap-alert.dto';

@ApiTags('Notifications')
@ApiBearerAuth()
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: 'List notification history (paginated)' })
  getNotifications(@Req() req: Request, @Query() query: QueryNotificationsDto) {
    const tenantId = (req as any).tenantId as string;
    return this.notificationsService.getNotifications(tenantId, query);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Notification throughput stats & queue health' })
  getStats(@Req() req: Request) {
    const tenantId = (req as any).tenantId as string;
    return this.notificationsService.getNotificationStats(tenantId);
  }

  @Get('announcements')
  @ApiOperation({ summary: 'List school announcements' })
  getAnnouncements(@Req() req: Request) {
    const tenantId = (req as any).tenantId as string;
    return this.notificationsService.getAnnouncements(tenantId);
  }

  @Post('broadcast')
  @ApiOperation({ summary: 'Broadcast school-wide announcement' })
  broadcast(@Req() req: Request, @Body() dto: SendBroadcastDto) {
    const tenantId = (req as any).tenantId as string;
    return this.notificationsService.broadcastAnnouncement(tenantId, dto);
  }

  @Post('read-all')
  @ApiOperation({ summary: 'Mark all notifications as read' })
  markAllAsRead(@Req() req: Request) {
    const tenantId = (req as any).tenantId as string;
    return this.notificationsService.markAllAsRead(tenantId);
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark a single notification as read' })
  markAsRead(@Req() req: Request, @Param('id') id: string) {
    const tenantId = (req as any).tenantId as string;
    return this.notificationsService.markAsRead(tenantId, id);
  }

  @Post('simulate-tap-alert')
  @ApiOperation({ summary: 'Simulate RFID tap SMS alert (demo/testing)' })
  simulateTapAlert(@Req() req: Request, @Body() dto: SimulateTapAlertDto) {
    const tenantId = (req as any).tenantId as string;
    return this.notificationsService.simulateTapAlert(tenantId, dto);
  }
}
