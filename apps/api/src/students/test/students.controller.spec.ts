import { Test, TestingModule } from '@nestjs/testing';
import { StudentsController } from '../students.controller';
import { StudentsService } from '../students.service';

describe('StudentsController', () => {
  let controller: StudentsController;
  let service: {
    findAll: jest.Mock;
    findOne: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
    assignRfid: jest.Mock;
    remove: jest.Mock;
    getStats: jest.Mock;
  };

  beforeEach(async () => {
    service = {
      findAll: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      assignRfid: jest.fn(),
      remove: jest.fn(),
      getStats: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [StudentsController],
      providers: [{ provide: StudentsService, useValue: service }],
    }).compile();

    controller = module.get<StudentsController>(StudentsController);
  });

  it('should return paginated students envelope', async () => {
    const mockResponse = {
      data: [{ id: '1', firstName: 'Juan', lastName: 'Dela Cruz' }] as any,
      meta: { total: 1, page: 1, limit: 10, totalPages: 1 },
    };
    service.findAll.mockResolvedValue(mockResponse);

    const req = { tenantId: 'tenant-1' };
    const result = await controller.findAll(req, { page: 1, limit: 10 });

    expect(result.success).toBe(true);
    expect(result.data).toEqual(mockResponse.data);
    expect(result.meta.total).toBe(1);
  });

  it('should return enrolled student with success message', async () => {
    const student = { id: 's-1', firstName: 'Maria', lastName: 'Clara' } as any;
    service.create.mockResolvedValue(student);

    const req = { tenantId: 'tenant-1' };
    const result = await controller.create(req, {
      studentId: '2026-0002',
      firstName: 'Maria',
      lastName: 'Clara',
    });

    expect(result.success).toBe(true);
    expect(result.data).toEqual(student);
    expect(result.message).toBe('Student enrolled successfully');
  });
});
