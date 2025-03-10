-- AddForeignKey
ALTER TABLE "HiveMetric" ADD CONSTRAINT "HiveMetric_inspectionId_fkey" FOREIGN KEY ("inspectionId") REFERENCES "Inspection"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
