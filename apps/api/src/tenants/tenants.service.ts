import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Role, TenantStatus } from '@school-saas/shared';

@Injectable()
export class TenantsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(role: Role, userTenantId?: string | null) {
    if (role === Role.SUPER_ADMIN) {
      return this.prisma.tenant.findMany({
        where: { status: TenantStatus.ACTIVE },
        orderBy: { name: 'asc' },
        select: {
          id: true,
          name: true,
          slug: true,
          domain: true,
          status: true,
          plan: true,
          logoUrl: true,
          currency: true,
          timezone: true,
        },
      });
    }

    if (!userTenantId) {
      return [];
    }

    return this.prisma.tenant.findMany({
      where: { id: userTenantId },
      select: {
        id: true,
        name: true,
        slug: true,
        domain: true,
        status: true,
        plan: true,
        logoUrl: true,
        currency: true,
        timezone: true,
      },
    });
  }

  async findOne(id: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        slug: true,
        domain: true,
        status: true,
        plan: true,
        address: true,
        phone: true,
        email: true,
        logoUrl: true,
        currency: true,
        timezone: true,
        createdAt: true,
      },
    });

    if (!tenant) {
      throw new NotFoundException(`School tenant with ID "${id}" not found`);
    }

    return tenant;
  }
}
