-- AlterTable
ALTER TABLE "Thread" ADD COLUMN "assignedTo" TEXT;
ALTER TABLE "Thread" ADD COLUMN "assignedBy" TEXT;
ALTER TABLE "Thread" ADD COLUMN "assignedAt" DATETIME;
