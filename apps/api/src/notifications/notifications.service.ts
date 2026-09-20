import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';
import { QueryNotificationsDto } from './dto/query-notifications.dto';
import { SendBroadcastDto } from './dto/send-broadcast.dto';
import { SimulateTapAlertDto } from './dto/simulate-tap-alert.dto';
import { NotificationStatus, NotificationType, ScanType } from '@school-saas/shared';

@Injectable()
export class NotificationsService {
  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue('attendance-notifications')
    private readonly notificationQueue: Queue,
  ) {}

  // ==========================================
  // NOTIFICATION LISTING & MANAGEMENT
  // ==========================================

  async getNotifications(tenantId: string, query: QueryNotificationsDto) {
    const { type, isRead, search, page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    const tenantWhere = tenantId ? { tenantId } : {};
    const where: any = { ...tenantWhere };

    if (type) where.type = type;
    if (isRead !== undefined) where.isRead = isRead;
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { message: { contains: search, mode: 'insensitive' } },
        { recipient: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [total, notifications] = await Promise.all([
      this.prisma.notification.count({ where }),
      this.prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    return {
      data: notifications,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getNotificationStats(tenantId: string) {
    const tenantWhere = tenantId ? { tenantId } : {};
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [
      totalToday,
      tapNotificationsToday,
      deliveredToday,
      failedToday,
      unreadCount,
    ] = await Promise.all([
      this.prisma.notification.count({
        where: { ...tenantWhere, createdAt: { gte: todayStart } },
      }),
      this.prisma.notification.count({
        where: {
          ...tenantWhere,
          type: NotificationType.ATTENDANCE_TAP,
          createdAt: { gte: todayStart },
        },
      }),
      this.prisma.notification.count({
        where: {
          ...tenantWhere,
          status: NotificationStatus.DELIVERED,
          createdAt: { gte: todayStart },
        },
      }),
      this.prisma.notification.count({
        where: {
          ...tenantWhere,
          status: NotificationStatus.FAILED,
          createdAt: { gte: todayStart },
        },
      }),
      this.prisma.notification.count({
        where: { ...tenantWhere, isRead: false },
      }),
    ]);

    const deliverySuccessRate =
      totalToday > 0 ? Math.round((deliveredToday / totalToday) * 100) : 100;

    // Get BullMQ queue health
    const [waiting, active, completed, failed] = await Promise.all([
      this.notificationQueue.getWaitingCount(),
      this.notificationQueue.getActiveCount(),
      this.notificationQueue.getCompletedCount(),
      this.notificationQueue.getFailedCount(),
    ]);

    return {
      totalDispatchedToday: totalToday,
      tapNotificationsSentToday: tapNotificationsToday,
      deliverySuccessRate,
      failedToday,
      unreadCount,
      queue: {
        status: waiting + active > 0 ? 'PROCESSING' : 'IDLE',
        waiting,
        active,
        completed,
        failed,
      },
    };
  }

  async getAnnouncements(tenantId: string) {
    const tenantWhere = tenantId ? { tenantId } : {};

    return this.prisma.announcement.findMany({
      where: tenantWhere,
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async markAsRead(tenantId: string, id: string) {
    const tenantWhere = tenantId ? { tenantId } : {};

    return this.prisma.notification.update({
      where: { id, ...tenantWhere },
      data: { isRead: true },
    });
  }

  async markAllAsRead(tenantId: string) {
    const tenantWhere = tenantId ? { tenantId } : {};

    const { count } = await this.prisma.notification.updateMany({
      where: { ...tenantWhere, isRead: false },
      data: { isRead: true },
    });

    return { markedRead: count };
  }

  // ==========================================
  // BROADCAST & ANNOUNCEMENTS
  // ==========================================

  async broadcastAnnouncement(tenantId: string, dto: SendBroadcastDto) {
    const resolvedTenantId =
      tenantId ||
      (
        await this.prisma.tenant.findFirst({
          where: { status: 'ACTIVE' },
          select: { id: true },
        })
      )?.id;

    if (!resolvedTenantId) {
      throw new Error('No active tenant found for broadcast');
    }

    const announcement = await this.prisma.announcement.create({
      data: {
        tenantId: resolvedTenantId,
        title: dto.title,
        content: dto.content,
        audience: dto.audience || 'ALL',
        priority: (dto.priority as any) || 'STANDARD',
      },
    });

    await this.notificationQueue.add(
      'send-broadcast',
      {
        tenantId: resolvedTenantId,
        announcementId: announcement.id,
        title: dto.title,
        content: dto.content,
        audience: dto.audience,
      },
      {
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 },
        removeOnComplete: 100,
        removeOnFail: 500,
      },
    );

    return {
      success: true,
      announcement,
      message: `Announcement queued for dispatch to ${dto.audience || 'ALL'} recipients.`,
    };
  }

  // ==========================================
  // RFID TAP NOTIFICATION ENQUEUE (called by RfidService)
  // ==========================================

  async enqueueTapNotification(data: {
    tenantId: string;
    studentId: string;
    studentName: string;
    parentPhone?: string;
    scanType: 'TIME_IN' | 'TIME_OUT';
    attendanceStatus: string;
    deviceName: string;
    scannedAt: Date | string;
  }) {
    try {
      const scannedAtStr =
        typeof data.scannedAt === 'string'
          ? data.scannedAt
          : data.scannedAt.toISOString();

      await this.notificationQueue.add(
        'send-tap-sms',
        {
          ...data,
          scannedAt: scannedAtStr,
        },
        {
          attempts: 3,
          backoff: { type: 'exponential', delay: 1000 },
          removeOnComplete: 200,
          removeOnFail: 500,
        },
      );
    } catch (err) {
      // Non-critical: RFID tap should succeed even if queue is temporarily unavailable
      console.warn('[NotificationsService] Queue enqueue warning:', err?.message);
    }
  }

  // ==========================================
  // TEST/DEMO: SIMULATE TAP ALERT
  // ==========================================

  async simulateTapAlert(tenantId: string, dto: SimulateTapAlertDto) {
    const tenantWhere = tenantId ? { tenantId } : {};

    const student = await this.prisma.student.findFirst({
      where: { id: dto.studentId, ...tenantWhere },
      include: {
        sectionStudents: {
          where: { status: 'ACTIVE' },
          take: 1,
        },
      },
    });

    if (!student) {
      throw new Error('Student not found');
    }

    const effectiveTenantId = tenantId || student.tenantId;

    await this.enqueueTapNotification({
      tenantId: effectiveTenantId,
      studentId: student.id,
      studentName: `${student.firstName} ${student.lastName}`,
      parentPhone: '+639' + Math.floor(100000000 + Math.random() * 900000000),
      scanType: dto.scanType || ScanType.TIME_IN,
      attendanceStatus: 'PRESENT',
      deviceName: dto.deviceName || 'Main Entrance Gate',
      scannedAt: new Date(),
    });

    return {
      success: true,
      message: `SMS tap alert queued for ${student.firstName} ${student.lastName}.`,
    };
  }
}
