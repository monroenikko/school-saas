import { Test, TestingModule } from '@nestjs/testing';
import { TransactionsService } from '../transactions.service';
import { PrismaService } from '../../prisma/prisma.service';
import { PaymentMethod, PaymentStatus, TransactionType } from '@school-saas/shared';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

describe('TransactionsService', () => {
  let service: TransactionsService;
  let prisma: PrismaService;

  const tenantId = 'tenant-st-jude';

  const mockTransaction = {
    id: 'txn-uuid-1',
    tenantId,
    studentId: 'stud-uuid-1',
    parentId: 'parent-uuid-1',
    referenceNo: 'TXN-20260920-1001',
    title: '1st Quarter Tuition Fee',
    description: 'Quarterly tuition',
    amount: new Prisma.Decimal(5000),
    type: TransactionType.TUITION,
    status: PaymentStatus.PENDING,
    paymentMethod: null,
    dueDate: new Date('2026-10-15'),
    paidAt: null,
    receiptUrl: null,
    remarks: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    student: {
      id: 'stud-uuid-1',
      studentId: '2026-0001',
      firstName: 'Juan',
      lastName: 'Dela Cruz',
      middleName: 'Reyes',
      sectionStudents: [
        {
          status: 'ACTIVE',
          section: {
            id: 'sec-1',
            name: 'Diamond',
            gradeLevel: 'Grade 7',
          },
        },
      ],
    },
    parent: {
      id: 'parent-uuid-1',
      firstName: 'Pedro',
      lastName: 'Dela Cruz',
      email: 'pedro@example.com',
      phone: '09171234567',
      address: 'Quezon City',
    },
    tenant: {
      id: tenantId,
      name: 'St. Jude International Academy',
      address: 'Quezon City',
      phone: '123-4567',
      email: 'info@stjude.edu.ph',
      currency: 'PHP',
      logoUrl: null,
    },
  };

  const mockPrismaService = {
    tenant: {
      findFirst: jest.fn(),
    },
    parentTransaction: {
      count: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    student: {
      findFirst: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransactionsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<TransactionsService>(TransactionsService);
    prisma = module.get<PrismaService>(PrismaService);
    jest.clearAllMocks();
  });

  describe('getTransactions', () => {
    it('should return paginated and formatted transaction list', async () => {
      mockPrismaService.parentTransaction.count.mockResolvedValue(1);
      mockPrismaService.parentTransaction.findMany.mockResolvedValue([mockTransaction]);

      const result = await service.getTransactions(tenantId, { page: 1, limit: 10 });

      expect(result.data).toHaveLength(1);
      expect(result.data[0].referenceNo).toBe('TXN-20260920-1001');
      expect(result.data[0].amount).toBe(5000);
      expect(result.data[0].student?.fullName).toBe('Dela Cruz, Juan R.');
      expect(result.data[0].parent?.fullName).toBe('Pedro Dela Cruz');
      expect(result.meta.total).toBe(1);
    });
  });

  describe('getTransactionStats', () => {
    it('should calculate revenue and collection rate correctly', async () => {
      mockPrismaService.parentTransaction.findMany.mockResolvedValue([
        { amount: new Prisma.Decimal(5000), status: PaymentStatus.COMPLETED, dueDate: null },
        { amount: new Prisma.Decimal(3000), status: PaymentStatus.PENDING, dueDate: new Date('2026-10-15') },
        { amount: new Prisma.Decimal(2000), status: PaymentStatus.PENDING, dueDate: new Date('2026-08-01') }, // Overdue
      ]);

      const stats = await service.getTransactionStats(tenantId);

      expect(stats.totalInvoiced).toBe(10000);
      expect(stats.totalCollected).toBe(5000);
      expect(stats.pendingReceivables).toBe(5000);
      expect(stats.completedCount).toBe(1);
      expect(stats.pendingCount).toBe(2);
      expect(stats.collectionRate).toBe(50);
    });
  });

  describe('createTransaction', () => {
    it('should create an invoice with auto-generated reference number', async () => {
      mockPrismaService.student.findFirst.mockResolvedValue({
        id: 'stud-uuid-1',
        parents: [{ parentId: 'parent-uuid-1' }],
      });
      mockPrismaService.parentTransaction.create.mockResolvedValue({
        ...mockTransaction,
        referenceNo: 'TXN-20260920-9999',
      });

      const result = await service.createTransaction(tenantId, {
        studentId: 'stud-uuid-1',
        title: 'Tuition Q1',
        amount: 5000,
        type: TransactionType.TUITION,
      });

      expect(result.success).toBe(true);
      expect(result.data.amount).toBe(5000);
      expect(mockPrismaService.parentTransaction.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            title: 'Tuition Q1',
            status: PaymentStatus.PENDING,
          }),
        }),
      );
    });
  });

  describe('recordPayment', () => {
    it('should update invoice to COMPLETED with payment method and timestamp', async () => {
      mockPrismaService.parentTransaction.findFirst.mockResolvedValue(mockTransaction);
      mockPrismaService.parentTransaction.update.mockResolvedValue({
        ...mockTransaction,
        status: PaymentStatus.COMPLETED,
        paymentMethod: PaymentMethod.GCASH,
        receiptUrl: 'OR-2026-0042',
      });

      const result = await service.recordPayment(tenantId, 'txn-uuid-1', {
        paymentMethod: PaymentMethod.GCASH,
        receiptNumber: 'OR-2026-0042',
      });

      expect(result.success).toBe(true);
      expect(mockPrismaService.parentTransaction.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: PaymentStatus.COMPLETED,
            paymentMethod: PaymentMethod.GCASH,
          }),
        }),
      );
    });

    it('should throw BadRequestException if invoice is already completed', async () => {
      mockPrismaService.parentTransaction.findFirst.mockResolvedValue({
        ...mockTransaction,
        status: PaymentStatus.COMPLETED,
      });

      await expect(
        service.recordPayment(tenantId, 'txn-uuid-1', {
          paymentMethod: PaymentMethod.CASH,
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('cancelTransaction', () => {
    it('should cancel an unpaid invoice', async () => {
      mockPrismaService.parentTransaction.findFirst.mockResolvedValue(mockTransaction);
      mockPrismaService.parentTransaction.update.mockResolvedValue({
        ...mockTransaction,
        status: PaymentStatus.CANCELLED,
      });

      const result = await service.cancelTransaction(tenantId, 'txn-uuid-1', 'Duplicate invoice');

      expect(result.success).toBe(true);
      expect(mockPrismaService.parentTransaction.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: PaymentStatus.CANCELLED,
            remarks: 'Duplicate invoice',
          }),
        }),
      );
    });
  });
});
