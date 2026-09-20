import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { QueryUsersDto } from './dto/query-users.dto';
import { Role, UserStatus } from '@school-saas/shared';
import * as bcrypt from 'bcryptjs';
import { Prisma } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  // ==========================================
  // LIST USERS (FILTERED & PAGINATED)
  // ==========================================

  async getUsers(tenantId: string, query: QueryUsersDto) {
    const tenantWhere = tenantId ? { tenantId } : {};

    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const skip = (page - 1) * limit;

    const where: Prisma.UserWhereInput = {
      ...tenantWhere,
      ...(query.role ? { role: query.role } : {}),
      ...(query.status ? { status: query.status } : {}),
      ...(query.search
        ? {
            OR: [
              { firstName: { contains: query.search, mode: 'insensitive' } },
              { lastName: { contains: query.search, mode: 'insensitive' } },
              { email: { contains: query.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [total, users] = await Promise.all([
      this.prisma.user.count({ where }),
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          tenantId: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          status: true,
          avatarUrl: true,
          createdAt: true,
          updatedAt: true,
          teacher: {
            select: {
              id: true,
              employeeId: true,
              specialization: true,
            },
          },
        },
      }),
    ]);

    const formattedData = users.map((u) => ({
      id: u.id,
      tenantId: u.tenantId,
      email: u.email,
      firstName: u.firstName,
      lastName: u.lastName,
      fullName: `${u.firstName} ${u.lastName}`,
      role: u.role,
      status: u.status,
      avatarUrl: u.avatarUrl,
      createdAt: u.createdAt,
      updatedAt: u.updatedAt,
      linkedTeacher: u.teacher || null,
    }));

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
  // USER METRICS & COUNTS
  // ==========================================

  async getUserStats(tenantId: string) {
    const tenantWhere = tenantId ? { tenantId } : {};

    const users = await this.prisma.user.findMany({
      where: tenantWhere,
      select: {
        role: true,
        status: true,
      },
    });

    const totalUsers = users.length;
    const schoolAdmins = users.filter((u) => u.role === Role.SCHOOL_ADMIN).length;
    const teachers = users.filter((u) => u.role === Role.TEACHER).length;
    const staff = users.filter((u) => u.role === Role.STAFF).length;
    const activeUsers = users.filter((u) => u.status === UserStatus.ACTIVE).length;
    const suspendedUsers = users.filter((u) => u.status === UserStatus.SUSPENDED).length;

    const activeRate =
      totalUsers > 0 ? Number(((activeUsers / totalUsers) * 100).toFixed(1)) : 0;

    return {
      totalUsers,
      schoolAdmins,
      teachers,
      staff,
      activeUsers,
      suspendedUsers,
      activeRate,
    };
  }

  // ==========================================
  // GET SINGLE USER PROFILE
  // ==========================================

  async getUserById(tenantId: string, id: string) {
    const tenantWhere = tenantId ? { tenantId } : {};

    const user = await this.prisma.user.findFirst({
      where: {
        id,
        ...tenantWhere,
      },
      select: {
        id: true,
        tenantId: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        status: true,
        avatarUrl: true,
        createdAt: true,
        updatedAt: true,
        teacher: {
          select: {
            id: true,
            employeeId: true,
            specialization: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException(`User with ID "${id}" not found`);
    }

    return {
      ...user,
      fullName: `${user.firstName} ${user.lastName}`,
    };
  }

  // ==========================================
  // CREATE STAFF / ADMIN ACCOUNT
  // ==========================================

  async createUser(tenantId: string, dto: CreateUserDto) {
    const resolvedTenantId =
      tenantId ||
      (await this.prisma.tenant.findFirst({
        where: { status: 'ACTIVE' },
        select: { id: true },
      }))?.id;

    if (!resolvedTenantId) {
      throw new BadRequestException('No active school tenant found.');
    }

    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase().trim() },
    });

    if (existingUser) {
      throw new ConflictException(`Email "${dto.email}" is already registered in the system.`);
    }

    if (dto.role === Role.SUPER_ADMIN) {
      throw new BadRequestException('Cannot create SUPER_ADMIN account from school administration.');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    const created = await this.prisma.user.create({
      data: {
        tenantId: resolvedTenantId,
        email: dto.email.toLowerCase().trim(),
        passwordHash,
        firstName: dto.firstName.trim(),
        lastName: dto.lastName.trim(),
        role: dto.role,
        status: UserStatus.ACTIVE,
      },
      select: {
        id: true,
        tenantId: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        status: true,
        createdAt: true,
      },
    });

    return {
      success: true,
      message: `User account for ${created.firstName} ${created.lastName} created successfully.`,
      data: created,
    };
  }

  // ==========================================
  // UPDATE USER DETAILS & ROLE
  // ==========================================

  async updateUser(tenantId: string, id: string, dto: UpdateUserDto) {
    const tenantWhere = tenantId ? { tenantId } : {};

    const user = await this.prisma.user.findFirst({
      where: {
        id,
        ...tenantWhere,
      },
    });

    if (!user) {
      throw new NotFoundException(`User with ID "${id}" not found`);
    }

    if (dto.role === Role.SUPER_ADMIN && user.role !== Role.SUPER_ADMIN) {
      throw new BadRequestException('Cannot elevate account to SUPER_ADMIN role.');
    }

    const updated = await this.prisma.user.update({
      where: { id: user.id },
      data: {
        firstName: dto.firstName?.trim() || undefined,
        lastName: dto.lastName?.trim() || undefined,
        role: dto.role || undefined,
        status: dto.status || undefined,
      },
      select: {
        id: true,
        tenantId: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        status: true,
        updatedAt: true,
      },
    });

    return {
      success: true,
      message: `Account for ${updated.firstName} ${updated.lastName} updated successfully.`,
      data: updated,
    };
  }

  // ==========================================
  // RESET PASSWORD
  // ==========================================

  async resetPassword(tenantId: string, id: string, newPassword: string) {
    const tenantWhere = tenantId ? { tenantId } : {};

    const user = await this.prisma.user.findFirst({
      where: {
        id,
        ...tenantWhere,
      },
    });

    if (!user) {
      throw new NotFoundException(`User with ID "${id}" not found`);
    }

    if (newPassword.length < 8) {
      throw new BadRequestException('Password must be at least 8 characters long');
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);

    await this.prisma.user.update({
      where: { id: user.id },
      data: { passwordHash },
    });

    return {
      success: true,
      message: `Password for ${user.email} has been reset successfully.`,
    };
  }

  // ==========================================
  // DEACTIVATE / DELETE USER
  // ==========================================

  async deleteUser(tenantId: string, id: string) {
    const tenantWhere = tenantId ? { tenantId } : {};

    const user = await this.prisma.user.findFirst({
      where: {
        id,
        ...tenantWhere,
      },
    });

    if (!user) {
      throw new NotFoundException(`User with ID "${id}" not found`);
    }

    // Soft deactivate user account
    const deactivated = await this.prisma.user.update({
      where: { id: user.id },
      data: { status: UserStatus.INACTIVE },
      select: {
        id: true,
        email: true,
        status: true,
      },
    });

    return {
      success: true,
      message: `Account for ${deactivated.email} has been deactivated.`,
      data: deactivated,
    };
  }
}
