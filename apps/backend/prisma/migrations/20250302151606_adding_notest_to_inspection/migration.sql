-- CreateTable
CREATE TABLE "InspectionNote" (
    "id" TEXT NOT NULL,
    "inspectionId" TEXT NOT NULL,
    "text" TEXT NOT NULL,

    CONSTRAINT "InspectionNote_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "InspectionNote" ADD CONSTRAINT "InspectionNote_inspectionId_fkey" FOREIGN KEY ("inspectionId") REFERENCES "Inspection"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
