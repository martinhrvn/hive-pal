-- CreateTable
CREATE TABLE "QuickCheck" (
    "id" TEXT NOT NULL,
    "hiveId" TEXT,
    "apiaryId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "note" TEXT,
    "tags" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QuickCheck_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuickCheckPhoto" (
    "id" TEXT NOT NULL,
    "quickCheckId" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QuickCheckPhoto_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "QuickCheck_hiveId_idx" ON "QuickCheck"("hiveId");

-- CreateIndex
CREATE INDEX "QuickCheck_apiaryId_idx" ON "QuickCheck"("apiaryId");

-- CreateIndex
CREATE INDEX "QuickCheck_hiveId_date_idx" ON "QuickCheck"("hiveId", "date");

-- CreateIndex
CREATE INDEX "QuickCheckPhoto_quickCheckId_idx" ON "QuickCheckPhoto"("quickCheckId");

-- AddForeignKey
ALTER TABLE "QuickCheck" ADD CONSTRAINT "QuickCheck_hiveId_fkey" FOREIGN KEY ("hiveId") REFERENCES "Hive"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuickCheck" ADD CONSTRAINT "QuickCheck_apiaryId_fkey" FOREIGN KEY ("apiaryId") REFERENCES "Apiary"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuickCheckPhoto" ADD CONSTRAINT "QuickCheckPhoto_quickCheckId_fkey" FOREIGN KEY ("quickCheckId") REFERENCES "QuickCheck"("id") ON DELETE CASCADE ON UPDATE CASCADE;
