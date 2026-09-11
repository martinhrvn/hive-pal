-- CreateEnum
CREATE TYPE "MeasurementSide" AS ENUM ('FRONT', 'BACK', 'LEFT', 'RIGHT');

-- AlterTable
ALTER TABLE "Measurement" ADD COLUMN     "boxId" TEXT,
ADD COLUMN     "inspectionId" TEXT,
ADD COLUMN     "side" "MeasurementSide";

-- CreateIndex
CREATE INDEX "Measurement_hiveId_metric_boxId_side_recordedAt_idx" ON "Measurement"("hiveId", "metric", "boxId", "side", "recordedAt");

-- CreateIndex
CREATE INDEX "Measurement_boxId_idx" ON "Measurement"("boxId");

-- CreateIndex
CREATE INDEX "Measurement_inspectionId_idx" ON "Measurement"("inspectionId");

-- AddForeignKey
ALTER TABLE "Measurement" ADD CONSTRAINT "Measurement_boxId_fkey" FOREIGN KEY ("boxId") REFERENCES "Box"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Measurement" ADD CONSTRAINT "Measurement_inspectionId_fkey" FOREIGN KEY ("inspectionId") REFERENCES "Inspection"("id") ON DELETE CASCADE ON UPDATE CASCADE;
