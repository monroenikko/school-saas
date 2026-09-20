import { Test, TestingModule } from '@nestjs/testing';
import { NotificationsService } from '../notifications.service';
import { PrismaService } from '../../prisma/prisma.service';
import { getQueueToken } from '@nestjs/bullmq';
import { NotificationStatus, NotificationType } from '@school-saas/shared';

describe('NotificationsService', () => {
  let service: NotificationsService;
  let prisma: PrismaService;
  let queue: any;

  const tenantId = 'tenant-uuid-1';

  const mockQueue = {
    add: jest.fn().mockResolvedValue({ id: 'job-123' }),
    getWaitingCount: jest.fn().mockResolvedValue(0),
    getActiveCount: jest.fn().mockResolvedValue(0),
    getCompletedCount: jest.fn().mockResolvedValue(45),
    getFailedCount: jest.fn().mockResolvedValue(1),
  };

  const mockPrismaService = {
    notification: {
      count: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    announcement: {
      findMany: jest.fn(),
      create: jest.fn(),
    },
    tenant: {
      findFirst: jest.fn(),
    },
    student: {
      findFirst: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: getQueueToken('attendance-notifications'),
          useValue: mockQueue,
        },
      ],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);
    prisma = module.get<PrismaService>(PrismaService);
    queue = module.get(getQueueToken('attendance-notifications'));
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getNotifications', () => {
    it('should return paginated notifications with meta', async () => {
      const mockNotifications = [
        {
          id: 'notif-1',
          tenantId,
          title: 'Arrival Alert: Juan Dela Cruz',
          message: 'Student tapped at Gate 1',
          type: NotificationType.ATTENDANCE_TAP,
          isRead: false,
          createdAt: new Date(),
        },
      ];

      mockPrismaService.notification.count.mockResolvedValue(1);
      mockPrismaService.notification.findMany.mockResolvedValue(mockNotifications);

      const result = await service.getNotifications(tenantId, { page: 1, limit: 10 });

      expect(result.data).toEqual(mockNotifications);
      expect(result.meta.total).toBe(1);
      expect(result.meta.totalPages).toBe(1);
      expect(mockPrismaService.notification.findMany).toHaveBeenCalled();
    });
  });

  describe('getNotificationStats', () => {
    it('should return consolidated stats including BullMQ queue status', async () => {
      mockPrismaService.notification.count
        .mockResolvedValueOnce(50) // totalToday
        .mockResolvedValueOnce(45) // tapNotificationsToday
        .mockResolvedValueOnce(48) // deliveredToday
        .mockResolvedValueOnce(2)  // failedToday
        .mockResolvedValueOnce(5); // unreadCount

      mockQueue.getWaitingCount.mockResolvedValue(2);
      mockQueue.getActiveCount.mockResolvedValue(1);
      mockQueue.getCompletedCount.mockResolvedValue(47);
      mockQueue.getFailedCount.mockResolvedValue(2);

      const stats = await service.getNotificationStats(tenantId);

      expect(stats.totalDispatchedToday).toBe(50);
      expect(stats.tapNotificationsSentToday).toBe(45);
      expect(stats.deliverySuccessRate).toBe(96);
      expect(stats.unreadCount).toBe(5);
      expect(stats.queue.status).toBe('PROCESSING');
      expect(stats.queue.waiting).toBe(2);
    });
  });

  describe('markAsRead and markAllAsRead', () => {
    it('should mark a single notification as read', async () => {
      mockPrismaService.notification.update.mockResolvedValue({
        id: 'notif-1',
        isRead: true,
      });

      const res = await service.markAsRead(tenantId, 'notif-1');
      expect(res.isRead).toBe(true);
      expect(mockPrismaService.notification.update).toHaveBeenCalledWith({
        where: { id: 'notif-1', tenantId },
        data: { isRead: true },
      });
    });

    it('should mark all unread notifications as read', async () => {
      mockPrismaService.notification.updateMany.mockResolvedValue({ count: 7 });

      const res = await service.markAllAsRead(tenantId);
      expect(res.markedRead).toBe(7);
      expect(mockPrismaService.notification.updateMany).toHaveBeenCalledWith({
        where: { tenantId, isRead: false },
        data: { isRead: true },
      });
    });
  });

  describe('broadcastAnnouncement', () => {
    it('should create an announcement and add a job to BullMQ queue', async () => {
      const mockAnnouncement = {
        id: 'ann-1',
        tenantId,
        title: 'Classes Suspended',
        content: 'Heavy rainfall warning',
        audience: 'ALL',
        priority: 'URGENT',
      };

      mockPrismaService.announcement.create.mockResolvedValue(mockAnnouncement);

      const res = await service.broadcastAnnouncement(tenantId, {
        title: 'Classes Suspended',
        content: 'Heavy rainfall warning',
        audience: 'ALL',
        priority: 'URGENT' as any,
      });

      expect(res.success).toBe(true);
      expect(mockPrismaService.announcement.create).toHaveBeenCalled();
      expect(queue.add).toHaveBeenCalledWith(
        'send-broadcast',
        expect.objectContaining({
          tenantId,
          announcementId: 'ann-1',
          title: 'Classes Suspended',
        }),
        expect.any(Object),
      );
    });
  });

  describe('enqueueTapNotification', () => {
    it('should add send-tap-sms job to the attendance-notifications queue', async () => {
      await service.enqueueTapNotification({
        tenantId,
        studentId: 'stud-1',
        studentName: 'Maria Santos',
        parentPhone: '+639171234567',
        scanType: 'TIME_IN',
        attendanceStatus: 'PRESENT',
        deviceName: 'Turnstile A',
        scannedAt: new Date(),
      });

      expect(queue.add).toHaveBeenCalledWith(
        'send-tap-sms',
        expect.objectContaining({
          studentName: 'Maria Santos',
          scanType: 'TIME_IN',
          deviceName: 'Turnstile A',
        }),
        expect.any(Object),
      );
    });
  });
});
