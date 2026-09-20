import { Test, TestingModule } from '@nestjs/testing';
import { IdCardsController } from '../id-cards.controller';
import { IdCardsService } from '../id-cards.service';
import { CardOrientation } from '../dto/id-card-template.dto';

describe('IdCardsController', () => {
  let controller: IdCardsController;
  let service: IdCardsService;

  const mockService = {
    getTemplates: jest.fn(),
    getStudentBadgeData: jest.fn(),
    getBatchBadgeData: jest.fn(),
    saveCustomTemplate: jest.fn(),
  };

  const mockReq = {
    tenantId: 'tenant-1',
  } as any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [IdCardsController],
      providers: [
        {
          provide: IdCardsService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<IdCardsController>(IdCardsController);
    service = module.get<IdCardsService>(IdCardsService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should call getTemplates', () => {
    mockService.getTemplates.mockReturnValue([]);
    controller.getTemplates(mockReq);
    expect(mockService.getTemplates).toHaveBeenCalledWith('tenant-1');
  });

  it('should call getStudentBadge', async () => {
    mockService.getStudentBadgeData.mockResolvedValue({ id: 'stud-1' });
    await controller.getStudentBadge(mockReq, 'stud-1');
    expect(mockService.getStudentBadgeData).toHaveBeenCalledWith('tenant-1', 'stud-1');
  });

  it('should call getBatchBadges', async () => {
    mockService.getBatchBadgeData.mockResolvedValue({ total: 0, badges: [] });
    await controller.getBatchBadges(mockReq, { sectionId: 'sec-1' });
    expect(mockService.getBatchBadgeData).toHaveBeenCalledWith('tenant-1', { sectionId: 'sec-1' });
  });

  it('should call saveTemplate', () => {
    const dto = {
      name: 'Custom Badge',
      orientation: CardOrientation.PORTRAIT,
      accentColor: '#059669',
      headerColor: '#064e3b',
      textColor: '#0f172a',
      showQrCode: true,
      showBarcode: true,
      showRfidUid: true,
      showGuardianInfo: true,
      safeMarginPercent: 5,
    };
    mockService.saveCustomTemplate.mockReturnValue({ success: true });
    controller.saveTemplate(mockReq, dto);
    expect(mockService.saveCustomTemplate).toHaveBeenCalledWith('tenant-1', dto);
  });
});
