-- CreateTable
CREATE TABLE "PlatformMetricsSnapshot" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "totalUsers" INTEGER NOT NULL,
    "totalApiaries" INTEGER NOT NULL,
    "totalHives" INTEGER NOT NULL,
    "totalInspections" INTEGER NOT NULL,
    "totalActions" INTEGER NOT NULL,
    "totalQueens" INTEGER NOT NULL,
    "totalHarvests" INTEGER NOT NULL,
    "totalEquipmentItems" INTEGER NOT NULL,
    "activeUsers7Days" INTEGER NOT NULL,
    "activeUsers30Days" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlatformMetricsSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PlatformMetricsSnapshot_date_key" ON "PlatformMetricsSnapshot"("date");

-- CreateIndex
CREATE INDEX "PlatformMetricsSnapshot_date_idx" ON "PlatformMetricsSnapshot"("date");
