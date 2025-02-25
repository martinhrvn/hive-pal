-- DropForeignKey
ALTER TABLE "Hive" DROP CONSTRAINT "Hive_apiaryId_fkey";

-- AlterTable
ALTER TABLE "Hive" ALTER COLUMN "apiaryId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Hive" ADD CONSTRAINT "Hive_apiaryId_fkey" FOREIGN KEY ("apiaryId") REFERENCES "Apiary"("id") ON DELETE SET NULL ON UPDATE CASCADE;
