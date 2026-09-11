-- AlterEnum
ALTER TYPE "ActionType" ADD VALUE 'SPLIT';

-- AlterTable: colony-split provenance link (mother hive), null-safe
ALTER TABLE "Hive" ADD COLUMN "parentHiveId" TEXT;

-- CreateIndex
CREATE INDEX "Hive_parentHiveId_idx" ON "Hive"("parentHiveId");

-- AddForeignKey
ALTER TABLE "Hive" ADD CONSTRAINT "Hive_parentHiveId_fkey" FOREIGN KEY ("parentHiveId") REFERENCES "Hive"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "SplitAction" (
    "id" TEXT NOT NULL,
    "actionId" TEXT NOT NULL,
    "splitId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "counterpartHiveId" TEXT,
    "framesMoved" INTEGER NOT NULL,
    "queenDisposition" TEXT NOT NULL,

    CONSTRAINT "SplitAction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SplitAction_actionId_key" ON "SplitAction"("actionId");

-- CreateIndex
CREATE INDEX "SplitAction_splitId_idx" ON "SplitAction"("splitId");

-- AddForeignKey
ALTER TABLE "SplitAction" ADD CONSTRAINT "SplitAction_actionId_fkey" FOREIGN KEY ("actionId") REFERENCES "Action"("id") ON DELETE CASCADE ON UPDATE CASCADE;
