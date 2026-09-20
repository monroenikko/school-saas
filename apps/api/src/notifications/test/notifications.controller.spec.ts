import { Test, TestingModule } from '@nestjs/testing';
import { NotificationsController } from '../notifications.controller';
import { NotificationsService } from '../notifications.service';

describe('NotificationsController', () => {
  let controller: NotificationsController;
  let service: NotificationsService;

  const mockService = {
    getNotifications: jest.fn(),
    getNotificationStats: jest.fn(),
    getAnnouncements: jest.fn(),
    broadcastAnnouncement: jest.fn(),
    markAllAsRead: jest.fn(),
    markAsRead: jest.fn(),
    simulateTapAlert: jest.fn(),
  };

  const mockReq = {
    tenantId: 'tenant-1',
  } as any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [NotificationsController],
      providers: [
        {
          provide: NotificationsService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<NotificationsController>(NotificationsController);
    service = module.get<NotificationsService>(NotificationsService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should call getNotifications', async () => {
    mockService.getNotifications.mockResolvedValue({ data: [], meta: {} });
    await controller.getNotifications(mockReq, { page: 1, limit: 10 });
    expect(mockService.getNotifications).toHaveBeenCalledWith('tenant-1', { page: 1, limit: 10 });
  });

  it('should call getStats', async () => {
    mockService.getNotificationStats.mockResolvedValue({ totalDispatchedToday: 10 });
    const res = await controller.getStats(mockReq);
    expect(mockService.getNotificationStats).toHaveBeenCalledWith('tenant-1');
    expect(res).toEqual({ totalDispatchedToday: 10 });
  });

  it('should call getAnnouncements', async () => {
    mockService.getAnnouncements.mockResolvedValue([]);
    await controller.getAnnouncements(mockReq);
    expect(mockService.getAnnouncements).toHaveBeenCalledWith('tenant-1');
  });

  it('should call broadcast', async () => {
    const dto = { title: 'Test Alert', content: 'Notice content', audience: 'ALL' };
    mockService.broadcastAnnouncement.mockResolvedValue({ success: true });
    await controller.broadcast(mockReq, dto as any);
    expect(mockService.broadcastAnnouncement).toHaveBeenCalledWith('tenant-1', dto);
  });

  it('should call markAllAsRead', async () => {
    mockService.markAllAsRead.mockResolvedValue({ markedRead: 5 });
    await controller.markAllAsRead(mockReq);
    expect(mockService.markAllAsRead).toHaveBeenCalledWith('tenant-1');
  });

  it('should call markAsRead', async () => {
    mockService.markAsRead.mockResolvedValue({ id: 'notif-1', isRead: true });
    await controller.markAsRead(mockReq, 'notif-1');
    expect(mockService.markAsRead).toHaveBeenCalledWith('tenant-1', 'notif-1');
  });

  it('should call simulateTapAlert', async () => {
    const dto = { studentId: 'stud-1' };
    mockService.simulateTapAlert.mockResolvedValue({ success: true });
    await controller.simulateTapAlert(mockReq, dto as any);
    expect(mockService.simulateTapAlert).toHaveBeenCalledWith('tenant-1', dto);
  });
});
