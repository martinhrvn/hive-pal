-- AlterTable
ALTER TABLE "Hive" ADD COLUMN     "positionCol" INTEGER,
ADD COLUMN     "positionRow" INTEGER;

-- CreateIndex
CREATE INDEX "Hive_apiaryId_positionRow_positionCol_idx" ON "Hive"("apiaryId", "positionRow", "positionCol");
