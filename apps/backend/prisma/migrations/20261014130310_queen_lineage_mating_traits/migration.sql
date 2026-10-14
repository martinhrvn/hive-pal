-- CreateEnum
CREATE TYPE "QueenMatingType" AS ENUM ('OPEN', 'INSTRUMENTAL', 'MATING_STATION');

-- AlterTable
ALTER TABLE "Queen" ADD COLUMN     "breeder" TEXT,
ADD COLUMN     "gentleness" INTEGER,
ADD COLUMN     "honeyProduction" INTEGER,
ADD COLUMN     "hygiene" INTEGER,
ADD COLUMN     "line" TEXT,
ADD COLUMN     "matedAt" TIMESTAMP(3),
ADD COLUMN     "matingStation" TEXT,
ADD COLUMN     "matingType" "QueenMatingType",
ADD COLUMN     "motherQueenId" TEXT,
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "swarmResistance" INTEGER;

-- CreateIndex
CREATE INDEX "Queen_motherQueenId_idx" ON "Queen"("motherQueenId");

-- AddForeignKey
ALTER TABLE "Queen" ADD CONSTRAINT "Queen_motherQueenId_fkey" FOREIGN KEY ("motherQueenId") REFERENCES "Queen"("id") ON DELETE SET NULL ON UPDATE CASCADE;
