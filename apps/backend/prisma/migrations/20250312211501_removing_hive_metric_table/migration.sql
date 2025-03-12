/*
  Warnings:

  - You are about to drop the `HiveMetric` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "HiveMetric" DROP CONSTRAINT "HiveMetric_hiveId_fkey";

-- DropForeignKey
ALTER TABLE "HiveMetric" DROP CONSTRAINT "HiveMetric_inspectionId_fkey";

-- DropTable
DROP TABLE "HiveMetric";
