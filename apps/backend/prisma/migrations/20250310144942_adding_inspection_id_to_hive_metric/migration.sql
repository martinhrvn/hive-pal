/*
  Warnings:

  - Added the required column `inspectionId` to the `HiveMetric` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "HiveMetric" ADD COLUMN     "inspectionId" TEXT NOT NULL;
