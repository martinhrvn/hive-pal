/*
  Warnings:

  - Added the required column `hiveId` to the `Action` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Action" DROP CONSTRAINT "Action_inspectionId_fkey";

-- DropIndex
DROP INDEX "Action_type_inspectionId_idx";

-- AlterTable
ALTER TABLE "Action" ADD COLUMN     "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "hiveId" TEXT NOT NULL,
ALTER COLUMN "inspectionId" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "Action_hiveId_idx" ON "Action"("hiveId");

-- CreateIndex
CREATE INDEX "Action_type_hiveId_idx" ON "Action"("type", "hiveId");

-- CreateIndex
CREATE INDEX "Action_date_idx" ON "Action"("date");

-- AddForeignKey
ALTER TABLE "Action" ADD CONSTRAINT "Action_hiveId_fkey" FOREIGN KEY ("hiveId") REFERENCES "Hive"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Action" ADD CONSTRAINT "Action_inspectionId_fkey" FOREIGN KEY ("inspectionId") REFERENCES "Inspection"("id") ON DELETE SET NULL ON UPDATE CASCADE;
