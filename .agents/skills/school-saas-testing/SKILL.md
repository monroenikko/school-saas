---
name: school-saas-testing
description: >-
  Best practices, patterns, and conventions for unit and integration testing
  across the School SaaS project. Covers NestJS backend testing (Jest, PrismaService
  mocking, controller/service unit tests, auth guard testing) and Next.js frontend
  testing (Vitest, React Testing Library, hook testing, user-event interactions,
  API mocking).
---

# Testing Best Practices & Conventions — School SaaS

This guide establishes the standardized testing conventions for both the NestJS backend and Next.js frontend across the Turborepo monorepo.

---

## 🎯 Testing Philosophy

1. **Unit Tests First**: Focus on business logic in services (backend) and component behavior/hooks (frontend).
2. **Speed & Isolation**: Unit tests must run fast and never rely on external databases or live servers.
3. **Realistic User Interactions**: On the frontend, test user interactions (`user-event`) rather than internal implementation details.
4. **Tenant Scoping Verification**: On the backend, always verify that `tenantId` is passed and scoped in every database query.

---

## 🏗️ Monorepo Test Commands

Run tests across all packages or target specific applications:

```bash
# Run all unit tests across the monorepo (Turborepo)
npm run test

# Run backend (NestJS) unit tests only
npm run test --workspace=api

# Run backend tests in watch mode
npm run test:watch --workspace=api

# Run frontend (Next.js) unit tests only (Vitest)
npm run test --workspace=web

# Run frontend tests in watch mode
npm run test:watch --workspace=web
```

---

## ⚙️ Backend (NestJS) Unit Testing Best Practices

### 1. Mocking `PrismaService`
Never connect to the actual PostgreSQL database during unit tests. Use a type-safe mock factory:

```typescript
// test/mocks/prisma.mock.ts
export type MockPrisma = {
  [K in keyof PrismaClient]: {
    [M in keyof PrismaClient[K]]: jest.Mock;
  };
};

export const createMockPrismaService = () => ({
  student: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    count: jest.fn(),
  },
  teacher: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    count: jest.fn(),
  },
  user: {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  tenant: {
    findUnique: jest.fn(),
    create: jest.fn(),
  },
  $transaction: jest.fn((callback) => callback(createMockPrismaService())),
});
```

### 2. Service Unit Test Pattern (AAA: Arrange, Act, Assert)
Example: Testing `StudentsService` with tenant scoping verification:

```typescript
// students.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { StudentsService } from './students.service';
import { PrismaService } from '../prisma/prisma.service';
import { createMockPrismaService } from '../../test/mocks/prisma.mock';

describe('StudentsService', () => {
  let service: StudentsService;
  let prisma: ReturnType<typeof createMockPrismaService>;

  beforeEach(async () => {
    const mockPrisma = createMockPrismaService();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StudentsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<StudentsService>(StudentsService);
    prisma = module.get(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should query students scoped strictly by tenantId', async () => {
      const tenantId = 'tenant-uuid-123';
      const mockStudents = [
        { id: '1', firstName: 'Juan', lastName: 'Dela Cruz', tenantId },
      ];

      prisma.student.findMany.mockResolvedValue(mockStudents);
      prisma.student.count.mockResolvedValue(1);

      const result = await service.findAll(tenantId, { page: 1, limit: 10 });

      // Verify Prisma was called with tenantId filter
      expect(prisma.student.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ tenantId }),
        }),
      );
      expect(result.data).toEqual(mockStudents);
      expect(result.meta.total).toBe(1);
    });
  });
});
```

### 3. Controller Unit Test Pattern
Test that controllers correctly unpack input, invoke services, and return the expected response envelope:

```typescript
// students.controller.spec.ts
describe('StudentsController', () => {
  let controller: StudentsController;
  let service: jest.Mocked<Partial<StudentsService>>;

  beforeEach(async () => {
    service = {
      findAll: jest.fn(),
      create: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [StudentsController],
      providers: [{ provide: StudentsService, useValue: service }],
    }).compile();

    controller = module.get<StudentsController>(StudentsController);
  });

  it('should return paginated students list envelope', async () => {
    const mockResponse = {
      data: [{ id: '1', firstName: 'Juan' }],
      meta: { total: 1, page: 1, limit: 20, totalPages: 1 },
    };
    service.findAll!.mockResolvedValue(mockResponse as any);

    const user = { sub: 'user-1', tenantId: 'tenant-1', role: 'SCHOOL_ADMIN' };
    const result = await controller.findAll(user as any, { page: 1, limit: 20 });

    expect(result.success).toBe(true);
    expect(result.data).toEqual(mockResponse.data);
  });
});
```

### 4. Guard & Interceptor Unit Testing
Test authorization logic in isolation by mocking the `ExecutionContext`:

```typescript
// tenant.guard.spec.ts
import { Reflector } from '@nestjs/core';
import { TenantGuard } from './tenant.guard';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';

describe('TenantGuard', () => {
  let guard: TenantGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new TenantGuard(reflector);
  });

  it('should attach tenantId to request for school users', () => {
    const mockRequest: any = {
      user: { role: 'SCHOOL_ADMIN', tenantId: 'tenant-uuid-1' },
    };
    const context = {
      switchToHttp: () => ({ getRequest: () => mockRequest }),
      getHandler: () => ({}),
      getClass: () => ({}),
    } as unknown as ExecutionContext;

    const canActivate = guard.canActivate(context);
    expect(canActivate).toBe(true);
    expect(mockRequest.tenantId).toBe('tenant-uuid-1');
  });

  it('should throw ForbiddenException if user has no tenantId', () => {
    const mockRequest: any = {
      user: { role: 'SCHOOL_ADMIN', tenantId: null },
    };
    const context = {
      switchToHttp: () => ({ getRequest: () => mockRequest }),
      getHandler: () => ({}),
      getClass: () => ({}),
    } as unknown as ExecutionContext;

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });
});
```

---

## 💻 Frontend (Next.js) Unit Testing Best Practices

### 1. Test Setup & Tools
- **Runner**: **Vitest** (fast native TypeScript/ESM execution).
- **DOM Engine**: `jsdom`.
- **Assertion Matchers**: `@testing-library/jest-dom/vitest`.
- **Query & Render**: `@testing-library/react`.
- **User Simulator**: `@testing-library/user-event`.

### 2. Component Testing Conventions
Always test accessible roles and visible text rather than internal state:

```typescript
// src/components/ui/button.spec.tsx
import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { Button } from './button';

describe('Button Component', () => {
  it('renders with children and handles click', async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();

    render(<Button onClick={handleClick}>Submit Form</Button>);

    const button = screen.getByRole('button', { name: /submit form/i });
    expect(button).toBeInTheDocument();

    await user.click(button);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('disables button and shows spinner when loading', () => {
    render(<Button isLoading>Save Changes</Button>);
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });
});
```

### 3. Mocking Contexts & Providers
When testing components that consume `useAuth()` or `next/navigation`, mock the hook directly:

```typescript
// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
  }),
  usePathname: () => '/dashboard',
}));

// Mock Auth Context
vi.mock('@/context/auth-context', () => ({
  useAuth: () => ({
    user: {
      id: 'usr-1',
      firstName: 'Corazon',
      lastName: 'Aquino',
      role: 'SCHOOL_ADMIN',
      tenantName: 'St. Jude Academy',
    },
    isLoading: false,
    logout: vi.fn(),
  }),
}));
```

### 4. Mocking API Requests (`ApiClient`)
Never make live HTTP requests in unit tests. Mock `api`:

```typescript
import { api } from '@/lib/api';
vi.mock('@/lib/api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

it('loads and displays student data', async () => {
  vi.mocked(api.get).mockResolvedValueOnce({
    success: true,
    data: [
      { id: '1', firstName: 'Juan', lastName: 'Dela Cruz', studentId: '2026-0001' },
    ],
  });

  render(<StudentsDataTable />);

  // Use findBy for async elements rendered after API response
  const studentName = await screen.findByText(/Juan Dela Cruz/i);
  expect(studentName).toBeInTheDocument();
});
```

---

## 📋 Unit Testing Checklist

Before submitting code in any phase:
- [ ] Backend: Service business logic has 100% path coverage for tenant isolation.
- [ ] Backend: Controllers have unit tests verifying status codes & envelope shapes.
- [ ] Backend: Critical DTOs have validation tests checking required fields and regex patterns.
- [ ] Frontend: Components render properly without crashing.
- [ ] Frontend: Interactive actions (clicks, inputs) tested with `userEvent`.
- [ ] Frontend: Loading and empty states verified.
- [ ] Monorepo: `npm run test` exits with code `0`.
