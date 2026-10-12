-- AlterTable
ALTER TABLE "FeedingAction" ADD COLUMN     "amountG" DOUBLE PRECISION,
ADD COLUMN     "density" DOUBLE PRECISION,
ADD COLUMN     "enteredAmount" DOUBLE PRECISION,
ADD COLUMN     "enteredUnit" TEXT,
ADD COLUMN     "feedTypeId" TEXT,
ADD COLUMN     "sugarContent" DOUBLE PRECISION,
ADD COLUMN     "sugarG" DOUBLE PRECISION,
ADD COLUMN     "waterAddedMl" DOUBLE PRECISION;

-- CreateTable
CREATE TABLE "UserFeedType" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "form" TEXT NOT NULL,
    "density" DOUBLE PRECISION,
    "sugarContent" DOUBLE PRECISION NOT NULL,
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserFeedType_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "UserFeedType_userId_idx" ON "UserFeedType"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "UserFeedType_userId_label_key" ON "UserFeedType"("userId", "label");

-- AddForeignKey
ALTER TABLE "UserFeedType" ADD CONSTRAINT "UserFeedType_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
