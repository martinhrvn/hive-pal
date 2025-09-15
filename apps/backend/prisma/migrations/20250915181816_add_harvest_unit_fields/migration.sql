-- AlterTable
ALTER TABLE "Harvest" ADD COLUMN     "totalWeightUnit" TEXT NOT NULL DEFAULT 'kg';

-- AlterTable
ALTER TABLE "HarvestHive" ADD COLUMN     "honeyAmountUnit" TEXT NOT NULL DEFAULT 'kg';
