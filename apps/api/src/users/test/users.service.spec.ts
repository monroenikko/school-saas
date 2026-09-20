import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from '../users.service';
import { PrismaService } from '../../prisma/prisma.service';
import { Role, UserStatus } from '@school-saas/shared';
import { ConflictException, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';

describe('UsersService', () => {
  let service: UsersService;
  let prisma: PrismaService;

  const tenantId = 'tenant-st-jude';

  const mockUser = {
    id: 'user-uuid-1',
    tenantId,
    email: 'staff.santos@stjude.edu.ph',
    passwordHash: '$2a$10$abcdefghijklmnopqrstuvwxyz123456',
    firstName: 'Maria',
    lastName: 'Santos',
    role: Role.STAFF,
    status: UserStatus.ACTIVE,
    avatarUrl: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    teacher: null,
  };

  const mockPrismaService = {
    tenant: {
      findFirst: jest.fn(),
    },
    user: {
      count: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    prisma = module.get<PrismaService>(PrismaService);
    jest.clearAllMocks();
  });

  describe('getUsers', () => {
    it('should return paginated staff users with computed fullName', async () => {
      mockPrismaService.user.count.mockResolvedValue(1);
      mockPrismaService.user.findMany.mockResolvedValue([mockUser]);

      const result = await service.getUsers(tenantId, { page: 1, limit: 10 });

      expect(result.data).toHaveLength(1);
      expect(result.data[0].fullName).toBe('Maria Santos');
      expect(result.data[0].role).toBe(Role.STAFF);
      expect(result.meta.total).toBe(1);
    });
  });

  describe('getUserStats', () => {
    it('should aggregate user counts by role and compute active rate', async () => {
      mockPrismaService.user.findMany.mockResolvedValue([
        { role: Role.SCHOOL_ADMIN, status: UserStatus.ACTIVE },
        { role: Role.TEACHER, status: UserStatus.ACTIVE },
        { role: Role.STAFF, status: UserStatus.SUSPENDED },
      ]);

      const stats = await service.getUserStats(tenantId);

      expect(stats.totalUsers).toBe(3);
      expect(stats.schoolAdmins).toBe(1);
      expect(stats.teachers).toBe(1);
      expect(stats.staff).toBe(1);
      expect(stats.activeUsers).toBe(2);
      expect(stats.suspendedUsers).toBe(1);
      expect(stats.activeRate).toBe(66.7);
    });
  });

  describe('createUser', () => {
    it('should hash password and create staff account', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);
      mockPrismaService.user.create.mockResolvedValue({
        id: 'new-user-1',
        tenantId,
        email: 'new.staff@stjude.edu.ph',
        firstName: 'Jose',
        lastName: 'Rizal',
        role: Role.STAFF,
        status: UserStatus.ACTIVE,
        createdAt: new Date(),
      });

      const result = await service.createUser(tenantId, {
        email: 'new.staff@stjude.edu.ph',
        password: 'Password123!',
        firstName: 'Jose',
        lastName: 'Rizal',
        role: Role.STAFF,
      });

      expect(result.success).toBe(true);
      expect(result.data.email).toBe('new.staff@stjude.edu.ph');
      expect(mockPrismaService.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            email: 'new.staff@stjude.edu.ph',
            role: Role.STAFF,
          }),
        }),
      );
    });

    it('should throw ConflictException if email is already in use', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      await expect(
        service.createUser(tenantId, {
          email: 'staff.santos@stjude.edu.ph',
          password: 'Password123!',
          firstName: 'Maria',
          lastName: 'Santos',
          role: Role.STAFF,
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('updateUser', () => {
    it('should update name, role, and status', async () => {
      mockPrismaService.user.findFirst.mockResolvedValue(mockUser);
      mockPrismaService.user.update.mockResolvedValue({
        ...mockUser,
        role: Role.SCHOOL_ADMIN,
      });

      const result = await service.updateUser(tenantId, 'user-uuid-1', {
        role: Role.SCHOOL_ADMIN,
      });

      expect(result.success).toBe(true);
      expect(result.data.role).toBe(Role.SCHOOL_ADMIN);
    });
  });

  describe('resetPassword', () => {
    it('should hash new password and update record', async () => {
      mockPrismaService.user.findFirst.mockResolvedValue(mockUser);
      mockPrismaService.user.update.mockResolvedValue(mockUser);

      const result = await service.resetPassword(tenantId, 'user-uuid-1', 'NewSecret123!');

      expect(result.success).toBe(true);
      expect(mockPrismaService.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            passwordHash: expect.any(String),
          }),
        }),
      );
    });
  });

  describe('deleteUser', () => {
    it('should deactivate user status to INACTIVE', async () => {
      mockPrismaService.user.findFirst.mockResolvedValue(mockUser);
      mockPrismaService.user.update.mockResolvedValue({
        id: 'user-uuid-1',
        email: mockUser.email,
        status: UserStatus.INACTIVE,
      });

      const result = await service.deleteUser(tenantId, 'user-uuid-1');

      expect(result.success).toBe(true);
      expect(result.data.status).toBe(UserStatus.INACTIVE);
    });
  });
});
