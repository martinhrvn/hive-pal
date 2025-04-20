/*
  Warnings:

  - The values [SCHEDULED,OVERDUE] on the enum `InspectionStatus` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "InspectionStatus_new" AS ENUM ('PENDING', 'COMPLETED', 'CANCELLED');
ALTER TABLE "Inspection" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Inspection" ALTER COLUMN "status" TYPE "InspectionStatus_new" USING ("status"::text::"InspectionStatus_new");
ALTER TYPE "InspectionStatus" RENAME TO "InspectionStatus_old";
ALTER TYPE "InspectionStatus_new" RENAME TO "InspectionStatus";
DROP TYPE "InspectionStatus_old";
ALTER TABLE "Inspection" ALTER COLUMN "status" SET DEFAULT 'COMPLETED';
COMMIT;
