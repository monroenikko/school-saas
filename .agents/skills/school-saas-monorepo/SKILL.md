---
name: school-saas-monorepo
description: >-
  Best practices for the Turborepo monorepo structure, Docker containerization,
  and development workflow in the School SaaS project. Use when setting up the
  monorepo, configuring Turborepo pipelines, Docker/Docker Compose services,
  environment variables, or CI/CD. Also covers the relationship between apps/
  and packages/.
---

# Turborepo Monorepo & Docker — Best Practices & Conventions

## Monorepo Structure

```
saas/                           # Root
├── apps/
│   ├── web/                    # Next.js 15 frontend (port 3000)
│   └── api/                    # NestJS backend (port 3001)
├── packages/
│   └── shared/                 # Shared types, enums, Zod schemas
├── prisma/                     # Database schema (shared, used by api)
├── docker/                     # Dockerfiles and nginx config
│   ├── api.Dockerfile
│   ├── web.Dockerfile
│   └── nginx.conf
├── docker-compose.yml          # Dev environment
├── docker-compose.prod.yml     # Production stack
├── turbo.json                  # Turborepo pipeline config
├── package.json                # Root workspace config
├── .env                        # Root env (copied/referenced by apps)
├── .env.example
└── .gitignore
```

## Turborepo Configuration

### turbo.json
```json
{
  "$schema": "https://turbo.build/schema.json",
  "globalDependencies": [".env"],
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "dist/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {
      "dependsOn": ["^build"]
    },
    "test": {
      "dependsOn": ["^build"]
    },
    "db:generate": {
      "cache": false
    },
    "db:migrate": {
      "cache": false
    },
    "db:seed": {
      "cache": false
    }
  }
}
```

### Root package.json Scripts
```json
{
  "name": "school-saas",
  "private": true,
  "workspaces": ["apps/*", "packages/*"],
  "scripts": {
    "dev": "turbo dev",
    "build": "turbo build",
    "lint": "turbo lint",
    "test": "turbo test",
    "db:generate": "prisma generate",
    "db:migrate": "prisma migrate dev",
    "db:seed": "prisma db seed",
    "db:studio": "prisma studio",
    "docker:up": "docker compose up -d",
    "docker:down": "docker compose down",
    "docker:reset": "docker compose down -v && docker compose up -d"
  },
  "devDependencies": {
    "turbo": "^2",
    "prisma": "^6"
  }
}
```

## Shared Package (`packages/shared`)

### Purpose
- TypeScript types shared between frontend and backend
- Enum definitions (roles, statuses, permissions)
- Zod validation schemas (reused in both React Hook Form + NestJS)
- Constants (permission strings, default values)

### Structure
```
packages/shared/
├── package.json
├── tsconfig.json
├── src/
│   ├── index.ts                # Re-export everything
│   ├── types/
│   │   ├── student.ts
│   │   ├── teacher.ts
│   │   ├── attendance.ts
│   │   ├── auth.ts
│   │   └── api.ts              # API response types
│   ├── enums/
│   │   ├── roles.ts
│   │   ├── status.ts
│   │   └── permissions.ts
│   ├── schemas/
│   │   ├── student.schema.ts   # Zod schemas
│   │   └── auth.schema.ts
│   └── constants/
│       └── permissions.ts
└── dist/                       # Built output
```

### Usage
```typescript
// In apps/api (NestJS)
import { StudentStatus, Role, PERMISSIONS } from '@school-saas/shared';

// In apps/web (Next.js)
import { Student, CreateStudentInput } from '@school-saas/shared';
```

## Docker Setup

### docker-compose.yml (Development)
```yaml
services:
  postgres:
    image: postgres:16-alpine
    container_name: school-saas-db
    restart: unless-stopped
    ports:
      - "5432:5432"
    environment:
      POSTGRES_USER: schoolsaas
      POSTGRES_PASSWORD: schoolsaas_dev
      POSTGRES_DB: schoolsaas
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U schoolsaas"]
      interval: 5s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    container_name: school-saas-redis
    restart: unless-stopped
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 5s
      retries: 5

volumes:
  postgres_data:
  redis_data:
```

### docker-compose.prod.yml (Production — Full Stack)
```yaml
services:
  postgres:
    image: postgres:16-alpine
    restart: always
    environment:
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: ${DB_NAME}
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    restart: always
    volumes:
      - redis_data:/data

  api:
    build:
      context: .
      dockerfile: docker/api.Dockerfile
    restart: always
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    environment:
      DATABASE_URL: postgresql://${DB_USER}:${DB_PASSWORD}@postgres:5432/${DB_NAME}
      REDIS_HOST: redis
      JWT_SECRET: ${JWT_SECRET}
      NODE_ENV: production

  web:
    build:
      context: .
      dockerfile: docker/web.Dockerfile
    restart: always
    depends_on:
      - api
    environment:
      NEXT_PUBLIC_API_URL: http://api:3001
      NODE_ENV: production

  nginx:
    image: nginx:alpine
    restart: always
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./docker/nginx.conf:/etc/nginx/conf.d/default.conf
    depends_on:
      - web
      - api

volumes:
  postgres_data:
  redis_data:
```

### API Dockerfile (`docker/api.Dockerfile`)
```dockerfile
# Build stage
FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json turbo.json ./
COPY apps/api/package.json ./apps/api/
COPY packages/shared/package.json ./packages/shared/
COPY prisma/ ./prisma/
RUN npm ci
COPY . .
RUN npx turbo build --filter=api
RUN npx prisma generate

# Production stage
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/apps/api/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
EXPOSE 3001
CMD ["node", "dist/main.js"]
```

### Web Dockerfile (`docker/web.Dockerfile`)
```dockerfile
# Build stage
FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json turbo.json ./
COPY apps/web/package.json ./apps/web/
COPY packages/shared/package.json ./packages/shared/
RUN npm ci
COPY . .
RUN npx turbo build --filter=web

# Production stage
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/apps/web/.next/standalone ./
COPY --from=builder /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder /app/apps/web/public ./apps/web/public
EXPOSE 3000
CMD ["node", "apps/web/server.js"]
```

## Environment Variables

### .env.example
```bash
# Database
DATABASE_URL=postgresql://schoolsaas:schoolsaas_dev@localhost:5432/schoolsaas

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# API
API_PORT=3001
API_PREFIX=/api

# Frontend
NEXT_PUBLIC_API_URL=http://localhost:3001

# Cookie
COOKIE_DOMAIN=localhost

# App
NODE_ENV=development
```

### CRITICAL: Environment Variable Rules
1. **Never commit `.env`** — only `.env.example` goes in git
2. **Frontend vars** must be prefixed with `NEXT_PUBLIC_` to be available in browser
3. **Secrets** (JWT_SECRET, DB password) are backend-only — never `NEXT_PUBLIC_`
4. **Docker Compose** uses the root `.env` file for variable interpolation
5. **Production** uses separate env management (Docker secrets, cloud env vars)

## Development Workflow

```bash
# 1. Start infrastructure
docker compose up -d

# 2. Install dependencies
npm install

# 3. Generate Prisma client
npm run db:generate

# 4. Run migrations
npm run db:migrate

# 5. Seed database
npm run db:seed

# 6. Start development servers (both web + api)
npm run dev

# Frontend: http://localhost:3000
# Backend:  http://localhost:3001
# Prisma Studio: npx prisma studio (port 5555)
```

## Git Workflow

### .gitignore (Root)
```
node_modules/
.env
.env.local
dist/
.next/
*.log
.turbo/
coverage/
```

### Branch Naming
```
main              # Production-ready
develop           # Integration branch
feature/<name>    # New features
fix/<name>        # Bug fixes
```
