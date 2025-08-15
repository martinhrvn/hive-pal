-- CreateEnum
CREATE TYPE "WeatherCondition" AS ENUM ('CLEAR', 'PARTLY_CLOUDY', 'OVERCAST', 'FOG', 'DRIZZLE', 'RAIN', 'SNOW');

-- CreateTable
CREATE TABLE "Weather" (
    "id" TEXT NOT NULL,
    "apiaryId" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "fetchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "condition" "WeatherCondition" NOT NULL,
    "temperature" DOUBLE PRECISION NOT NULL,
    "feelsLike" DOUBLE PRECISION NOT NULL,
    "humidity" INTEGER NOT NULL,
    "windSpeed" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "Weather_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WeatherForecast" (
    "id" TEXT NOT NULL,
    "apiaryId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "fetchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "condition" "WeatherCondition" NOT NULL,
    "temperatureMin" DOUBLE PRECISION NOT NULL,
    "temperatureMax" DOUBLE PRECISION NOT NULL,
    "humidity" INTEGER NOT NULL,
    "windSpeed" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "WeatherForecast_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Weather_apiaryId_idx" ON "Weather"("apiaryId");

-- CreateIndex
CREATE INDEX "Weather_timestamp_idx" ON "Weather"("timestamp");

-- CreateIndex
CREATE INDEX "Weather_apiaryId_timestamp_idx" ON "Weather"("apiaryId", "timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "Weather_apiaryId_timestamp_key" ON "Weather"("apiaryId", "timestamp");

-- CreateIndex
CREATE INDEX "WeatherForecast_apiaryId_idx" ON "WeatherForecast"("apiaryId");

-- CreateIndex
CREATE INDEX "WeatherForecast_date_idx" ON "WeatherForecast"("date");

-- CreateIndex
CREATE INDEX "WeatherForecast_apiaryId_date_idx" ON "WeatherForecast"("apiaryId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "WeatherForecast_apiaryId_date_key" ON "WeatherForecast"("apiaryId", "date");

-- AddForeignKey
ALTER TABLE "Weather" ADD CONSTRAINT "Weather_apiaryId_fkey" FOREIGN KEY ("apiaryId") REFERENCES "Apiary"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WeatherForecast" ADD CONSTRAINT "WeatherForecast_apiaryId_fkey" FOREIGN KEY ("apiaryId") REFERENCES "Apiary"("id") ON DELETE CASCADE ON UPDATE CASCADE;
