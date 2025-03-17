-- CreateEnum
CREATE TYPE "InspectionStatus" AS ENUM ('SCHEDULED', 'OVERDUE', 'COMPLETED', 'CANCELLED');

-- AlterTable
ALTER TABLE "Inspection" ADD COLUMN     "status" "InspectionStatus" NOT NULL DEFAULT 'COMPLETED';
