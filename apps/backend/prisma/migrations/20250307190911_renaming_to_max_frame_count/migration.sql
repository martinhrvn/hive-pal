/*
  Warnings:

  - You are about to drop the column `capacity` on the `Box` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Box" DROP COLUMN "capacity",
ADD COLUMN     "maxFrameCount" INTEGER;
