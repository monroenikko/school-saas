import { Test, TestingModule } from '@nestjs/testing';
import { ReportsController } from '../reports.controller';
import { ReportsService } from '../reports.service';

describe('ReportsController', () => {
  let controller: ReportsController;
  let service: ReportsService;

  const mockService = {
    generateSF1: jest.fn(),
    generateSF2: jest.fn(),
    generateSF9: jest.fn(),
    generateFinancialSummary: jest.fn(),
    exportCSV: jest.fn(),
  };

  const mockReq = {
    tenantId: 'tenant-1',
  } as any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ReportsController],
      providers: [
        {
          provide: ReportsService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<ReportsController>(ReportsController);
    service = module.get<ReportsService>(ReportsService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should call generateSF1', async () => {
    mockService.generateSF1.mockResolvedValue({ school: {} });
    await controller.getSF1(mockReq, { sectionId: 'sec-1' });
    expect(mockService.generateSF1).toHaveBeenCalledWith('tenant-1', { sectionId: 'sec-1' });
  });

  it('should call generateSF2', async () => {
    mockService.generateSF2.mockResolvedValue({ school: {} });
    await controller.getSF2(mockReq, { sectionId: 'sec-1', month: 9, year: 2026 });
    expect(mockService.generateSF2).toHaveBeenCalledWith('tenant-1', { sectionId: 'sec-1', month: 9, year: 2026 });
  });

  it('should call generateSF9', async () => {
    mockService.generateSF9.mockResolvedValue({ student: {} });
    await controller.getSF9(mockReq, 'stud-1');
    expect(mockService.generateSF9).toHaveBeenCalledWith('tenant-1', 'stud-1');
  });

  it('should call generateFinancialSummary', async () => {
    mockService.generateFinancialSummary.mockResolvedValue({ metrics: {} });
    await controller.getFinancialSummary(mockReq, { startDate: '2026-09-01' });
    expect(mockService.generateFinancialSummary).toHaveBeenCalledWith('tenant-1', { startDate: '2026-09-01' });
  });

  it('should handle exportCSV', async () => {
    const mockRes = {
      setHeader: jest.fn(),
      send: jest.fn(),
    } as any;
    mockService.exportCSV.mockResolvedValue('a,b,c');

    await controller.exportCSV(mockReq, mockRes, { type: 'SF1' });

    expect(mockService.exportCSV).toHaveBeenCalledWith('SF1', 'tenant-1', { type: 'SF1' });
    expect(mockRes.setHeader).toHaveBeenCalledWith('Content-Type', 'text/csv');
    expect(mockRes.send).toHaveBeenCalledWith('a,b,c');
  });
});
