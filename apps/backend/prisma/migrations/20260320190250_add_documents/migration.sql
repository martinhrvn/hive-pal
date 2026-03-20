-- CreateTable
CREATE TABLE "Photo" (
    "id" TEXT NOT NULL,
    "hiveId" TEXT,
    "apiaryId" TEXT NOT NULL,
    "caption" TEXT,
    "storageKey" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Photo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Document" (
    "id" TEXT NOT NULL,
    "hiveId" TEXT,
    "apiaryId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "notes" TEXT,
    "storageKey" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Photo_hiveId_idx" ON "Photo"("hiveId");

-- CreateIndex
CREATE INDEX "Photo_apiaryId_idx" ON "Photo"("apiaryId");

-- CreateIndex
CREATE INDEX "Photo_hiveId_date_idx" ON "Photo"("hiveId", "date");

-- CreateIndex
CREATE INDEX "Document_hiveId_idx" ON "Document"("hiveId");

-- CreateIndex
CREATE INDEX "Document_apiaryId_idx" ON "Document"("apiaryId");

-- CreateIndex
CREATE INDEX "Document_hiveId_date_idx" ON "Document"("hiveId", "date");

-- AddForeignKey
ALTER TABLE "Photo" ADD CONSTRAINT "Photo_hiveId_fkey" FOREIGN KEY ("hiveId") REFERENCES "Hive"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Photo" ADD CONSTRAINT "Photo_apiaryId_fkey" FOREIGN KEY ("apiaryId") REFERENCES "Apiary"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_hiveId_fkey" FOREIGN KEY ("hiveId") REFERENCES "Hive"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_apiaryId_fkey" FOREIGN KEY ("apiaryId") REFERENCES "Apiary"("id") ON DELETE CASCADE ON UPDATE CASCADE;
