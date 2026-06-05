-- CreateTable
CREATE TABLE "Measurement" (
    "id" TEXT NOT NULL,
    "hiveId" TEXT NOT NULL,
    "metric" TEXT NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "unit" TEXT,
    "recordedAt" TIMESTAMP(3) NOT NULL,
    "source" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Measurement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApiaryApiKey" (
    "id" TEXT NOT NULL,
    "apiaryId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "keyHash" TEXT NOT NULL,
    "prefix" TEXT NOT NULL,
    "lastUsedAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdByUserId" TEXT,

    CONSTRAINT "ApiaryApiKey_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Measurement_hiveId_recordedAt_idx" ON "Measurement"("hiveId", "recordedAt");

-- CreateIndex
CREATE INDEX "Measurement_hiveId_metric_recordedAt_idx" ON "Measurement"("hiveId", "metric", "recordedAt");

-- CreateIndex
CREATE UNIQUE INDEX "ApiaryApiKey_keyHash_key" ON "ApiaryApiKey"("keyHash");

-- CreateIndex
CREATE INDEX "ApiaryApiKey_apiaryId_idx" ON "ApiaryApiKey"("apiaryId");

-- AddForeignKey
ALTER TABLE "Measurement" ADD CONSTRAINT "Measurement_hiveId_fkey" FOREIGN KEY ("hiveId") REFERENCES "Hive"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApiaryApiKey" ADD CONSTRAINT "ApiaryApiKey_apiaryId_fkey" FOREIGN KEY ("apiaryId") REFERENCES "Apiary"("id") ON DELETE CASCADE ON UPDATE CASCADE;
