-- CreateTable
CREATE TABLE "FeedingAction" (
    "id" TEXT NOT NULL,
    "actionId" TEXT NOT NULL,
    "feedType" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "unit" TEXT NOT NULL,
    "concentration" TEXT,

    CONSTRAINT "FeedingAction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TreatmentAction" (
    "id" TEXT NOT NULL,
    "actionId" TEXT NOT NULL,
    "product" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "unit" TEXT NOT NULL,
    "duration" TEXT,

    CONSTRAINT "TreatmentAction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FrameAction" (
    "id" TEXT NOT NULL,
    "actionId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,

    CONSTRAINT "FrameAction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "FeedingAction_actionId_key" ON "FeedingAction"("actionId");

-- CreateIndex
CREATE UNIQUE INDEX "TreatmentAction_actionId_key" ON "TreatmentAction"("actionId");

-- CreateIndex
CREATE UNIQUE INDEX "FrameAction_actionId_key" ON "FrameAction"("actionId");

-- AddForeignKey
ALTER TABLE "FeedingAction" ADD CONSTRAINT "FeedingAction_actionId_fkey" FOREIGN KEY ("actionId") REFERENCES "Action"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TreatmentAction" ADD CONSTRAINT "TreatmentAction_actionId_fkey" FOREIGN KEY ("actionId") REFERENCES "Action"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FrameAction" ADD CONSTRAINT "FrameAction_actionId_fkey" FOREIGN KEY ("actionId") REFERENCES "Action"("id") ON DELETE CASCADE ON UPDATE CASCADE;
