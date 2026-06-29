-- DropForeignKey
ALTER TABLE "Action" DROP CONSTRAINT "Action_harvestId_fkey";

-- DropForeignKey
ALTER TABLE "Action" DROP CONSTRAINT "Action_hiveId_fkey";

-- DropForeignKey
ALTER TABLE "Action" DROP CONSTRAINT "Action_inspectionId_fkey";

-- DropForeignKey
ALTER TABLE "Apiary" DROP CONSTRAINT "Apiary_userId_fkey";

-- DropForeignKey
ALTER TABLE "Box" DROP CONSTRAINT "Box_hiveId_fkey";

-- DropForeignKey
ALTER TABLE "Harvest" DROP CONSTRAINT "Harvest_apiaryId_fkey";

-- DropForeignKey
ALTER TABLE "HarvestHive" DROP CONSTRAINT "HarvestHive_hiveId_fkey";

-- DropForeignKey
ALTER TABLE "Hive" DROP CONSTRAINT "Hive_apiaryId_fkey";

-- DropForeignKey
ALTER TABLE "Inspection" DROP CONSTRAINT "Inspection_hiveId_fkey";

-- DropForeignKey
ALTER TABLE "InspectionNote" DROP CONSTRAINT "InspectionNote_inspectionId_fkey";

-- DropForeignKey
ALTER TABLE "Observation" DROP CONSTRAINT "Observation_inspectionId_fkey";

-- DropForeignKey
ALTER TABLE "Queen" DROP CONSTRAINT "Queen_hiveId_fkey";

-- DropForeignKey
ALTER TABLE "WorkerToken" DROP CONSTRAINT "WorkerToken_createdById_fkey";

-- AddForeignKey
ALTER TABLE "Apiary" ADD CONSTRAINT "Apiary_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Hive" ADD CONSTRAINT "Hive_apiaryId_fkey" FOREIGN KEY ("apiaryId") REFERENCES "Apiary"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Box" ADD CONSTRAINT "Box_hiveId_fkey" FOREIGN KEY ("hiveId") REFERENCES "Hive"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Queen" ADD CONSTRAINT "Queen_hiveId_fkey" FOREIGN KEY ("hiveId") REFERENCES "Hive"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Inspection" ADD CONSTRAINT "Inspection_hiveId_fkey" FOREIGN KEY ("hiveId") REFERENCES "Hive"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InspectionNote" ADD CONSTRAINT "InspectionNote_inspectionId_fkey" FOREIGN KEY ("inspectionId") REFERENCES "Inspection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Observation" ADD CONSTRAINT "Observation_inspectionId_fkey" FOREIGN KEY ("inspectionId") REFERENCES "Inspection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Action" ADD CONSTRAINT "Action_hiveId_fkey" FOREIGN KEY ("hiveId") REFERENCES "Hive"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Action" ADD CONSTRAINT "Action_inspectionId_fkey" FOREIGN KEY ("inspectionId") REFERENCES "Inspection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Action" ADD CONSTRAINT "Action_harvestId_fkey" FOREIGN KEY ("harvestId") REFERENCES "Harvest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Harvest" ADD CONSTRAINT "Harvest_apiaryId_fkey" FOREIGN KEY ("apiaryId") REFERENCES "Apiary"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HarvestHive" ADD CONSTRAINT "HarvestHive_hiveId_fkey" FOREIGN KEY ("hiveId") REFERENCES "Hive"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkerToken" ADD CONSTRAINT "WorkerToken_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
