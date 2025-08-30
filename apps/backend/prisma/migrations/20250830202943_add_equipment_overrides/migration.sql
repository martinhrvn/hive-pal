-- AlterTable
ALTER TABLE "UserInventory" ADD COLUMN     "requiredBottomsOverride" INTEGER,
ADD COLUMN     "requiredCoversOverride" INTEGER,
ADD COLUMN     "requiredDeepBoxesOverride" INTEGER,
ADD COLUMN     "requiredFeedersOverride" INTEGER,
ADD COLUMN     "requiredFramesOverride" INTEGER,
ADD COLUMN     "requiredQueenExcludersOverride" INTEGER,
ADD COLUMN     "requiredShallowBoxesOverride" INTEGER;
