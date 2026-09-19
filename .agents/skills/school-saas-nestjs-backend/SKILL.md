---
name: school-saas-nestjs-backend
description: >-
  Best practices and conventions for the NestJS backend in the School SaaS project.
  Use when creating or modifying any NestJS module, controller, service, guard,
  interceptor, pipe, or decorator in apps/api/. Covers multi-tenancy patterns,
  module structure, error handling, validation, and API design conventions.
---

# NestJS Backend — Best Practices & Conventions

## Module Structure

Every feature module follows this structure:
```
src/<module>/
├── <module>.module.ts         # Module definition
├── <module>.controller.ts     # REST endpoints
├── <module>.service.ts        # Business logic
├── dto/
│   ├── create-<entity>.dto.ts # Input validation
│   └── update-<entity>.dto.ts
├── entities/
│   └── <entity>.entity.ts     # Response/entity shape (if needed beyond Prisma)
└── <module>.controller.spec.ts # Unit tests
```

## Multi-Tenancy Enforcement

**CRITICAL**: Every tenant-scoped query MUST include `tenantId`.

### Extracting Tenant
```typescript
// Use the @CurrentUser() decorator to get user from JWT
@Get()
async findAll(@CurrentUser() user: JwtPayload) {
  return this.studentsService.findAll(user.tenantId);
}
```

### Service Layer — Always Filter by tenantId
```typescript
async findAll(tenantId: string) {
  return this.prisma.student.findMany({
    where: { tenantId },
    orderBy: { createdAt: 'desc' },
  });
}
```

### TenantGuard
- Automatically applied globally via APP_GUARD
- Extracts `tenantId` from the JWT payload
- Attaches it to the request object
- Super admin routes bypass tenant scoping

## API Response Format

All API responses follow a consistent envelope:

```typescript
// Success (single item)
{
  "success": true,
  "data": { ... }
}

// Success (list with pagination)
{
  "success": true,
  "data": [ ... ],
  "meta": {
    "total": 150,
    "page": 1,
    "limit": 20,
    "totalPages": 8
  }
}

// Error
{
  "success": false,
  "error": {
    "code": "STUDENT_NOT_FOUND",
    "message": "Student with ID xxx not found"
  }
}
```

## Validation (DTOs)

- Always use `class-validator` decorators in DTOs
- Enable `whitelist: true` and `forbidNonWhitelisted: true` globally
- Use `class-transformer` for type coercion

```typescript
import { IsString, IsEmail, IsOptional, IsEnum, MaxLength } from 'class-validator';

export class CreateStudentDto {
  @IsString()
  @MaxLength(100)
  firstName: string;

  @IsString()
  @MaxLength(100)
  lastName: string;

  @IsOptional()
  @IsEmail()
  guardianEmail?: string;

  @IsEnum(Gender)
  @IsOptional()
  gender?: Gender;
}
```

## Error Handling

- Use NestJS built-in exceptions (`NotFoundException`, `ConflictException`, etc.)
- Create custom business exceptions extending `HttpException`
- Global exception filter catches unhandled errors and formats them

```typescript
// Custom business exception
export class StudentAlreadyEnrolledException extends ConflictException {
  constructor(studentId: string) {
    super(`Student ${studentId} is already enrolled in a section`);
  }
}
```

## Pagination Pattern

```typescript
async findAll(tenantId: string, query: PaginationQueryDto) {
  const { page = 1, limit = 20, search, sortBy = 'createdAt', sortOrder = 'desc' } = query;
  const skip = (page - 1) * limit;

  const where: Prisma.StudentWhereInput = {
    tenantId,
    ...(search && {
      OR: [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { studentId: { contains: search, mode: 'insensitive' } },
      ],
    }),
  };

  const [data, total] = await Promise.all([
    this.prisma.student.findMany({ where, skip, take: limit, orderBy: { [sortBy]: sortOrder } }),
    this.prisma.student.count({ where }),
  ]);

  return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
}
```

## Soft Delete Pattern

```typescript
// Don't use Prisma delete. Set status instead.
async remove(tenantId: string, id: string) {
  return this.prisma.student.update({
    where: { id, tenantId },
    data: { status: 'ARCHIVED' },
  });
}
```

## Guards Ordering (Global)

Applied in order via `APP_GUARD`:
1. `JwtAuthGuard` — Validates JWT token
2. `TenantGuard` — Extracts and validates tenant
3. `RolesGuard` — Checks permissions

```typescript
// Skip auth for public routes
@Public()
@Post('login')
async login() { ... }

// Require specific permissions
@Permissions('students.create')
@Post()
async create() { ... }
```

## Naming Conventions

| Item | Convention | Example |
|------|-----------|---------|
| Module files | kebab-case | `students.module.ts` |
| Class names | PascalCase | `StudentsService` |
| Methods | camelCase | `findAll`, `findOne`, `create`, `update`, `remove` |
| DTOs | PascalCase + Dto suffix | `CreateStudentDto` |
| API paths | kebab-case, plural nouns | `/api/students`, `/api/rfid-devices` |
| DB columns | snake_case (Prisma maps) | `first_name`, `tenant_id` |

## Testing

- Unit tests for services (mock Prisma)
- E2E tests for controllers (test full HTTP flow)
- Test file naming: `*.spec.ts` for unit, `*.e2e-spec.ts` for e2e
