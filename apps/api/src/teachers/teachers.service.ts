import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTeacherDto } from './dto/create-teacher.dto';
import { UpdateTeacherDto } from './dto/update-teacher.dto';
import { QueryTeacherDto } from './dto/query-teacher.dto';
import { TeacherStatus } from '@school-saas/shared';

@Injectable()
export class TeachersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(tenantId: string, query: QueryTeacherDto) {
    const {
      page = 1,
      limit = 10,
      search,
      status,
      specialization,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = query;

    const skip = (page - 1) * limit;

    const where: any = {
      tenantId,
      ...(status ? { status } : {}),
      ...(specialization ? { specialization } : {}),
    };

    if (search) {
      where.OR = [
        { employeeId: { contains: search, mode: 'insensitive' } },
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { specialization: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [teachers, total] = await Promise.all([
      this.prisma.teacher.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          advisorySections: {
            select: {
              id: true,
              name: true,
              gradeLevel: true,
            },
          },
          _count: {
            select: {
              subjectClasses: true,
            },
          },
        },
      }),
      this.prisma.teacher.count({ where }),
    ]);

    return {
      data: teachers,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  async findOne(tenantId: string, id: string) {
    const teacher = await this.prisma.teacher.findFirst({
      where: { id, tenantId },
      include: {
        advisorySections: true,
        subjectClasses: {
          include: {
            subject: true,
            section: true,
          },
        },
      },
    });

    if (!teacher) {
      throw new NotFoundException(`Teacher with ID "${id}" not found`);
    }

    return teacher;
  }

  async create(tenantId: string, dto: CreateTeacherDto) {
    const existing = await this.prisma.teacher.findUnique({
      where: {
        tenantId_employeeId: {
          tenantId,
          employeeId: dto.employeeId,
        },
      },
    });

    if (existing) {
      throw new ConflictException(
        `Teacher with Employee ID "${dto.employeeId}" already exists in this school`,
      );
    }

    return this.prisma.teacher.create({
      data: {
        ...dto,
        tenantId,
        status: dto.status || TeacherStatus.ACTIVE,
      },
    });
  }

  async update(tenantId: string, id: string, dto: UpdateTeacherDto) {
    const teacher = await this.prisma.teacher.findFirst({
      where: { id, tenantId },
    });

    if (!teacher) {
      throw new NotFoundException(`Teacher with ID "${id}" not found`);
    }

    if (dto.employeeId && dto.employeeId !== teacher.employeeId) {
      const existing = await this.prisma.teacher.findUnique({
        where: {
          tenantId_employeeId: {
            tenantId,
            employeeId: dto.employeeId,
          },
        },
      });

      if (existing) {
        throw new ConflictException(
          `Teacher with Employee ID "${dto.employeeId}" already exists in this school`,
        );
      }
    }

    return this.prisma.teacher.update({
      where: { id },
      data: dto,
    });
  }

  async remove(tenantId: string, id: string) {
    const teacher = await this.prisma.teacher.findFirst({
      where: { id, tenantId },
    });

    if (!teacher) {
      throw new NotFoundException(`Teacher with ID "${id}" not found`);
    }

    // Soft delete
    return this.prisma.teacher.update({
      where: { id },
      data: { status: TeacherStatus.INACTIVE },
    });
  }

  async getStats(tenantId: string) {
    const [total, active, onLeave] = await Promise.all([
      this.prisma.teacher.count({ where: { tenantId } }),
      this.prisma.teacher.count({
        where: { tenantId, status: TeacherStatus.ACTIVE },
      }),
      this.prisma.teacher.count({
        where: { tenantId, status: TeacherStatus.ON_LEAVE },
      }),
    ]);

    return {
      total,
      active,
      onLeave,
    };
  }
}
