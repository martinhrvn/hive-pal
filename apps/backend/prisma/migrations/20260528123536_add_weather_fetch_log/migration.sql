-- AlterTable
ALTER TABLE "PlatformMetricsSnapshot" ADD COLUMN     "weatherFetchErrors24h" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "weatherFetches24h" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "WeatherFetchLog" (
    "id" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "outcome" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WeatherFetchLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "WeatherFetchLog_createdAt_idx" ON "WeatherFetchLog"("createdAt");
