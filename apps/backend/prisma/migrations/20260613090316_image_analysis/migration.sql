-- CreateTable
CREATE TABLE "FrameAnalysis" (
    "id" TEXT NOT NULL,
    "photoId" TEXT NOT NULL,
    "result" JSONB NOT NULL,
    "modelVersion" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FrameAnalysis_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "FrameAnalysis_photoId_key" ON "FrameAnalysis"("photoId");

-- CreateIndex
CREATE INDEX "FrameAnalysis_photoId_idx" ON "FrameAnalysis"("photoId");

-- AddForeignKey
ALTER TABLE "FrameAnalysis" ADD CONSTRAINT "FrameAnalysis_photoId_fkey" FOREIGN KEY ("photoId") REFERENCES "Photo"("id") ON DELETE CASCADE ON UPDATE CASCADE;
