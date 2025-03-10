/*
  Warnings:

  - Made the column `hiveId` on table `Inspection` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "Inspection" DROP CONSTRAINT "Inspection_hiveId_fkey";

-- DropForeignKey
ALTER TABLE "Queen" DROP CONSTRAINT "Queen_hiveId_fkey";

-- AlterTable
ALTER TABLE "Inspection" ALTER COLUMN "hiveId" SET NOT NULL;

-- AlterTable
ALTER TABLE "Queen" ALTER COLUMN "hiveId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Queen" ADD CONSTRAINT "Queen_hiveId_fkey" FOREIGN KEY ("hiveId") REFERENCES "Hive"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Inspection" ADD CONSTRAINT "Inspection_hiveId_fkey" FOREIGN KEY ("hiveId") REFERENCES "Hive"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
