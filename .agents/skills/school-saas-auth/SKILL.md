---
name: school-saas-auth
description: >-
  Best practices for JWT authentication, refresh tokens, RBAC authorization,
  and multi-tenant security in the School SaaS project. Use when implementing
  login, registration, token management, role guards, permission checks,
  RFID device authentication, or any security-related feature.
---

# Auth & Security — Best Practices & Conventions

## Authentication Architecture

```
Login Request
     ↓
Validate credentials (bcrypt compare)
     ↓
Generate Access Token (JWT, 15min)
     ↓
Generate Refresh Token (UUID, 7 days)
     ↓
Store Refresh Token in DB (hashed)
     ↓
Set both tokens as HttpOnly cookies
     ↓
Return user profile
```

## JWT Token Strategy

### Access Token (Short-lived)
```typescript
// Payload
{
  sub: "user-uuid",           // User ID
  email: "admin@school.com",
  tenantId: "tenant-uuid",    // null for super_admin
  role: "SCHOOL_ADMIN",
  permissions: ["students.view", "students.create", ...],
  iat: 1695100000,
  exp: 1695100900             // 15 minutes
}
```

### Refresh Token (Long-lived)
```typescript
// Stored in database
{
  id: "uuid",
  userId: "user-uuid",
  token: "hashed-random-uuid", // bcrypt hash of the actual token
  expiresAt: "2026-09-26",     // 7 days
  createdAt: "2026-09-19"
}
```

### Cookie Configuration
```typescript
// CRITICAL: Always use these cookie settings
const cookieOptions = {
  httpOnly: true,          // Prevent XSS access via JavaScript
  secure: true,            // HTTPS only (even in dev with self-signed cert)
  sameSite: 'lax',         // CSRF protection
  path: '/',
  domain: process.env.COOKIE_DOMAIN,
};

// Access token cookie
res.cookie('access_token', accessToken, {
  ...cookieOptions,
  maxAge: 15 * 60 * 1000,  // 15 minutes
});

// Refresh token cookie
res.cookie('refresh_token', refreshToken, {
  ...cookieOptions,
  path: '/api/auth/refresh', // Only sent to refresh endpoint
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
});
```

## Password Security

```typescript
// Hashing — always bcrypt with 12 rounds
import * as bcrypt from 'bcrypt';

const SALT_ROUNDS = 12;

async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, SALT_ROUNDS);
}

async function verifyPassword(plain: string, hashed: string): Promise<boolean> {
  return bcrypt.compare(plain, hashed);
}
```

### Password Requirements
- Minimum 8 characters
- Must contain at least 1 uppercase, 1 lowercase, 1 number
- Validated on both frontend (Zod) and backend (class-validator)

## RBAC Authorization

### Role Hierarchy & Responsibilities

```
SUPER_ADMIN (Platform Scope: tenant_id = null)
  │  • Complete platform control across all schools/tenants
  │  • Tenant provisioning, plan tiers, platform-wide analytics & billing
  │  • Bypasses tenant scoping (* wildcard permissions)
  │
  └── SCHOOL_ADMIN (Tenant Scope: tenant_id = school_id)
        • Dedicated administrator for a specific school
        • Full authority over ALL modules within the tenant
        • Full Financial & Transaction Visibility (parent billing, tuition, fees)
        • Manages staff, students, teachers, academics, RFID hardware
        │
        ├── REGISTRAR → Student records, enrollment, section assignment
        ├── TEACHER → Assigned sections, student grades, class schedules
        ├── STAFF → Front desk, manual attendance, payment counter
        └── (future) PARENT, STUDENT
```

### Permission-Based Guards
```typescript
// decorators/permissions.decorator.ts
export const Permissions = (...permissions: string[]) =>
  SetMetadata('permissions', permissions);

// guards/roles.guard.ts
@Injectable()
export class RolesGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.get<string[]>(
      'permissions', context.getHandler()
    );
    if (!requiredPermissions) return true; // No permissions required

    const user = context.switchToHttp().getRequest().user;

    // Super admin bypasses all permission checks
    if (user.role === 'SUPER_ADMIN') return true;

    // Check if user has ALL required permissions
    return requiredPermissions.every(
      (perm) => user.permissions.includes(perm)
    );
  }
}
```

### Usage in Controllers
```typescript
@Controller('students')
export class StudentsController {

  @Get()
  @Permissions('students:read')
  findAll() { ... }

  @Post()
  @Permissions('students:create')
  create() { ... }

  @Patch(':id')
  @Permissions('students:update')
  update() { ... }

  @Delete(':id')
  @Permissions('students:delete')
  remove() { ... }
}
```

### Default Permission Sets per Role
```typescript
export const DEFAULT_PERMISSIONS: Record<Role, string[]> = {
  SUPER_ADMIN: ['*'],  // Platform root: all permissions
  SCHOOL_ADMIN: [
    // Full authority over ALL tenant modules:
    'students:read', 'students:create', 'students:update', 'students:delete',
    'teachers:read', 'teachers:create', 'teachers:update', 'teachers:delete',
    'attendance:read', 'attendance:create', 'attendance:update',
    'sections:read', 'sections:create', 'sections:update', 'sections:delete',
    'subjects:read', 'subjects:create', 'subjects:update', 'subjects:delete',
    'grades:read', 'grades:create', 'grades:update',
    'devices:read', 'devices:create', 'devices:update', 'devices:delete',
    'users:read', 'users:manage', 'settings:read', 'settings:update',
    // Full Financial & Transaction Visibility:
    'transactions:read', 'transactions:manage',
  ],
  REGISTRAR: [
    'students:read', 'students:create', 'students:update',
    'sections:read', 'attendance:read',
  ],
  TEACHER: [
    'students:read', 'sections:read', 'subjects:read',
    'grades:read', 'grades:create', 'grades:update',
    'attendance:read', 'attendance:create',
  ],
  STAFF: [
    'students:read', 'students:create', 'students:update',
    'attendance:read', 'attendance:create', 'attendance:update',
    'transactions:read', 'transactions:manage',
  ],
  STUDENT: [
    'attendance:read', 'grades:read', 'sections:read', 'subjects:read',
  ],
  PARENT: [
    'attendance:read', 'grades:read', 'transactions:read',
  ],
};
```

## Multi-Tenant Security

### Tenant Isolation Rules

1. **Every API request** from a tenant user MUST be scoped to their `tenantId`
2. **JWT payload** contains `tenantId` — extracted by TenantGuard
3. **Service layer** receives `tenantId` as a parameter and passes to Prisma queries
4. **Never trust client-provided tenantId** — always use the one from JWT
5. **Super admin** can optionally specify a tenantId to act on behalf of a school

### TenantGuard Implementation
```typescript
@Injectable()
export class TenantGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user; // Set by JwtAuthGuard

    if (user.role === 'SUPER_ADMIN') {
      // Super admin may optionally target a specific tenant
      request.tenantId = request.headers['x-tenant-id'] || null;
      return true;
    }

    if (!user.tenantId) {
      throw new ForbiddenException('No tenant associated with this user');
    }

    request.tenantId = user.tenantId;
    return true;
  }
}
```

## RFID Device Authentication

RFID devices use a separate auth mechanism (not JWT):

```typescript
// Device sends:
{
  "device_id": "RFID-001",
  "device_secret": "raw-secret-here",
  "card_uid": "04A3B291XXXX",
  "scanned_at": "2026-09-14T08:01:23+08:00"
}

// Backend validates:
async validateDevice(deviceId: string, deviceSecret: string) {
  const device = await this.prisma.rfidDevice.findUnique({
    where: { deviceId },
  });

  if (!device || device.status !== 'ACTIVE') {
    throw new UnauthorizedException('Invalid or revoked device');
  }

  const valid = await bcrypt.compare(deviceSecret, device.deviceSecret);
  if (!valid) throw new UnauthorizedException('Invalid device credentials');

  return device; // Contains tenantId for scoping
}
```

## Security Checklist

- [ ] Passwords hashed with bcrypt (12 rounds)
- [ ] JWT in HttpOnly + Secure + SameSite cookies
- [ ] Refresh token rotation (invalidate old on use)
- [ ] Rate limiting on login endpoint (5 attempts / 15 min)
- [ ] CORS configured for specific origins only
- [ ] Input validation on all endpoints (class-validator)
- [ ] SQL injection prevention (Prisma parameterized queries)
- [ ] XSS prevention (no innerHTML, React auto-escapes)
- [ ] Tenant isolation verified (tenantId from JWT, never from client)
- [ ] RFID device credentials hashed and revocable
- [ ] Helmet.js for security headers
- [ ] HTTPS enforced in production
