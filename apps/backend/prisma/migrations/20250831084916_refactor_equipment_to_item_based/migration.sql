/*
  Warnings:

  - You are about to drop the `CustomEquipmentType` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `UserEquipmentSettings` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `UserInventory` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "EquipmentCategory" AS ENUM ('BOXES', 'HIVE_PARTS', 'FRAMES', 'FEEDING', 'CONSUMABLES', 'TOOLS', 'PROTECTIVE', 'EXTRACTION', 'CUSTOM');

-- DropForeignKey
ALTER TABLE "CustomEquipmentType" DROP CONSTRAINT "CustomEquipmentType_userId_fkey";

-- DropForeignKey
ALTER TABLE "UserEquipmentSettings" DROP CONSTRAINT "UserEquipmentSettings_userId_fkey";

-- DropForeignKey
ALTER TABLE "UserInventory" DROP CONSTRAINT "UserInventory_userId_fkey";

-- DropTable
DROP TABLE "CustomEquipmentType";

-- DropTable
DROP TABLE "UserEquipmentSettings";

-- DropTable
DROP TABLE "UserInventory";

-- CreateTable
CREATE TABLE "EquipmentItem" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "name" TEXT,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "perHive" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "extra" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "neededOverride" DOUBLE PRECISION,
    "category" "EquipmentCategory" NOT NULL,
    "unit" TEXT NOT NULL DEFAULT 'pieces',
    "isCustom" BOOLEAN NOT NULL DEFAULT false,
    "displayOrder" INTEGER NOT NULL DEFAULT 999,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EquipmentItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EquipmentMultiplier" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "targetMultiplier" DOUBLE PRECISION NOT NULL DEFAULT 1.5,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EquipmentMultiplier_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EquipmentItem_userId_idx" ON "EquipmentItem"("userId");

-- CreateIndex
CREATE INDEX "EquipmentItem_userId_category_idx" ON "EquipmentItem"("userId", "category");

-- CreateIndex
CREATE UNIQUE INDEX "EquipmentItem_userId_itemId_key" ON "EquipmentItem"("userId", "itemId");

-- CreateIndex
CREATE UNIQUE INDEX "EquipmentMultiplier_userId_key" ON "EquipmentMultiplier"("userId");

-- AddForeignKey
ALTER TABLE "EquipmentItem" ADD CONSTRAINT "EquipmentItem_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EquipmentMultiplier" ADD CONSTRAINT "EquipmentMultiplier_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
