-- AlterEnum
ALTER TYPE "HiveStatus" ADD VALUE 'UNKNOWN';

-- AlterTable
ALTER TABLE "Hive" ALTER COLUMN "status" SET DEFAULT 'ACTIVE';
