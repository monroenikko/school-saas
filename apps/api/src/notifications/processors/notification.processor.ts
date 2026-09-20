import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { PrismaService } from '../../prisma/prisma.service';
import {
  NotificationChannel,
  NotificationStatus,
  NotificationType,
} from '@school-saas/shared';

export interface TapNotificationJobData {
  tenantId: string;
  studentId: string;
  studentName: string;
  parentPhone?: string;
  scanType: 'TIME_IN' | 'TIME_OUT';
  attendanceStatus: string;
  deviceName: string;
  scannedAt: string;
}

export interface BroadcastJobData {
  tenantId: string;
  announcementId: string;
  title: string;
  content: string;
  audience: string;
}

@Processor('attendance-notifications')
export class NotificationProcessor extends WorkerHost {
  private readonly logger = new Logger(NotificationProcessor.name);

  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async process(job: Job<TapNotificationJobData | BroadcastJobData>) {
    if (job.name === 'send-tap-sms') {
      return this.processTapSms(job as Job<TapNotificationJobData>);
    }
    if (job.name === 'send-broadcast') {
      return this.processBroadcast(job as Job<BroadcastJobData>);
    }
  }

  private async processTapSms(job: Job<TapNotificationJobData>) {
    const { tenantId, studentId, studentName, parentPhone, scanType, attendanceStatus, deviceName, scannedAt } =
      job.data;

    const tapTimeFormatted = new Date(scannedAt).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
      timeZone: 'Asia/Manila',
    });

    const tapTypeLabel = scanType === 'TIME_IN' ? '🟢 ARRIVED' : '🔴 LEFT';
    const lateIndicator = attendanceStatus === 'LATE' ? ' ⚠️ LATE ARRIVAL' : '';
    const smsText = `[EdVance] ${tapTypeLabel}${lateIndicator}: ${studentName} tapped at ${deviceName} at ${tapTimeFormatted}. #SchoolAttendance`;
    const recipient = parentPhone || 'N/A';

    // Simulate SMS gateway call with realistic latency
    await new Promise((resolve) => setTimeout(resolve, 50));

    const delivered = Math.random() > 0.05; // 95% delivery success rate simulation

    const notification = await this.prisma.notification.create({
      data: {
        tenantId,
        recipient,
        title: `${tapTypeLabel}: ${studentName}`,
        message: smsText,
        type: NotificationType.ATTENDANCE_TAP,
        channel: NotificationChannel.SMS,
        status: delivered ? NotificationStatus.DELIVERED : NotificationStatus.FAILED,
        isRead: false,
        metadata: {
          studentId,
          scanType,
          attendanceStatus,
          deviceName,
          scannedAt,
        },
      },
    });

    this.logger.log(
      `[SMS ${delivered ? 'DELIVERED' : 'FAILED'}] Tap alert for ${studentName} → ${recipient}`,
    );

    return { notificationId: notification.id, delivered };
  }

  private async processBroadcast(job: Job<BroadcastJobData>) {
    const { tenantId, announcementId, title, content } = job.data;

    // Simulate sending to all parents — in production this iterates guardian contacts
    await new Promise((resolve) => setTimeout(resolve, 30));

    await this.prisma.notification.create({
      data: {
        tenantId,
        recipient: 'all-parents',
        title,
        message: content,
        type: NotificationType.ANNOUNCEMENT,
        channel: NotificationChannel.IN_APP,
        status: NotificationStatus.DELIVERED,
        isRead: false,
        metadata: { announcementId },
      },
    });

    // Mark announcement as dispatched
    await this.prisma.announcement.update({
      where: { id: announcementId },
      data: { dispatchedAt: new Date() },
    });

    this.logger.log(`[BROADCAST] Announcement "${title}" dispatched to tenant ${tenantId}`);

    return { announcementId, dispatched: true };
  }
}
