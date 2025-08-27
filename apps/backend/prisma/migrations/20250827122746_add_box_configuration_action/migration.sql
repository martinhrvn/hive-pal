-- AlterEnum
ALTER TYPE "ActionType" ADD VALUE 'BOX_CONFIGURATION';

-- CreateTable
CREATE TABLE "BoxConfigurationAction" (
    "id" TEXT NOT NULL,
    "actionId" TEXT NOT NULL,
    "boxesAdded" INTEGER NOT NULL DEFAULT 0,
    "boxesRemoved" INTEGER NOT NULL DEFAULT 0,
    "framesAdded" INTEGER NOT NULL DEFAULT 0,
    "framesRemoved" INTEGER NOT NULL DEFAULT 0,
    "totalBoxes" INTEGER NOT NULL,
    "totalFrames" INTEGER NOT NULL,

    CONSTRAINT "BoxConfigurationAction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BoxConfigurationAction_actionId_key" ON "BoxConfigurationAction"("actionId");

-- AddForeignKey
ALTER TABLE "BoxConfigurationAction" ADD CONSTRAINT "BoxConfigurationAction_actionId_fkey" FOREIGN KEY ("actionId") REFERENCES "Action"("id") ON DELETE CASCADE ON UPDATE CASCADE;
