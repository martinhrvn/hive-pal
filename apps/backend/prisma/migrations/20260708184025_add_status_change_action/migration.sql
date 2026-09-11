-- AlterEnum
ALTER TYPE "ActionType" ADD VALUE 'STATUS_CHANGE';

-- CreateTable
CREATE TABLE "StatusChangeAction" (
    "id" TEXT NOT NULL,
    "actionId" TEXT NOT NULL,
    "fromStatus" "HiveStatus",
    "toStatus" "HiveStatus" NOT NULL,

    CONSTRAINT "StatusChangeAction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "StatusChangeAction_actionId_key" ON "StatusChangeAction"("actionId");

-- AddForeignKey
ALTER TABLE "StatusChangeAction" ADD CONSTRAINT "StatusChangeAction_actionId_fkey" FOREIGN KEY ("actionId") REFERENCES "Action"("id") ON DELETE CASCADE ON UPDATE CASCADE;
