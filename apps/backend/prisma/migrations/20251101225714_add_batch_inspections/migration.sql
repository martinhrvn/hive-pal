-- CreateEnum
CREATE TYPE "BatchInspectionStatus" AS ENUM ('DRAFT', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "BatchHiveStatus" AS ENUM ('PENDING', 'COMPLETED', 'CANCELLED');

-- CreateTable
CREATE TABLE "BatchInspection" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "apiaryId" TEXT NOT NULL,
    "status" "BatchInspectionStatus" NOT NULL DEFAULT 'DRAFT',
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BatchInspection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BatchInspectionHive" (
    "id" TEXT NOT NULL,
    "batchInspectionId" TEXT NOT NULL,
    "hiveId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "status" "BatchHiveStatus" NOT NULL DEFAULT 'PENDING',
    "inspectionId" TEXT,
    "completedAt" TIMESTAMP(3),
    "skippedCount" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "BatchInspectionHive_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BatchInspection_apiaryId_idx" ON "BatchInspection"("apiaryId");

-- CreateIndex
CREATE INDEX "BatchInspection_status_idx" ON "BatchInspection"("status");

-- CreateIndex
CREATE INDEX "BatchInspection_apiaryId_status_idx" ON "BatchInspection"("apiaryId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "BatchInspectionHive_inspectionId_key" ON "BatchInspectionHive"("inspectionId");

-- CreateIndex
CREATE INDEX "BatchInspectionHive_batchInspectionId_idx" ON "BatchInspectionHive"("batchInspectionId");

-- CreateIndex
CREATE INDEX "BatchInspectionHive_batchInspectionId_order_idx" ON "BatchInspectionHive"("batchInspectionId", "order");

-- CreateIndex
CREATE INDEX "BatchInspectionHive_batchInspectionId_status_idx" ON "BatchInspectionHive"("batchInspectionId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "BatchInspectionHive_batchInspectionId_hiveId_key" ON "BatchInspectionHive"("batchInspectionId", "hiveId");

-- AddForeignKey
ALTER TABLE "BatchInspection" ADD CONSTRAINT "BatchInspection_apiaryId_fkey" FOREIGN KEY ("apiaryId") REFERENCES "Apiary"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BatchInspectionHive" ADD CONSTRAINT "BatchInspectionHive_batchInspectionId_fkey" FOREIGN KEY ("batchInspectionId") REFERENCES "BatchInspection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BatchInspectionHive" ADD CONSTRAINT "BatchInspectionHive_hiveId_fkey" FOREIGN KEY ("hiveId") REFERENCES "Hive"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BatchInspectionHive" ADD CONSTRAINT "BatchInspectionHive_inspectionId_fkey" FOREIGN KEY ("inspectionId") REFERENCES "Inspection"("id") ON DELETE SET NULL ON UPDATE CASCADE;
