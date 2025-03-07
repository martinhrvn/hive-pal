/*
  Warnings:

  - Made the column `maxFrameCount` on table `Box` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Box" ALTER COLUMN "maxFrameCount" SET NOT NULL,
ALTER COLUMN "maxFrameCount" SET DEFAULT 10;
