import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '@school-saas/shared';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class TenantGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      return true;
    }

    // Super Admin can impersonate/scope via x-tenant-id header or see global
    if (user.role === Role.SUPER_ADMIN) {
      const headerTenantId = request.headers['x-tenant-id'] as string;
      request.tenantId = headerTenantId || null;
      return true;
    }

    if (!user.tenantId) {
      throw new ForbiddenException('No school tenant associated with this account');
    }

    // Attach tenantId to request for easy access in controllers & services
    request.tenantId = user.tenantId;
    return true;
  }
}
