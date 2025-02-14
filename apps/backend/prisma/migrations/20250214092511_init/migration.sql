-- CreateEnum
CREATE TYPE "HiveStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'DEAD', 'SOLD');

-- CreateEnum
CREATE TYPE "QueenStatus" AS ENUM ('ACTIVE', 'REPLACED', 'DEAD', 'UNKNOWN');

-- CreateTable
CREATE TABLE "apiaries" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "location" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "apiaries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hives" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "apiary_id" TEXT NOT NULL,
    "status" "HiveStatus" NOT NULL DEFAULT 'ACTIVE',
    "installation_date" TIMESTAMP(3),
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hives_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "queens" (
    "id" TEXT NOT NULL,
    "hive_id" TEXT NOT NULL,
    "marking_color" TEXT,
    "year" INTEGER,
    "source" TEXT,
    "status" "QueenStatus" NOT NULL DEFAULT 'ACTIVE',
    "installed_at" TIMESTAMP(3) NOT NULL,
    "replaced_at" TIMESTAMP(3),
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "queens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inspections" (
    "id" TEXT NOT NULL,
    "hive_id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "weather_conditions" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inspections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "observations" (
    "id" TEXT NOT NULL,
    "inspection_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "observations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "actions" (
    "id" TEXT NOT NULL,
    "inspection_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "actions_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "hives" ADD CONSTRAINT "hives_apiary_id_fkey" FOREIGN KEY ("apiary_id") REFERENCES "apiaries"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "queens" ADD CONSTRAINT "queens_hive_id_fkey" FOREIGN KEY ("hive_id") REFERENCES "hives"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inspections" ADD CONSTRAINT "inspections_hive_id_fkey" FOREIGN KEY ("hive_id") REFERENCES "hives"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "observations" ADD CONSTRAINT "observations_inspection_id_fkey" FOREIGN KEY ("inspection_id") REFERENCES "inspections"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "actions" ADD CONSTRAINT "actions_inspection_id_fkey" FOREIGN KEY ("inspection_id") REFERENCES "inspections"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
