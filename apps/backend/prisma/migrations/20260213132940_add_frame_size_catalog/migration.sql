-- CreateEnum
CREATE TYPE "FrameSizeStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- AlterTable
ALTER TABLE "Box" ADD COLUMN     "frameSizeId" TEXT;

-- CreateTable
CREATE TABLE "FrameSize" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "width" DOUBLE PRECISION NOT NULL,
    "height" DOUBLE PRECISION NOT NULL,
    "depth" DOUBLE PRECISION NOT NULL,
    "isBuiltIn" BOOLEAN NOT NULL DEFAULT false,
    "status" "FrameSizeStatus" NOT NULL DEFAULT 'PENDING',
    "createdByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FrameSize_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "FrameSize_name_key" ON "FrameSize"("name");

-- CreateIndex
CREATE INDEX "FrameSize_status_idx" ON "FrameSize"("status");

-- CreateIndex
CREATE INDEX "FrameSize_createdByUserId_idx" ON "FrameSize"("createdByUserId");

-- AddForeignKey
ALTER TABLE "Box" ADD CONSTRAINT "Box_frameSizeId_fkey" FOREIGN KEY ("frameSizeId") REFERENCES "FrameSize"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FrameSize" ADD CONSTRAINT "FrameSize_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Seed built-in frame sizes
INSERT INTO "FrameSize" ("id", "name", "width", "height", "depth", "isBuiltIn", "status", "createdAt", "updatedAt") VALUES
  (gen_random_uuid(), 'Langstroth Deep', 482, 232, 35, true, 'APPROVED', NOW(), NOW()),
  (gen_random_uuid(), 'Langstroth Medium', 482, 159, 35, true, 'APPROVED', NOW(), NOW()),
  (gen_random_uuid(), 'Langstroth Shallow', 482, 137, 35, true, 'APPROVED', NOW(), NOW()),
  (gen_random_uuid(), 'Dadant', 482, 286, 35, true, 'APPROVED', NOW(), NOW()),
  (gen_random_uuid(), 'National Deep', 356, 216, 35, true, 'APPROVED', NOW(), NOW()),
  (gen_random_uuid(), 'National Shallow', 356, 140, 35, true, 'APPROVED', NOW(), NOW()),
  (gen_random_uuid(), 'Warré', 300, 200, 24, true, 'APPROVED', NOW(), NOW()),
  (gen_random_uuid(), 'Top Bar', 483, 244, 32, true, 'APPROVED', NOW(), NOW());
