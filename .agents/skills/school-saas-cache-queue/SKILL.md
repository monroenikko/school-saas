---
name: school-saas-cache-queue
description: >-
  Best practices for Redis caching and BullMQ job queues in the School SaaS project.
  Use when implementing caching, background jobs, RFID event processing, notification
  dispatch, or any async/queue-based workflow in the NestJS backend.
---

# Redis + BullMQ — Best Practices & Conventions

## Redis Usage Overview

Redis serves **two purposes** in this project:

1. **Caching** — Dashboard stats, frequently accessed data, session data
2. **Message Queue** — BullMQ job processing for async tasks

## Redis Connection

```typescript
// config/redis.config.ts
export const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD || undefined,
  db: 0,        // Cache
  // db: 1,     // BullMQ (separate DB for isolation)
};
```

## Caching Best Practices

### Cache Key Naming Convention
```
<tenant>:<entity>:<scope>:<identifier>

Examples:
  tenant:abc123:dashboard:stats
  tenant:abc123:students:count
  tenant:abc123:attendance:2026-09-19:summary
  rfid:device:RFID-001:status
```

### CRITICAL: Always scope cache keys by tenantId
```typescript
// ✅ CORRECT
const key = `tenant:${tenantId}:dashboard:stats`;

// ❌ WRONG — missing tenant scope, data leak risk
const key = `dashboard:stats`;
```

### Cache TTL Guidelines
| Data Type | TTL | Reason |
|-----------|-----|--------|
| Dashboard stats | 30-60 seconds | Near-real-time, queried often |
| Student count | 5 minutes | Changes infrequently |
| Section list | 5 minutes | Rarely changes |
| Attendance daily summary | 60 seconds | Updates with each scan |
| RFID device status | 30 seconds | Needs to feel live |
| User session data | Matches JWT expiry | Security |

### Cache Invalidation
```typescript
// Invalidate on write operations
async createStudent(tenantId: string, data: CreateStudentDto) {
  const student = await this.prisma.student.create({ data });

  // Invalidate related caches
  await this.redis.del(`tenant:${tenantId}:students:count`);
  await this.redis.del(`tenant:${tenantId}:dashboard:stats`);

  return student;
}
```

### Cache-Aside Pattern (Read-Through)
```typescript
async getDashboardStats(tenantId: string) {
  const cacheKey = `tenant:${tenantId}:dashboard:stats`;

  // 1. Try cache
  const cached = await this.redis.get(cacheKey);
  if (cached) return JSON.parse(cached);

  // 2. Query database
  const stats = await this.computeDashboardStats(tenantId);

  // 3. Store in cache
  await this.redis.set(cacheKey, JSON.stringify(stats), 'EX', 60);

  return stats;
}
```

## BullMQ Job Queues

### Queue Architecture
```
RFID Scan Event → rfid-processing queue → Process attendance
Attendance Created → notification queue → Send parent notification
Daily Cron → attendance-summary queue → Compute daily reports
```

### Queue Naming Convention
```
Queue names: kebab-case, descriptive
  rfid-processing
  attendance-notifications
  attendance-reports
  email-notifications
```

### Queue Setup with NestJS
```typescript
// Module registration
@Module({
  imports: [
    BullModule.registerQueue(
      { name: 'rfid-processing' },
      { name: 'attendance-notifications' },
    ),
  ],
})
export class AttendanceModule {}
```

### Producer (Adding Jobs)
```typescript
@Injectable()
export class RfidService {
  constructor(
    @InjectQueue('rfid-processing')
    private rfidQueue: Queue,
  ) {}

  async handleScanEvent(event: RfidScanEventDto) {
    // 1. Save raw event to database
    const rawEvent = await this.prisma.rfidEvent.create({ data: event });

    // 2. Queue for processing
    await this.rfidQueue.add('process-scan', {
      eventId: rawEvent.id,
      tenantId: event.tenantId,
      cardUid: event.cardUid,
      deviceId: event.deviceId,
      scannedAt: event.scannedAt,
    }, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 1000 },
      removeOnComplete: 100,
      removeOnFail: 500,
    });

    return rawEvent;
  }
}
```

### Consumer (Processing Jobs)
```typescript
@Processor('rfid-processing')
export class RfidProcessor extends WorkerHost {
  async process(job: Job<RfidScanJobData>) {
    const { eventId, tenantId, cardUid, deviceId, scannedAt } = job.data;

    // 1. Find student by RFID card
    const student = await this.prisma.student.findFirst({
      where: { tenantId, rfidCardUid: cardUid },
    });
    if (!student) {
      throw new Error(`Unknown RFID card: ${cardUid}`);
    }

    // 2. Check for duplicate scan (within 5 minutes)
    const duplicate = await this.checkDuplicateScan(tenantId, student.id, scannedAt);
    if (duplicate) return { status: 'duplicate', studentId: student.id };

    // 3. Determine attendance status (PRESENT, LATE)
    const status = this.determineAttendanceStatus(scannedAt, tenantId);

    // 4. Create attendance record
    const attendance = await this.prisma.attendance.create({
      data: {
        tenantId,
        studentId: student.id,
        rfidDeviceId: deviceId,
        date: new Date(scannedAt).toISOString().split('T')[0],
        timeIn: new Date(scannedAt),
        status,
      },
    });

    // 5. Queue notification
    await this.notificationQueue.add('parent-notification', {
      tenantId,
      studentId: student.id,
      attendanceId: attendance.id,
      type: 'ARRIVAL',
    });

    return { status: 'processed', attendanceId: attendance.id };
  }
}
```

### Job Options Best Practices
```typescript
{
  attempts: 3,                              // Retry 3 times on failure
  backoff: { type: 'exponential', delay: 1000 }, // 1s, 2s, 4s
  removeOnComplete: { age: 3600, count: 1000 },  // Keep 1000 or 1h
  removeOnFail: { age: 86400, count: 5000 },     // Keep failures 24h
  priority: 1,                              // Lower = higher priority
}
```

## Duplicate RFID Scan Prevention

```typescript
async checkDuplicateScan(
  tenantId: string,
  studentId: string,
  scannedAt: string,
  windowMinutes: number = 5
): Promise<boolean> {
  const windowStart = new Date(new Date(scannedAt).getTime() - windowMinutes * 60000);

  const existing = await this.prisma.attendance.findFirst({
    where: {
      tenantId,
      studentId,
      timeIn: { gte: windowStart },
    },
  });

  return !!existing;
}
```

## Monitoring

- Use BullMQ Dashboard (bull-board) in development
- Log job completion/failure with structured logging
- Track queue depth as a health metric
- Alert on stuck/failed jobs in production
