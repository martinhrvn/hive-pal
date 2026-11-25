-- AlterEnum
ALTER TYPE "ActionType" ADD VALUE 'COMBINE';

-- CreateTable
CREATE TABLE "CombineAction" (
    "id" TEXT NOT NULL,
    "actionId" TEXT NOT NULL,
    "combineId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "counterpartHiveId" TEXT,
    "keptQueenId" TEXT,
    "otherQueenId" TEXT,
    "otherQueenFate" TEXT,
    "boxesMoved" INTEGER NOT NULL,

    CONSTRAINT "CombineAction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CombineAction_actionId_key" ON "CombineAction"("actionId");

-- CreateIndex
CREATE INDEX "CombineAction_combineId_idx" ON "CombineAction"("combineId");

-- AddForeignKey
ALTER TABLE "CombineAction" ADD CONSTRAINT "CombineAction_actionId_fkey" FOREIGN KEY ("actionId") REFERENCES "Action"("id") ON DELETE CASCADE ON UPDATE CASCADE;
