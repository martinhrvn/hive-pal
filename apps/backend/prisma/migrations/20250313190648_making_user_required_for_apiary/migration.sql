/*
  Warnings:

  - Made the column `userId` on table `Apiary` required. This step will fail if there are existing NULL values in that column.

*/
truncate table "Apiary" cascade;
-- DropForeignKey
ALTER TABLE "Apiary" DROP CONSTRAINT "Apiary_userId_fkey";

-- AlterTable
ALTER TABLE "Apiary" ALTER COLUMN "userId" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "Apiary" ADD CONSTRAINT "Apiary_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
