/*
  Warnings:

  - You are about to drop the `actions` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `apiaries` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `hives` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `inspections` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `observations` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `queens` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "BoxType" AS ENUM ('BROOD', 'HONEY', 'FEEDER');

-- DropForeignKey
ALTER TABLE "actions" DROP CONSTRAINT "actions_inspection_id_fkey";

-- DropForeignKey
ALTER TABLE "hives" DROP CONSTRAINT "hives_apiary_id_fkey";

-- DropForeignKey
ALTER TABLE "inspections" DROP CONSTRAINT "inspections_hive_id_fkey";

-- DropForeignKey
ALTER TABLE "observations" DROP CONSTRAINT "observations_inspection_id_fkey";

-- DropForeignKey
ALTER TABLE "queens" DROP CONSTRAINT "queens_hive_id_fkey";

-- DropTable
DROP TABLE "actions";

-- DropTable
DROP TABLE "apiaries";

-- DropTable
DROP TABLE "hives";

-- DropTable
DROP TABLE "inspections";

-- DropTable
DROP TABLE "observations";

-- DropTable
DROP TABLE "queens";

-- CreateTable
CREATE TABLE "Apiary" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "location" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "notes" TEXT,

    CONSTRAINT "Apiary_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Hive" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "apiaryId" TEXT NOT NULL,
    "status" "HiveStatus" NOT NULL,
    "installationDate" TIMESTAMP(3),

    CONSTRAINT "Hive_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Box" (
    "id" TEXT NOT NULL,
    "hiveId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "frameCount" INTEGER NOT NULL,
    "hasExcluder" BOOLEAN NOT NULL DEFAULT false,
    "type" "BoxType" NOT NULL,

    CONSTRAINT "Box_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Queen" (
    "id" TEXT NOT NULL,
    "hiveId" TEXT NOT NULL,
    "markingColor" TEXT,
    "year" INTEGER,
    "source" TEXT,
    "status" "QueenStatus" NOT NULL,
    "installedAt" TIMESTAMP(3) NOT NULL,
    "replacedAt" TIMESTAMP(3),

    CONSTRAINT "Queen_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Inspection" (
    "id" TEXT NOT NULL,
    "hiveId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "weatherConditions" TEXT,

    CONSTRAINT "Inspection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Observation" (
    "id" TEXT NOT NULL,
    "inspectionId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "numericValue" DOUBLE PRECISION,
    "textValue" TEXT,
    "notes" TEXT,

    CONSTRAINT "Observation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Action" (
    "id" TEXT NOT NULL,
    "inspectionId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "notes" TEXT,

    CONSTRAINT "Action_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Hive" ADD CONSTRAINT "Hive_apiaryId_fkey" FOREIGN KEY ("apiaryId") REFERENCES "Apiary"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Box" ADD CONSTRAINT "Box_hiveId_fkey" FOREIGN KEY ("hiveId") REFERENCES "Hive"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Queen" ADD CONSTRAINT "Queen_hiveId_fkey" FOREIGN KEY ("hiveId") REFERENCES "Hive"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Inspection" ADD CONSTRAINT "Inspection_hiveId_fkey" FOREIGN KEY ("hiveId") REFERENCES "Hive"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Observation" ADD CONSTRAINT "Observation_inspectionId_fkey" FOREIGN KEY ("inspectionId") REFERENCES "Inspection"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Action" ADD CONSTRAINT "Action_inspectionId_fkey" FOREIGN KEY ("inspectionId") REFERENCES "Inspection"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
