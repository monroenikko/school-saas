import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { RecordPaymentDto } from './dto/record-payment.dto';
import { QueryTransactionsDto } from './dto/query-transactions.dto';
import { PaymentStatus, TransactionType } from '@school-saas/shared';
import { Prisma } from '@prisma/client';

@Injectable()
export class TransactionsService {
  constructor(private readonly prisma: PrismaService) {}

  // ==========================================
  // LIST TRANSACTIONS (FILTERED & PAGINATED)
  // ==========================================

  async getTransactions(tenantId: string, query: QueryTransactionsDto) {
    const tenantWhere = tenantId ? { tenantId } : {};

    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const skip = (page - 1) * limit;

    const where: Prisma.ParentTransactionWhereInput = {
      ...tenantWhere,
      ...(query.status ? { status: query.status } : {}),
      ...(query.type ? { type: query.type } : {}),
      ...(query.studentId ? { studentId: query.studentId } : {}),
      ...(query.parentId ? { parentId: query.parentId } : {}),
      ...(query.search
        ? {
            OR: [
              { referenceNo: { contains: query.search, mode: 'insensitive' } },
              { title: { contains: query.search, mode: 'insensitive' } },
              {
                student: {
                  OR: [
                    { firstName: { contains: query.search, mode: 'insensitive' } },
                    { lastName: { contains: query.search, mode: 'insensitive' } },
                    { studentId: { contains: query.search, mode: 'insensitive' } },
                  ],
                },
              },
              {
                parent: {
                  OR: [
                    { firstName: { contains: query.search, mode: 'insensitive' } },
                    { lastName: { contains: query.search, mode: 'insensitive' } },
                    { phone: { contains: query.search, mode: 'insensitive' } },
                  ],
                },
              },
            ],
          }
        : {}),
    };

    const [total, transactions] = await Promise.all([
      this.prisma.parentTransaction.count({ where }),
      this.prisma.parentTransaction.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          student: {
            select: {
              id: true,
              studentId: true,
              firstName: true,
              lastName: true,
              middleName: true,
              sectionStudents: {
                where: { status: 'ACTIVE' },
                select: {
                  section: {
                    select: {
                      id: true,
                      name: true,
                      gradeLevel: true,
                    },
                  },
                },
              },
            },
          },
          parent: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
              address: true,
            },
          },
        },
      }),
    ]);

    const formattedData = transactions.map((t) => {
      const activeSection = t.student?.sectionStudents?.[0]?.section;
      return {
        id: t.id,
        referenceNo: t.referenceNo,
        title: t.title,
        description: t.description,
        amount: Number(t.amount),
        type: t.type,
        status: t.status,
        paymentMethod: t.paymentMethod,
        dueDate: t.dueDate,
        paidAt: t.paidAt,
        receiptUrl: t.receiptUrl,
        remarks: t.remarks,
        createdAt: t.createdAt,
        student: t.student
          ? {
              id: t.student.id,
              studentId: t.student.studentId,
              fullName: `${t.student.lastName}, ${t.student.firstName}${
                t.student.middleName ? ` ${t.student.middleName[0]}.` : ''
              }`,
              sectionName: activeSection?.name || 'Unassigned',
              gradeLevel: activeSection?.gradeLevel || 'N/A',
            }
          : null,
        parent: t.parent
          ? {
              id: t.parent.id,
              fullName: `${t.parent.firstName} ${t.parent.lastName}`,
              email: t.parent.email,
              phone: t.parent.phone,
            }
          : null,
      };
    });

    return {
      data: formattedData,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  // ==========================================
  // FINANCIAL KPI SUMMARY STATS
  // ==========================================

  async getTransactionStats(tenantId: string) {
    const tenantWhere = tenantId ? { tenantId } : {};

    const allTxns = await this.prisma.parentTransaction.findMany({
      where: tenantWhere,
      select: {
        amount: true,
        status: true,
        dueDate: true,
      },
    });

    const now = new Date();
    let totalInvoiced = 0;
    let totalCollected = 0;
    let pendingReceivables = 0;
    let overdueCount = 0;
    let completedCount = 0;
    let pendingCount = 0;

    for (const t of allTxns) {
      const amount = Number(t.amount);
      totalInvoiced += amount;

      if (t.status === PaymentStatus.COMPLETED) {
        totalCollected += amount;
        completedCount++;
      } else if (t.status === PaymentStatus.PENDING) {
        pendingReceivables += amount;
        pendingCount++;
        if (t.dueDate && new Date(t.dueDate) < now) {
          overdueCount++;
        }
      }
    }

    const collectionRate =
      totalInvoiced > 0
        ? Number(((totalCollected / totalInvoiced) * 100).toFixed(1))
        : 0;

    return {
      totalInvoiced: Number(totalInvoiced.toFixed(2)),
      totalCollected: Number(totalCollected.toFixed(2)),
      pendingReceivables: Number(pendingReceivables.toFixed(2)),
      totalTransactions: allTxns.length,
      completedCount,
      pendingCount,
      overdueCount,
      collectionRate,
    };
  }

  // ==========================================
  // GET SINGLE TRANSACTION / INVOICE DETAIL
  // ==========================================

  async getTransactionById(tenantId: string, id: string) {
    const tenantWhere = tenantId ? { tenantId } : {};

    const transaction = await this.prisma.parentTransaction.findFirst({
      where: {
        id,
        ...tenantWhere,
      },
      include: {
        tenant: {
          select: {
            id: true,
            name: true,
            address: true,
            phone: true,
            email: true,
            currency: true,
            logoUrl: true,
          },
        },
        student: {
          select: {
            id: true,
            studentId: true,
            firstName: true,
            lastName: true,
            middleName: true,
            sectionStudents: {
              where: { status: 'ACTIVE' },
              select: {
                section: {
                  select: {
                    id: true,
                    name: true,
                    gradeLevel: true,
                  },
                },
              },
            },
          },
        },
        parent: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            address: true,
          },
        },
      },
    });

    if (!transaction) {
      throw new NotFoundException(`Transaction invoice with ID "${id}" not found`);
    }

    const activeSection = transaction.student?.sectionStudents?.[0]?.section;

    return {
      id: transaction.id,
      referenceNo: transaction.referenceNo,
      title: transaction.title,
      description: transaction.description,
      amount: Number(transaction.amount),
      type: transaction.type,
      status: transaction.status,
      paymentMethod: transaction.paymentMethod,
      dueDate: transaction.dueDate,
      paidAt: transaction.paidAt,
      receiptUrl: transaction.receiptUrl,
      remarks: transaction.remarks,
      createdAt: transaction.createdAt,
      tenant: transaction.tenant,
      student: transaction.student
        ? {
            id: transaction.student.id,
            studentId: transaction.student.studentId,
            fullName: `${transaction.student.lastName}, ${transaction.student.firstName}${
              transaction.student.middleName ? ` ${transaction.student.middleName[0]}.` : ''
            }`,
            sectionName: activeSection?.name || 'Unassigned',
            gradeLevel: activeSection?.gradeLevel || 'N/A',
          }
        : null,
      parent: transaction.parent
        ? {
            id: transaction.parent.id,
            fullName: `${transaction.parent.firstName} ${transaction.parent.lastName}`,
            email: transaction.parent.email,
            phone: transaction.parent.phone,
            address: transaction.parent.address,
          }
        : null,
    };
  }

  // ==========================================
  // CREATE FEE ASSESSMENT / INVOICE
  // ==========================================

  async createTransaction(tenantId: string, dto: CreateTransactionDto) {
    const resolvedTenantId =
      tenantId ||
      (await this.prisma.tenant.findFirst({
        where: { status: 'ACTIVE' },
        select: { id: true },
      }))?.id;

    if (!resolvedTenantId) {
      throw new BadRequestException('No active school tenant found.');
    }

    let parentId = dto.parentId;

    if (dto.studentId) {
      const student = await this.prisma.student.findFirst({
        where: { id: dto.studentId, tenantId: resolvedTenantId },
        include: {
          parents: {
            take: 1,
            select: { parentId: true },
          },
        },
      });

      if (!student) {
        throw new NotFoundException(`Student with ID "${dto.studentId}" not found`);
      }

      if (!parentId && student.parents.length > 0) {
        parentId = student.parents[0].parentId;
      }
    }

    // Auto-generate unique reference number: TXN-YYYYMMDD-XXXX
    const datePrefix = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const referenceNo = `TXN-${datePrefix}-${randomSuffix}`;

    const created = await this.prisma.parentTransaction.create({
      data: {
        tenantId: resolvedTenantId,
        referenceNo,
        title: dto.title.trim(),
        description: dto.description?.trim() || null,
        amount: new Prisma.Decimal(dto.amount),
        type: dto.type,
        status: PaymentStatus.PENDING,
        studentId: dto.studentId || null,
        parentId: parentId || null,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
        remarks: dto.remarks?.trim() || null,
      },
      include: {
        student: {
          select: {
            id: true,
            studentId: true,
            firstName: true,
            lastName: true,
          },
        },
        parent: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return {
      success: true,
      message: `Transaction invoice ${created.referenceNo} issued successfully.`,
      data: {
        ...created,
        amount: Number(created.amount),
      },
    };
  }

  // ==========================================
  // RECORD CASHIER / ONLINE PAYMENT
  // ==========================================

  async recordPayment(tenantId: string, id: string, dto: RecordPaymentDto) {
    const tenantWhere = tenantId ? { tenantId } : {};

    const transaction = await this.prisma.parentTransaction.findFirst({
      where: {
        id,
        ...tenantWhere,
      },
    });

    if (!transaction) {
      throw new NotFoundException(`Transaction with ID "${id}" not found`);
    }

    if (transaction.status === PaymentStatus.COMPLETED) {
      throw new BadRequestException('This invoice has already been paid and settled.');
    }

    if (transaction.status === PaymentStatus.CANCELLED) {
      throw new BadRequestException('Cannot record payment for a cancelled invoice.');
    }

    const paidAt = dto.paidAt ? new Date(dto.paidAt) : new Date();

    const updated = await this.prisma.parentTransaction.update({
      where: { id: transaction.id },
      data: {
        status: PaymentStatus.COMPLETED,
        paymentMethod: dto.paymentMethod,
        paidAt,
        receiptUrl: dto.receiptNumber?.trim() || dto.receiptUrl?.trim() || transaction.receiptUrl || null,
        remarks: dto.remarks?.trim()
          ? `${transaction.remarks ? `${transaction.remarks} | ` : ''}${dto.remarks.trim()}`
          : transaction.remarks,
      },
      include: {
        student: {
          select: {
            id: true,
            studentId: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return {
      success: true,
      message: `Payment of ₱${Number(updated.amount).toLocaleString()} successfully recorded for ${updated.referenceNo}.`,
      data: {
        ...updated,
        amount: Number(updated.amount),
      },
    };
  }

  // ==========================================
  // CANCEL / VOID INVOICE
  // ==========================================

  async cancelTransaction(tenantId: string, id: string, remarks?: string) {
    const tenantWhere = tenantId ? { tenantId } : {};

    const transaction = await this.prisma.parentTransaction.findFirst({
      where: {
        id,
        ...tenantWhere,
      },
    });

    if (!transaction) {
      throw new NotFoundException(`Transaction with ID "${id}" not found`);
    }

    if (transaction.status === PaymentStatus.COMPLETED) {
      throw new BadRequestException('Cannot cancel an invoice that has already been paid.');
    }

    const updated = await this.prisma.parentTransaction.update({
      where: { id: transaction.id },
      data: {
        status: PaymentStatus.CANCELLED,
        remarks: remarks?.trim() || 'Invoice cancelled by administrator.',
      },
    });

    return {
      success: true,
      message: `Invoice ${updated.referenceNo} has been voided.`,
      data: updated,
    };
  }
}
