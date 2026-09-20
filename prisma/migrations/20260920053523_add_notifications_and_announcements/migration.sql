-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('ATTENDANCE_TAP', 'ANNOUNCEMENT', 'PAYMENT', 'SYSTEM');

-- CreateEnum
CREATE TYPE "NotificationStatus" AS ENUM ('QUEUED', 'SENT', 'DELIVERED', 'FAILED');

-- CreateEnum
CREATE TYPE "NotificationChannel" AS ENUM ('SMS', 'PUSH', 'IN_APP', 'EMAIL');

-- CreateEnum
CREATE TYPE "AnnouncementPriority" AS ENUM ('STANDARD', 'URGENT');

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "user_id" TEXT,
    "recipient" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL DEFAULT 'SYSTEM',
    "channel" "NotificationChannel" NOT NULL DEFAULT 'IN_APP',
    "status" "NotificationStatus" NOT NULL DEFAULT 'QUEUED',
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "announcements" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "audience" TEXT NOT NULL DEFAULT 'ALL',
    "priority" "AnnouncementPriority" NOT NULL DEFAULT 'STANDARD',
    "author_id" TEXT,
    "dispatched_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "announcements_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "notifications_tenant_id_idx" ON "notifications"("tenant_id");

-- CreateIndex
CREATE INDEX "notifications_tenant_id_is_read_idx" ON "notifications"("tenant_id", "is_read");

-- CreateIndex
CREATE INDEX "notifications_tenant_id_type_idx" ON "notifications"("tenant_id", "type");

-- CreateIndex
CREATE INDEX "notifications_tenant_id_status_idx" ON "notifications"("tenant_id", "status");

-- CreateIndex
CREATE INDEX "notifications_tenant_id_created_at_idx" ON "notifications"("tenant_id", "created_at");

-- CreateIndex
CREATE INDEX "announcements_tenant_id_idx" ON "announcements"("tenant_id");

-- CreateIndex
CREATE INDEX "announcements_tenant_id_priority_idx" ON "announcements"("tenant_id", "priority");

-- CreateIndex
CREATE INDEX "announcements_tenant_id_created_at_idx" ON "announcements"("tenant_id", "created_at");

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "announcements" ADD CONSTRAINT "announcements_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
