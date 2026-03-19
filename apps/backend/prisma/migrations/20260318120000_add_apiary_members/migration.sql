-- CreateEnum
CREATE TYPE "ApiaryMemberRole" AS ENUM ('OWNER', 'EDITOR', 'VIEWER');

-- CreateTable
CREATE TABLE "ApiaryMember" (
    "id" TEXT NOT NULL,
    "apiaryId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "ApiaryMemberRole" NOT NULL DEFAULT 'VIEWER',
    "invitedById" TEXT NOT NULL,
    "inviteToken" TEXT,
    "invitedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "acceptedAt" TIMESTAMP(3),

    CONSTRAINT "ApiaryMember_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ApiaryMember_inviteToken_key" ON "ApiaryMember"("inviteToken");

-- CreateIndex
CREATE UNIQUE INDEX "ApiaryMember_apiaryId_userId_key" ON "ApiaryMember"("apiaryId", "userId");

-- CreateIndex
CREATE INDEX "ApiaryMember_userId_idx" ON "ApiaryMember"("userId");

-- CreateIndex
CREATE INDEX "ApiaryMember_apiaryId_idx" ON "ApiaryMember"("apiaryId");

-- CreateIndex
CREATE INDEX "ApiaryMember_inviteToken_idx" ON "ApiaryMember"("inviteToken");

-- AddForeignKey
ALTER TABLE "ApiaryMember" ADD CONSTRAINT "ApiaryMember_apiaryId_fkey" FOREIGN KEY ("apiaryId") REFERENCES "Apiary"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApiaryMember" ADD CONSTRAINT "ApiaryMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApiaryMember" ADD CONSTRAINT "ApiaryMember_invitedById_fkey" FOREIGN KEY ("invitedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- DataMigration: seed OWNER membership rows for all existing apiaries
INSERT INTO "ApiaryMember" ("id", "apiaryId", "userId", "role", "invitedById", "invitedAt", "acceptedAt")
SELECT
    gen_random_uuid()::text,
    "id",
    "userId",
    'OWNER'::"ApiaryMemberRole",
    "userId",
    NOW(),
    NOW()
FROM "Apiary";
