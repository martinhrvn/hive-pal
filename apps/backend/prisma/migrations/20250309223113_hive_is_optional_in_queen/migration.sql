-- DropForeignKey
ALTER TABLE "Inspection" DROP CONSTRAINT "Inspection_hiveId_fkey";

-- AlterTable
ALTER TABLE "Inspection" ALTER COLUMN "hiveId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Inspection" ADD CONSTRAINT "Inspection_hiveId_fkey" FOREIGN KEY ("hiveId") REFERENCES "Hive"("id") ON DELETE SET NULL ON UPDATE CASCADE;
