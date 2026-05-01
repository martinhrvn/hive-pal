-- Add boxes JSON column to BoxConfigurationAction for per-box type/frame breakdown
ALTER TABLE "BoxConfigurationAction" ADD COLUMN "boxes" JSONB;
