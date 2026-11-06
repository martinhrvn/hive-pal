-- Layout snapshots on BoxConfigurationAction so an inspection's box change can be undone
ALTER TABLE "BoxConfigurationAction" ADD COLUMN "previousBoxes" JSONB,
ADD COLUMN "appliedBoxes" JSONB;
