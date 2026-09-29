-- CreateTable
CREATE TABLE "HiveHubAlertNotification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "alertId" INTEGER NOT NULL,
    "severity" TEXT NOT NULL,
    "notifiedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HiveHubAlertNotification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "HiveHubAlertNotification_userId_deviceId_idx" ON "HiveHubAlertNotification"("userId", "deviceId");

-- CreateIndex
CREATE UNIQUE INDEX "HiveHubAlertNotification_userId_deviceId_alertId_key" ON "HiveHubAlertNotification"("userId", "deviceId", "alertId");

-- AddForeignKey
ALTER TABLE "HiveHubAlertNotification" ADD CONSTRAINT "HiveHubAlertNotification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
