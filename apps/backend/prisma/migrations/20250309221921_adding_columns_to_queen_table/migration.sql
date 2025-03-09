/*
  Warnings:

  - You are about to drop the column `markingColor` on the `Queen` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Queen" DROP COLUMN "markingColor",
ADD COLUMN     "color" TEXT,
ADD COLUMN     "marking" TEXT;
