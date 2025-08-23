-- CreateEnum
CREATE TYPE "HarvestStatus" AS ENUM ('DRAFT', 'IN_PROGRESS', 'COMPLETED');

-- AlterEnum
ALTER TYPE "ActionType" ADD VALUE 'HARVEST';

-- AlterTable
ALTER TABLE "Action" ADD COLUMN     "harvestId" TEXT;

-- CreateTable
CREATE TABLE "HarvestAction" (
    "id" TEXT NOT NULL,
    "actionId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "unit" TEXT NOT NULL DEFAULT 'kg',

    CONSTRAINT "HarvestAction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Harvest" (
    "id" TEXT NOT NULL,
    "apiaryId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "status" "HarvestStatus" NOT NULL DEFAULT 'DRAFT',
    "totalWeight" DOUBLE PRECISION,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Harvest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HarvestHive" (
    "id" TEXT NOT NULL,
    "harvestId" TEXT NOT NULL,
    "hiveId" TEXT NOT NULL,
    "framesTaken" INTEGER NOT NULL,
    "honeyAmount" DOUBLE PRECISION,
    "honeyPercentage" DOUBLE PRECISION,

    CONSTRAINT "HarvestHive_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "HarvestAction_actionId_key" ON "HarvestAction"("actionId");

-- CreateIndex
CREATE INDEX "Harvest_apiaryId_idx" ON "Harvest"("apiaryId");

-- CreateIndex
CREATE INDEX "Harvest_date_idx" ON "Harvest"("date");

-- CreateIndex
CREATE INDEX "Harvest_status_idx" ON "Harvest"("status");

-- CreateIndex
CREATE INDEX "HarvestHive_harvestId_idx" ON "HarvestHive"("harvestId");

-- CreateIndex
CREATE INDEX "HarvestHive_hiveId_idx" ON "HarvestHive"("hiveId");

-- CreateIndex
CREATE UNIQUE INDEX "HarvestHive_harvestId_hiveId_key" ON "HarvestHive"("harvestId", "hiveId");

-- CreateIndex
CREATE INDEX "Action_harvestId_idx" ON "Action"("harvestId");

-- AddForeignKey
ALTER TABLE "Action" ADD CONSTRAINT "Action_harvestId_fkey" FOREIGN KEY ("harvestId") REFERENCES "Harvest"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HarvestAction" ADD CONSTRAINT "HarvestAction_actionId_fkey" FOREIGN KEY ("actionId") REFERENCES "Action"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Harvest" ADD CONSTRAINT "Harvest_apiaryId_fkey" FOREIGN KEY ("apiaryId") REFERENCES "Apiary"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HarvestHive" ADD CONSTRAINT "HarvestHive_harvestId_fkey" FOREIGN KEY ("harvestId") REFERENCES "Harvest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HarvestHive" ADD CONSTRAINT "HarvestHive_hiveId_fkey" FOREIGN KEY ("hiveId") REFERENCES "Hive"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
