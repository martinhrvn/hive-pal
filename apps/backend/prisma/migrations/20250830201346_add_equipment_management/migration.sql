-- AlterTable
ALTER TABLE "Box" ADD COLUMN     "lastSanitized" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "UserEquipmentSettings" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "trackDeepBoxes" BOOLEAN NOT NULL DEFAULT true,
    "trackShallowBoxes" BOOLEAN NOT NULL DEFAULT true,
    "trackBottoms" BOOLEAN NOT NULL DEFAULT true,
    "trackCovers" BOOLEAN NOT NULL DEFAULT true,
    "trackFrames" BOOLEAN NOT NULL DEFAULT true,
    "trackQueenExcluders" BOOLEAN NOT NULL DEFAULT true,
    "trackFeeders" BOOLEAN NOT NULL DEFAULT false,
    "deepBoxesPerHive" INTEGER NOT NULL DEFAULT 1,
    "shallowBoxesPerHive" INTEGER NOT NULL DEFAULT 2,
    "framesPerHive" INTEGER NOT NULL DEFAULT 20,
    "bottomsPerHive" INTEGER NOT NULL DEFAULT 1,
    "coversPerHive" INTEGER NOT NULL DEFAULT 1,
    "queenExcludersPerHive" INTEGER NOT NULL DEFAULT 1,
    "feedersPerHive" INTEGER NOT NULL DEFAULT 0,
    "targetMultiplier" DOUBLE PRECISION NOT NULL DEFAULT 1.5,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserEquipmentSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserInventory" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "extraDeepBoxes" INTEGER NOT NULL DEFAULT 0,
    "extraShallowBoxes" INTEGER NOT NULL DEFAULT 0,
    "extraBottoms" INTEGER NOT NULL DEFAULT 0,
    "extraCovers" INTEGER NOT NULL DEFAULT 0,
    "extraFrames" INTEGER NOT NULL DEFAULT 0,
    "extraQueenExcluders" INTEGER NOT NULL DEFAULT 0,
    "extraFeeders" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserInventory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserEquipmentSettings_userId_key" ON "UserEquipmentSettings"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "UserInventory_userId_key" ON "UserInventory"("userId");

-- AddForeignKey
ALTER TABLE "UserEquipmentSettings" ADD CONSTRAINT "UserEquipmentSettings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserInventory" ADD CONSTRAINT "UserInventory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
