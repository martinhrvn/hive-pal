-- CreateIndex
CREATE INDEX "Action_inspectionId_idx" ON "Action"("inspectionId");

-- CreateIndex
CREATE INDEX "Action_type_inspectionId_idx" ON "Action"("type", "inspectionId");

-- CreateIndex
CREATE INDEX "Apiary_userId_idx" ON "Apiary"("userId");

-- CreateIndex
CREATE INDEX "Box_hiveId_idx" ON "Box"("hiveId");

-- CreateIndex
CREATE INDEX "Box_hiveId_position_idx" ON "Box"("hiveId", "position");

-- CreateIndex
CREATE INDEX "Hive_apiaryId_idx" ON "Hive"("apiaryId");

-- CreateIndex
CREATE INDEX "Inspection_hiveId_idx" ON "Inspection"("hiveId");

-- CreateIndex
CREATE INDEX "Inspection_date_idx" ON "Inspection"("date");

-- CreateIndex
CREATE INDEX "InspectionNote_inspectionId_idx" ON "InspectionNote"("inspectionId");

-- CreateIndex
CREATE INDEX "Observation_inspectionId_idx" ON "Observation"("inspectionId");

-- CreateIndex
CREATE INDEX "Observation_type_inspectionId_idx" ON "Observation"("type", "inspectionId");

-- CreateIndex
CREATE INDEX "Queen_hiveId_idx" ON "Queen"("hiveId");
