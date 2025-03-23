/*
  Warnings:

  - Changed the type of `type` on the `Action` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "ActionType" AS ENUM ('FEEDING', 'TREATMENT', 'FRAME', 'OTHER');

-- AlterTable
ALTER TABLE "Action" DROP COLUMN "type",
ADD COLUMN     "type" "ActionType" NOT NULL;

-- CreateIndex
CREATE INDEX "Action_type_inspectionId_idx" ON "Action"("type", "inspectionId");
