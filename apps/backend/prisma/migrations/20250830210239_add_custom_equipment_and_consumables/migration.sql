-- AlterTable
ALTER TABLE "UserEquipmentSettings" ADD COLUMN     "sugarPerHive" DOUBLE PRECISION NOT NULL DEFAULT 12.0,
ADD COLUMN     "syrupPerHive" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
ADD COLUMN     "trackSugar" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "trackSyrup" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "UserInventory" ADD COLUMN     "customEquipment" JSONB,
ADD COLUMN     "extraSugarKg" DOUBLE PRECISION DEFAULT 0,
ADD COLUMN     "extraSyrupLiters" DOUBLE PRECISION DEFAULT 0,
ADD COLUMN     "requiredSugarKgOverride" DOUBLE PRECISION,
ADD COLUMN     "requiredSyrupLitersOverride" DOUBLE PRECISION;

-- CreateTable
CREATE TABLE "CustomEquipmentType" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "unit" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "perHiveRatio" DOUBLE PRECISION,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "displayOrder" INTEGER NOT NULL DEFAULT 999,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomEquipmentType_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CustomEquipmentType_userId_idx" ON "CustomEquipmentType"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "CustomEquipmentType_userId_name_key" ON "CustomEquipmentType"("userId", "name");

-- AddForeignKey
ALTER TABLE "CustomEquipmentType" ADD CONSTRAINT "CustomEquipmentType_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
