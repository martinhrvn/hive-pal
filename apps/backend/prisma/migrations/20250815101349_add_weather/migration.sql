-- CreateTable
CREATE TABLE "WeatherHourlyForecast" (
    "id" TEXT NOT NULL,
    "apiaryId" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "fetchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "condition" "WeatherCondition" NOT NULL,
    "temperature" DOUBLE PRECISION NOT NULL,
    "feelsLike" DOUBLE PRECISION NOT NULL,
    "humidity" INTEGER NOT NULL,
    "windSpeed" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "WeatherHourlyForecast_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "WeatherHourlyForecast_apiaryId_idx" ON "WeatherHourlyForecast"("apiaryId");

-- CreateIndex
CREATE INDEX "WeatherHourlyForecast_timestamp_idx" ON "WeatherHourlyForecast"("timestamp");

-- CreateIndex
CREATE INDEX "WeatherHourlyForecast_apiaryId_timestamp_idx" ON "WeatherHourlyForecast"("apiaryId", "timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "WeatherHourlyForecast_apiaryId_timestamp_key" ON "WeatherHourlyForecast"("apiaryId", "timestamp");

-- AddForeignKey
ALTER TABLE "WeatherHourlyForecast" ADD CONSTRAINT "WeatherHourlyForecast_apiaryId_fkey" FOREIGN KEY ("apiaryId") REFERENCES "Apiary"("id") ON DELETE CASCADE ON UPDATE CASCADE;
