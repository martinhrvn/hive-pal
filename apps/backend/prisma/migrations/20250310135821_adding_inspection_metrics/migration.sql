-- CreateTable
CREATE TABLE "HiveMetric" (
    "id" TEXT NOT NULL,
    "hiveId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "overallRating" DOUBLE PRECISION,
    "cappedBrood" INTEGER,
    "uncappedBrood" INTEGER,
    "honeyStores" INTEGER,
    "pollenStores" INTEGER,
    "queenSeen" BOOLEAN,
    "queenCells" INTEGER,
    "swarmCells" BOOLEAN NOT NULL,
    "supersedureCells" BOOLEAN NOT NULL,
    "warnings" TEXT[],

    CONSTRAINT "HiveMetric_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "HiveMetric" ADD CONSTRAINT "HiveMetric_hiveId_fkey" FOREIGN KEY ("hiveId") REFERENCES "Hive"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
