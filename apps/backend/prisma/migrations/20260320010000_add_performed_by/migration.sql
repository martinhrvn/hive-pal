ALTER TABLE "Action" ADD COLUMN "performedById" TEXT REFERENCES "User"("id") ON DELETE SET NULL;
ALTER TABLE "Inspection" ADD COLUMN "performedById" TEXT REFERENCES "User"("id") ON DELETE SET NULL;
ALTER TABLE "QuickCheck" ADD COLUMN "performedById" TEXT REFERENCES "User"("id") ON DELETE SET NULL;
CREATE INDEX "Action_performedById_idx" ON "Action"("performedById");
CREATE INDEX "Inspection_performedById_idx" ON "Inspection"("performedById");
CREATE INDEX "QuickCheck_performedById_idx" ON "QuickCheck"("performedById");
