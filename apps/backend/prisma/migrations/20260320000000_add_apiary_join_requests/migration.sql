-- CreateEnum
CREATE TYPE "ApiaryJoinRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'DENIED');

-- CreateTable
CREATE TABLE "ApiaryJoinRequest" (
    "id"           TEXT NOT NULL,
    "requesterId"  TEXT NOT NULL,
    "apiaryId"     TEXT NOT NULL,
    "ownerEmail"   TEXT NOT NULL,
    "status"       "ApiaryJoinRequestStatus" NOT NULL DEFAULT 'PENDING',
    "approveToken" TEXT NOT NULL,
    "denyToken"    TEXT NOT NULL,
    "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ApiaryJoinRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ApiaryJoinRequest_approveToken_key" ON "ApiaryJoinRequest"("approveToken");

-- CreateIndex
CREATE UNIQUE INDEX "ApiaryJoinRequest_denyToken_key" ON "ApiaryJoinRequest"("denyToken");

-- CreateIndex
CREATE INDEX "ApiaryJoinRequest_requesterId_idx" ON "ApiaryJoinRequest"("requesterId");

-- CreateIndex
CREATE INDEX "ApiaryJoinRequest_apiaryId_idx" ON "ApiaryJoinRequest"("apiaryId");

-- AddForeignKey
ALTER TABLE "ApiaryJoinRequest" ADD CONSTRAINT "ApiaryJoinRequest_requesterId_fkey"
    FOREIGN KEY ("requesterId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApiaryJoinRequest" ADD CONSTRAINT "ApiaryJoinRequest_apiaryId_fkey"
    FOREIGN KEY ("apiaryId") REFERENCES "Apiary"("id") ON DELETE CASCADE ON UPDATE CASCADE;
