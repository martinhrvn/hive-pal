/*
  Warnings:

  - A unique constraint covering the columns `[inspectionId]` on the table `HiveMetric` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "HiveMetric_inspectionId_key" ON "HiveMetric"("inspectionId");
