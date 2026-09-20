import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RegisterSchoolDto } from './dto/register-school.dto';
import {
  AuthTokens,
  AuthUser,
  DEFAULT_ROLE_PERMISSIONS,
  JwtPayload,
  LoginResponse,
  Role,
  TenantStatus,
  UserStatus,
} from '@school-saas/shared';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async validateUser(email: string, pass: string, tenantSlug?: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: { tenant: true },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException('Your account has been deactivated or suspended');
    }

    if (tenantSlug && user.tenant && user.tenant.slug !== tenantSlug) {
      throw new UnauthorizedException('This account does not belong to the selected school');
    }

    if (user.tenant && user.tenant.status !== TenantStatus.ACTIVE && user.tenant.status !== TenantStatus.TRIAL) {
      throw new UnauthorizedException('The school account is currently inactive or suspended');
    }

    const isMatch = await bcrypt.compare(pass, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid email or password');
    }

    return user;
  }

  async login(loginDto: LoginDto): Promise<LoginResponse> {
    const user = await this.validateUser(
      loginDto.email,
      loginDto.password,
      loginDto.tenantSlug,
    );

    const permissions = DEFAULT_ROLE_PERMISSIONS[user.role as Role] || [];

    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      tenantId: user.tenantId || '',
      role: user.role as Role,
      permissions,
    };

    const tokens = await this.generateTokens(payload);

    const authUser: AuthUser = {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role as Role,
      tenantId: user.tenantId || '',
      tenantName: user.tenant?.name,
      avatarUrl: user.avatarUrl,
    };

    return {
      user: authUser,
      tokens,
    };
  }

  async registerSchool(dto: RegisterSchoolDto): Promise<LoginResponse> {
    // 1. Check if slug is available
    const existingSlug = await this.prisma.tenant.findUnique({
      where: { slug: dto.schoolSlug.toLowerCase() },
    });

    if (existingSlug) {
      throw new ConflictException(
        `The school slug "${dto.schoolSlug}" is already taken. Please choose another.`,
      );
    }

    // 2. Check if admin email is already registered
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.adminEmail.toLowerCase() },
    });

    if (existingUser) {
      throw new ConflictException(
        `The email "${dto.adminEmail}" is already registered. Please sign in or use another email.`,
      );
    }

    // 3. Hash password
    const passwordHash = await bcrypt.hash(dto.adminPassword, 10);

    // 4. Create Tenant, Admin User, Academic Year, and initial Terms in a transaction
    const result = await this.prisma.$transaction(async (tx) => {
      const tenant = await tx.tenant.create({
        data: {
          name: dto.schoolName,
          slug: dto.schoolSlug.toLowerCase(),
          email: dto.adminEmail.toLowerCase(),
          phone: dto.phone,
          address: dto.address,
          plan: 'TRIAL',
          status: TenantStatus.ACTIVE,
        },
      });

      const user = await tx.user.create({
        data: {
          tenantId: tenant.id,
          email: dto.adminEmail.toLowerCase(),
          passwordHash,
          firstName: dto.adminFirstName,
          lastName: dto.adminLastName,
          role: Role.SCHOOL_ADMIN,
          status: UserStatus.ACTIVE,
        },
      });

      // Initialize default Academic Year (e.g. 2026-2027)
      const currentYear = new Date().getFullYear();
      const nextYear = currentYear + 1;
      const academicYear = await tx.academicYear.create({
        data: {
          tenantId: tenant.id,
          name: `${currentYear}-${nextYear}`,
          startDate: new Date(`${currentYear}-08-01`),
          endDate: new Date(`${nextYear}-05-31`),
          isCurrent: true,
        },
      });

      // Initialize default Terms (1st & 2nd Semester)
      await tx.term.createMany({
        data: [
          {
            tenantId: tenant.id,
            academicYearId: academicYear.id,
            name: '1st Semester',
            startDate: new Date(`${currentYear}-08-01`),
            endDate: new Date(`${currentYear}-12-18`),
            isCurrent: true,
          },
          {
            tenantId: tenant.id,
            academicYearId: academicYear.id,
            name: '2nd Semester',
            startDate: new Date(`${nextYear}-01-05`),
            endDate: new Date(`${nextYear}-05-31`),
            isCurrent: false,
          },
        ],
      });

      return { tenant, user };
    });

    const permissions = DEFAULT_ROLE_PERMISSIONS[Role.SCHOOL_ADMIN];

    const payload: JwtPayload = {
      sub: result.user.id,
      email: result.user.email,
      tenantId: result.tenant.id,
      role: Role.SCHOOL_ADMIN,
      permissions,
    };

    const tokens = await this.generateTokens(payload);

    return {
      user: {
        id: result.user.id,
        email: result.user.email,
        firstName: result.user.firstName,
        lastName: result.user.lastName,
        role: Role.SCHOOL_ADMIN,
        tenantId: result.tenant.id,
        tenantName: result.tenant.name,
      },
      tokens,
    };
  }

  async refreshTokens(refreshToken: string): Promise<LoginResponse> {
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token missing');
    }

    try {
      const decoded = this.jwtService.verify(refreshToken, {
        secret: process.env.JWT_SECRET || 'super-secret-jwt-key-school-saas-dev-32chars',
      });

      const user = await this.prisma.user.findUnique({
        where: { id: decoded.sub },
        include: { tenant: true },
      });

      if (!user || user.status !== UserStatus.ACTIVE) {
        throw new UnauthorizedException('User account no longer active');
      }

      const permissions = DEFAULT_ROLE_PERMISSIONS[user.role as Role] || [];

      const payload: JwtPayload = {
        sub: user.id,
        email: user.email,
        tenantId: user.tenantId || '',
        role: user.role as Role,
        permissions,
      };

      const tokens = await this.generateTokens(payload);

      return {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role as Role,
          tenantId: user.tenantId || '',
          tenantName: user.tenant?.name,
          avatarUrl: user.avatarUrl,
        },
        tokens,
      };
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  async getProfile(userId: string): Promise<AuthUser> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { tenant: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role as Role,
      tenantId: user.tenantId || '',
      tenantName: user.tenant?.name,
      avatarUrl: user.avatarUrl,
    };
  }

  private async generateTokens(payload: JwtPayload): Promise<AuthTokens> {
    const secret = process.env.JWT_SECRET || 'super-secret-jwt-key-school-saas-dev-32chars';

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret,
        expiresIn: (process.env.JWT_ACCESS_EXPIRY || '15m') as any,
      }),
      this.jwtService.signAsync(
        { sub: payload.sub, type: 'refresh' },
        {
          secret,
          expiresIn: (process.env.JWT_REFRESH_EXPIRY || '7d') as any,
        },
      ),
    ]);

    return {
      accessToken,
      refreshToken,
    };
  }
}
